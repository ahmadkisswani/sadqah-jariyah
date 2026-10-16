import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import CloseIcon from "@mui/icons-material/Close";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import { CopyButton, ShareButton } from "./ShareButton";
import { RECITERS, type Reciter } from "../data/quran/reciters";
import type { AudioStatus } from "../hooks/useQuranAudio";
import { setSnackBottomOffset } from "../hooks/useSnack";
import { fonts } from "../theme";
import { toArabicNumber } from "../utils/arabic";
import { withDedication } from "../constants/dedication";

type Props = {
  surahName: string;
  ayahNumber: number;
  ayahText: string;
  /** رابط ملف الآية — يُستخدم في مشغّل النظام البديل. */
  ayahUrl: string;
  status: AudioStatus;
  error: string | null;
  position: number;
  duration: number;
  reciter: Reciter;
  bookmarked: boolean;
  canPrev: boolean;
  canNext: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onReciterChange: (id: string) => void;
  onToggleBookmark: () => void;
  onClose: () => void;
};

/** يحوّل الثواني إلى صيغة ٠:٠٠ بالأرقام العربية. */
function formatTime(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return toArabicNumber("0:00");
  const total = Math.floor(value);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return toArabicNumber(`${minutes}:${String(seconds).padStart(2, "0")}`);
}

/**
 * شريط التلاوة السفلي: تحكّم كامل بالآية المحدّدة (تشغيل، تنقّل، مشاركة، حفظ)
 * مع اختيار القارئ وشريط تقدّم، ومشغّل نظام بديل يعمل حين يرفض المتصفح (خاصة iOS).
 */
export function QuranAudioBar({
  surahName,
  ayahNumber,
  ayahText,
  ayahUrl,
  status,
  error,
  position,
  duration,
  reciter,
  bookmarked,
  canPrev,
  canNext,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onReciterChange,
  onToggleBookmark,
  onClose,
}: Props) {
  const [nativeOpen, setNativeOpen] = useState(false);
  const isActive = status === "playing" || status === "loading";
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));

  // نرفع الإشعارات فوق الشريط حتى لا تغطّي أزرار التحكّم على الجوال
  useEffect(() => {
    setSnackBottomOffset(isCompact ? 128 : 92);
    return () => setSnackBottomOffset(0);
  }, [isCompact]);

  const shareable = withDedication(
    `﴿ ${ayahText} ﴾\n\nسورة ${surahName} — آية ${toArabicNumber(ayahNumber)}`,
  );

  const statusLabel = error
    ? "تعذّر التشغيل — جرّب مشغّل النظام ⬅"
    : status === "loading"
      ? "جارٍ التحميل…"
      : isActive
        ? `يُتلى الآن — ${reciter.name}`
        : "متوقّف";

  return (
    <Paper
      component="section"
      aria-label="مشغّل التلاوة"
      elevation={10}
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: { xs: "calc(62px + env(safe-area-inset-bottom))", lg: 0 },
        zIndex: (t) => t.zIndex.appBar + 1,
        borderRadius: 0,
        borderTop: "1px solid",
        borderColor: "divider",
        px: { xs: 1.25, sm: 2 },
        py: { xs: 1, sm: 1.25 },
        backgroundImage: "none",
      }}
    >
      <Stack spacing={0.75}>
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Tooltip title={isActive ? "إيقاف مؤقت" : "تشغيل الآية"}>
            <IconButton
              onClick={onTogglePlay}
              color="primary"
              aria-label={isActive ? "إيقاف مؤقت للتلاوة" : "تشغيل التلاوة"}
              sx={{ bgcolor: "action.selected", "&:hover": { bgcolor: "action.selected" } }}
            >
              {status === "loading" ? (
                <CircularProgress size={20} aria-label="جارٍ تحميل التلاوة" />
              ) : isActive ? (
                <PauseIcon />
              ) : (
                <PlayArrowIcon />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="الآية السابقة">
            <span>
              <IconButton onClick={onPrev} disabled={!canPrev} aria-label="الآية السابقة" size="small">
                <SkipPreviousIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="الآية التالية">
            <span>
              <IconButton onClick={onNext} disabled={!canNext} aria-label="الآية التالية" size="small">
                <SkipNextIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Box sx={{ flexGrow: 1, minWidth: 0, px: 0.5 }}>
            <Typography
              variant="caption"
              noWrap
              aria-live="polite"
              sx={{ display: "block", fontFamily: fonts.naskh, fontWeight: 700 }}
            >
              سورة {surahName} — الآية {toArabicNumber(ayahNumber)}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ display: "block", color: error ? "error.main" : "text.secondary" }}
            >
              {statusLabel}
            </Typography>
          </Box>

          <ShareButton text={shareable} variant="icon" size="small" label="مشاركة الآية" />
          <Box sx={{ display: { xs: "none", sm: "inline-flex" } }}>
            <CopyButton text={shareable} variant="icon" size="small" label="نسخ الآية" />
          </Box>

          <Tooltip title={bookmarked ? "إزالة من المحفوظات" : "حفظ الآية"}>
            <IconButton
              onClick={onToggleBookmark}
              aria-label={bookmarked ? "إزالة من المحفوظات" : "حفظ الآية"}
              aria-pressed={bookmarked}
              color={bookmarked ? "secondary" : "default"}
              size="small"
            >
              {bookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="مشغّل النظام (بديل)">
            <IconButton
              onClick={() => setNativeOpen((v) => !v)}
              aria-label="إظهار مشغّل النظام"
              aria-pressed={nativeOpen}
              color={nativeOpen ? "primary" : "default"}
              size="small"
            >
              <AudiotrackIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="إغلاق المشغّل">
            <IconButton onClick={onClose} aria-label="إغلاق المشغّل" size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="center">
          <Select
            variant="standard"
            size="small"
            value={reciter.id}
            onChange={(event) => onReciterChange(String(event.target.value))}
            aria-label="اختيار القارئ"
            sx={{ minWidth: { xs: 118, sm: 170 }, fontSize: "0.8rem" }}
          >
            {RECITERS.map((item) => (
              <MenuItem key={item.id} value={item.id} sx={{ fontSize: "0.85rem" }}>
                {item.name}
              </MenuItem>
            ))}
          </Select>

          <Slider
            size="small"
            aria-label="موضع التلاوة"
            value={duration > 0 ? Math.min(position, duration) : 0}
            max={duration > 0 ? duration : 1}
            step={0.5}
            disabled={duration <= 0}
            onChange={(_event, value) => onSeek(value as number)}
            sx={{ flexGrow: 1, maxWidth: { xs: "none", sm: 420 } }}
          />

          <Typography
            variant="caption"
            sx={{ minWidth: 76, textAlign: "center", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {formatTime(position)} / {formatTime(duration)}
          </Typography>
        </Stack>

        {nativeOpen && (
          <Box sx={{ pt: 0.5 }}>
            <audio controls src={ayahUrl} preload="none" style={{ width: "100%", height: 36 }} />
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

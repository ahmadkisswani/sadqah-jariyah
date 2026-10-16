import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import { fonts } from "../theme";
import { toArabicNumber } from "../utils/arabic";
import { ShareButton } from "./ShareButton";
import { useSnack } from "../hooks/useSnack";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { withDedication } from "../constants/dedication";
import type { DailyContent } from "../hooks/useDailyContent";

/** بطاقة "ورد اليوم" — آية وذكر ودعاء وتذكير، ثابتة لكل يوم وتعمل دون اتصال. */
export function DailyWirdCard({ content, compact = false }: { content: DailyContent; compact?: boolean }) {
  const snack = useSnack();
  const [marked, setMarked] = useLocalStorage<Record<string, boolean>>("sj-daily-done", {});
  const done = Boolean(marked[content.dayKey]);

  const toggleDone = () => {
    setMarked((prev) => ({ ...prev, [content.dayKey]: !prev[content.dayKey] }));
    if (!done) snack("تقبّل الله منك، سجّلنا إتمام ورد اليوم.", "success");
  };

  const verseShare = withDedication(
    `ورد اليوم\n\n﴿ ${content.ayah.text} ﴾\nسورة ${content.ayah.surah} — آية ${toArabicNumber(content.ayah.ayah)}`,
  );

  return (
    <Paper sx={{ p: { xs: 2.5, sm: 3.5 }, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <EventAvailableIcon color="primary" aria-hidden />
          <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
            ورد اليوم
          </Typography>
        </Stack>
        <Chip label={content.dateLabel} size="small" variant="outlined" />
      </Stack>

      {/* الآية */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="secondary.dark" sx={{ fontWeight: 700 }}>
          آية اليوم
        </Typography>
        <Typography
          sx={{
            fontFamily: fonts.quran,
            fontSize: { xs: "1.5rem", sm: "1.8rem" },
            lineHeight: 2.3,
            my: 1.5,
          }}
        >
          ﴿ {content.ayah.text} ﴾
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
          <Chip
            label={`سورة ${content.ayah.surah} — آية ${toArabicNumber(content.ayah.ayah)}`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <ShareButton text={verseShare} label="مشاركة" size="small" />
        </Stack>
      </Box>

      <Divider sx={{ my: 2.5 }} />

      {/* الذكر */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="secondary.dark" sx={{ fontWeight: 700 }}>
          ذكر اليوم
        </Typography>
        <Typography
          sx={{ fontFamily: fonts.naskh, fontSize: { xs: "1.25rem", sm: "1.4rem" }, lineHeight: 2, my: 1 }}
        >
          {content.dhikr.text}
        </Typography>
        <Chip label={`التكرار: ${toArabicNumber(content.dhikr.count)} مرة`} size="small" variant="outlined" />
      </Box>

      <Divider sx={{ my: 2.5 }} />

      {/* الدعاء */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="overline" color="secondary.dark" sx={{ fontWeight: 700 }}>
          دعاء اليوم
        </Typography>
        <Typography
          sx={{ fontFamily: fonts.naskh, fontSize: { xs: "1.2rem", sm: "1.35rem" }, lineHeight: 2.1, my: 1 }}
        >
          {content.dua.text}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
          <Chip label={content.dua.source} size="small" variant="outlined" />
          <ShareButton text={withDedication(`دعاء اليوم\n\n${content.dua.text}`)} label="مشاركة" size="small" />
        </Stack>
      </Box>

      {!compact && (
        <>
          <Divider sx={{ my: 2.5 }} />
          <Box>
            <Typography variant="overline" color="secondary.dark" sx={{ fontWeight: 700 }}>
              تذكير
            </Typography>
            <Typography sx={{ lineHeight: 2, my: 1 }} color="text.secondary">
              {content.reminder}
            </Typography>
          </Box>
        </>
      )}

      <Divider sx={{ my: 2.5 }} />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Typography color="text.secondary" variant="body2">
          {done ? "أتممت ورد اليوم، تقبّل الله منك." : "علّم الورد عند إتمامه."}
        </Typography>
        <Button
          onClick={toggleDone}
          variant={done ? "outlined" : "contained"}
          color={done ? "secondary" : "primary"}
          startIcon={done ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
          aria-pressed={done}
        >
          {done ? "تم الورد" : "علّم كمُنجَز"}
        </Button>
      </Box>
    </Paper>
  );
}

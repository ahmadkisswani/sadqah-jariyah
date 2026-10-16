import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TextDecreaseIcon from "@mui/icons-material/TextDecrease";
import TextIncreaseIcon from "@mui/icons-material/TextIncrease";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { SURAHS } from "../data/quran/surahs";
import { fetchSurah, groupByPage, type SurahPayload } from "../data/quran/api";
import type { Ayah } from "../data/quran/types";
import { ayahAudioUrl } from "../data/quran/reciters";
import { AyahCard } from "../components/AyahCard";
import { MushafPage } from "../components/MushafPage";
import { QuranAudioBar } from "../components/QuranAudioBar";
import { EmptyState } from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";
import { usePageTitle } from "../hooks/usePageTitle";
import { useBookmarks } from "../hooks/useBookmarks";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useSnack } from "../hooks/useSnack";
import { useQuranAudio, type AudioTarget } from "../hooks/useQuranAudio";
import { fonts } from "../theme";
import { toArabicNumber } from "../utils/arabic";

/** طرق العرض: صفحات مصحف حقيقية، السورة كاملة في صفحة واحدة، أو بطاقة لكل آية. */
type ViewMode = "pages" | "flow" | "cards";

export default function QuranPage() {
  const { surahNumber } = useParams<{ surahNumber?: string }>();
  const number = surahNumber ? Number(surahNumber) : undefined;

  if (number && Number.isFinite(number)) {
    return <QuranReader number={number} />;
  }
  return <SurahIndex />;
}

/* ---------------------------------- الفهرس ---------------------------------- */

function SurahIndex() {
  usePageTitle("القرآن الكريم");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [lastRead, setLastRead] = useLocalStorage<{ surah: number; ayah: number } | null>(
    "sj-last-read",
    null,
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return SURAHS;
    const normalized = q.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه");
    return SURAHS.filter((s) => {
      const name = s.name.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه");
      return (
        name.includes(normalized) ||
        s.englishName.toLowerCase().includes(q.toLowerCase()) ||
        String(s.number).includes(q)
      );
    });
  }, [query]);

  return (
    <Stack spacing={4}>
      <SectionHeader
        title="القرآن الكريم"
        subtitle="اقرأ كتاب الله بتدبّر وطمأنينة، واحفظ الآيات وشاركها."
      />

      {lastRead && (
        <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider", display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <MenuBookIcon color="primary" />
            <Box>
              <Typography sx={{ fontWeight: 700 }}>متابعة القراءة</Typography>
              <Typography variant="body2" color="text.secondary">
                سورة {SURAHS.find((s) => s.number === lastRead.surah)?.name} — الآية{" "}
                {toArabicNumber(lastRead.ayah)}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            onClick={() =>
              navigate(`/quran/${lastRead.surah}`, { state: { ayah: lastRead.ayah } })
            }
          >
            متابعة
          </Button>
        </Paper>
      )}

      <TextField
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن سورة بالاسم أو الرقم…"
        aria-label="بحث في السور"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon aria-hidden />
            </InputAdornment>
          ),
        }}
      />

      {filtered.length === 0 ? (
        <EmptyState kind="search" description="جرّب البحث باسم آخر أو برقم السورة." />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {filtered.map((s) => (
            <Paper
              key={s.number}
              component="button"
              onClick={() => navigate(`/quran/${s.number}`)}
              aria-label={`سورة ${s.name}، ${s.ayahCount} آية، ${s.revelation}`}
              sx={{
                textAlign: "right",
                cursor: "pointer",
                border: "1px solid",
                borderColor: "divider",
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                font: "inherit",
                color: "inherit",
                transition: "border-color .2s ease, transform .2s ease",
                "&:hover": { borderColor: "primary.main", transform: "translateY(-2px)" },
              }}
            >
              <Box
                aria-hidden
                sx={{
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  borderRadius: "12px",
                  bgcolor: "rgba(31,93,76,0.10)",
                  color: "primary.main",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                }}
              >
                {toArabicNumber(s.number)}
              </Box>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography sx={{ fontFamily: fonts.naskh, fontWeight: 700, fontSize: "1.1rem" }}>
                  سورة {s.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {s.revelation} • {toArabicNumber(s.ayahCount)} آية
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Stack>
  );
}

/* ---------------------------------- القارئ ---------------------------------- */

function QuranReader({ number }: { number: number }) {
  const meta = SURAHS.find((s) => s.number === number);
  usePageTitle(meta ? `سورة ${meta.name}` : "القرآن الكريم");
  const navigate = useNavigate();
  const location = useLocation();
  const snack = useSnack();
  const { isBookmarked, toggle } = useBookmarks();

  const [fontSize, setFontSize] = useLocalStorage<number>("sj-quran-font", 26);
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>("sj-quran-view", "pages");
  const [, setLastRead] = useLocalStorage<{ surah: number; ayah: number } | null>("sj-last-read", null);

  const [surah, setSurah] = useState<SurahPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);

  // موضع الآيات في الصفحة — للانتقال إليها عند التلاوة أو عند "متابعة القراءة"
  const ayahNodes = useRef(new Map<number, HTMLElement>());
  const registerAyah = useCallback((ayahNumber: number, node: HTMLElement | null) => {
    if (node) ayahNodes.current.set(ayahNumber, node);
    else ayahNodes.current.delete(ayahNumber);
  }, []);

  const scrollToAyah = useCallback((ayahNumber: number) => {
    const node = ayahNodes.current.get(ayahNumber);
    if (!node) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
  }, []);

  // مراجع مستقرة يحتاجها نداء انتهاء المقطع (تمنع إعادة تسجيل المستمعين)
  const audioRef = useRef<AudioTarget | null>(null);
  const audioPlayRef = useRef<((ayah: Ayah) => Promise<void> | void) | null>(null);
  const audioCloseRef = useRef<(() => void) | null>(null);

  /**
   * عند انتهاء مقطع الآية ننتقل تلقائيًا للآية التالية — فيُسمع الجزء متصلًا،
   * ولأنّ عنصر الصوت نفسه يُستخدم دائمًا فإن iOS يسمح بهذا التشغيل البرمجي.
   */
  const handleEnded = useCallback(() => {
    const current = audioRef.current;
    if (!surah || !current || current.surah !== number) return;
    const nextAyah = surah.ayahs[current.ayah];
    if (!nextAyah) {
      audioCloseRef.current?.();
      snack(`أتممت سورة ${meta?.name ?? ""} — تقبّل الله`, "success");
      return;
    }
    void audioPlayRef.current?.(nextAyah);
  }, [meta?.name, number, snack, surah]);

  const audio = useQuranAudio({ onEnded: handleEnded });

  useEffect(() => {
    audioRef.current = audio.current;
  }, [audio.current]);

  const load = useCallback(() => {
    if (!meta) return;
    setLoading(true);
    setError(false);
    fetchSurah(number)
      .then((data) => {
        setSurah(data);
        setLastRead((prev) => ({ surah: number, ayah: prev?.surah === number ? prev.ayah : 1 }));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [meta, number, setLastRead]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = useMemo(() => (surah ? groupByPage(surah.ayahs) : []), [surah]);

  const playingAyah = audio.current && audio.current.surah === number ? audio.current.ayah : null;
  const activeAyahNumber = playingAyah ?? selectedAyah;
  const activeAyah = useMemo(
    () => surah?.ayahs.find((ayah) => ayah.numberInSurah === activeAyahNumber) ?? null,
    [activeAyahNumber, surah],
  );

  const selectAyah = useCallback(
    (ayahNumber: number) => {
      setSelectedAyah(ayahNumber);
      setLastRead({ surah: number, ayah: ayahNumber });
    },
    [number, setLastRead],
  );

  const playAyah = useCallback(
    (ayah: Ayah) => {
      selectAyah(ayah.numberInSurah);
      return audio.play({ surah: number, ayah: ayah.numberInSurah, global: ayah.number });
    },
    [audio, number, selectAyah],
  );

  useEffect(() => {
    audioPlayRef.current = playAyah;
  }, [playAyah]);

  const stopAndClose = useCallback(() => {
    audio.stop();
    setSelectedAyah(null);
  }, [audio]);

  useEffect(() => {
    audioCloseRef.current = stopAndClose;
  }, [stopAndClose]);

  // متابعة القراءة: الانتقال إلى الآية المحفوظة عند الوصول من الصفحة الرئيسية
  const jumpAyah = (location.state as { ayah?: number } | null)?.ayah;
  useEffect(() => {
    if (!surah || !jumpAyah || jumpAyah < 1 || jumpAyah > surah.ayahs.length) return;
    setSelectedAyah(jumpAyah);
    const timer = window.setTimeout(() => scrollToAyah(jumpAyah), 150);
    return () => window.clearTimeout(timer);
  }, [jumpAyah, scrollToAyah, surah]);

  // متابعة الآية المتلوّة تلقائيًا داخل الصفحة
  useEffect(() => {
    if (playingAyah == null) return;
    scrollToAyah(playingAyah);
  }, [playingAyah, scrollToAyah]);

  // شاشة القفل: اسم السورة والقارئ + أزرار التشغيل
  useEffect(() => {
    if (!("mediaSession" in navigator) || !meta) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: activeAyahNumber
          ? `سورة ${meta.name} — الآية ${toArabicNumber(activeAyahNumber)}`
          : `سورة ${meta.name}`,
        artist: audio.reciter.name,
        album: "صدقة جارية",
      });
    } catch {
      /* غير مدعوم على هذا المتصفح */
    }
  }, [activeAyahNumber, audio.reciter.name, meta]);

  const toggleActive = useCallback(() => {
    if (!activeAyah) return;
    audio.toggle({ surah: number, ayah: activeAyah.numberInSurah, global: activeAyah.number });
  }, [activeAyah, audio, number]);

  const goAyah = useCallback(
    (delta: 1 | -1) => {
      if (!surah || activeAyahNumber == null) return;
      const target = surah.ayahs[activeAyahNumber - 1 + delta];
      if (target) void playAyah(target);
    },
    [activeAyahNumber, playAyah, surah],
  );

  const playSurah = useCallback(() => {
    const first = surah?.ayahs[0];
    if (first) void playAyah(first);
  }, [playAyah, surah]);

  // أزرار شاشة القفل في الجوال — تُسجَّل مرّة واحدة عبر مرجع محدَّث
  const mediaHandlers = useRef({
    toggleActive: () => {},
    prev: () => {},
    next: () => {},
    pause: () => {},
  });

  useEffect(() => {
    mediaHandlers.current = {
      toggleActive,
      prev: () => goAyah(-1),
      next: () => goAyah(1),
      pause: () => audio.pause(),
    };
  }, [audio, goAyah, toggleActive]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    const trySet = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        session.setActionHandler(action, handler);
      } catch {
        /* إجراء غير مدعوم — نتجاهله */
      }
    };
    trySet("play", () => mediaHandlers.current.toggleActive());
    trySet("pause", () => mediaHandlers.current.pause());
    trySet("previoustrack", () => mediaHandlers.current.prev());
    trySet("nexttrack", () => mediaHandlers.current.next());
    return () => {
      trySet("play", null);
      trySet("pause", null);
      trySet("previoustrack", null);
      trySet("nexttrack", null);
    };
  }, []);

  if (!meta) {
    return (
      <EmptyState
        kind="error"
        title="لم نجد هذه السورة"
        description="قد يكون الرابط غير صحيح."
        actionLabel="الرجوع إلى فهرس السور"
        actionTo="/quran"
      />
    );
  }

  const previousMeta = SURAHS.find((s) => s.number === number - 1);
  const nextMeta = SURAHS.find((s) => s.number === number + 1);
  const barVisible = activeAyah !== null;

  return (
    <Stack spacing={3} sx={{ pb: barVisible ? { xs: 24, sm: 18, lg: 10 } : 0 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <IconButton aria-label="رجوع إلى فهرس السور" onClick={() => navigate("/quran")}>
          <ArrowForwardIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          القرآن الكريم
        </Typography>
      </Stack>

      <Paper sx={{ p: { xs: 2.5, md: 3.5 }, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontFamily: fonts.naskh, fontWeight: 800 }}>
                سورة {meta.name}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Chip label={meta.revelation} size="small" variant="outlined" />
                <Chip label={`${toArabicNumber(meta.ayahCount)} آية`} size="small" variant="outlined" />
                {pages[0] && (
                  <Chip
                    label={`الجزء ${toArabicNumber(pages[0].juz)}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>
            </Box>

            {/* تحكم حجم الخط */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="تصغير الخط">
                <IconButton aria-label="تصغير حجم الخط" onClick={() => setFontSize((v) => Math.max(18, v - 2))}>
                  <TextDecreaseIcon />
                </IconButton>
              </Tooltip>
              <Typography variant="body2" sx={{ minWidth: 34, textAlign: "center" }}>
                {fontSize}
              </Typography>
              <Tooltip title="تكبير الخط">
                <IconButton aria-label="تكبير حجم الخط" onClick={() => setFontSize((v) => Math.min(44, v + 2))}>
                  <TextIncreaseIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Slider
            aria-label="حجم خط القرآن"
            value={fontSize}
            min={18}
            max={44}
            step={2}
            onChange={(_e, v) => setFontSize(v as number)}
            sx={{ maxWidth: 320 }}
          />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <ToggleButtonGroup
              size="small"
              exclusive
              value={viewMode}
              onChange={(_e, value: ViewMode | null) => value && setViewMode(value)}
              aria-label="طريقة عرض المصحف"
            >
              <ToggleButton value="pages" aria-label="عرض صفحات المصحف">
                <MenuBookIcon fontSize="small" sx={{ ml: 0.75 }} />
                صفحات
              </ToggleButton>
              <ToggleButton value="flow" aria-label="عرض السورة متصلة في صفحة واحدة">
                <FormatAlignJustifyIcon fontSize="small" sx={{ ml: 0.75 }} />
                متصل
              </ToggleButton>
              <ToggleButton value="cards" aria-label="عرض الآيات في بطاقات">
                <ViewModuleIcon fontSize="small" sx={{ ml: 0.75 }} />
                بطاقات
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="contained"
              startIcon={<HeadphonesIcon />}
              onClick={playSurah}
              disabled={!surah || (audio.isActive && playingAyah === 1)}
            >
              استماع للسورة
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            لمس الآية لتحديدها، ولمس رقمها في الدائرة لتشغيل تلاوتها. تنتقل التلاوة تلقائيًا
            بين الآيات حتى نهاية السورة.
          </Typography>
        </Stack>
      </Paper>

      {audio.error && (
        <Alert severity="warning" icon={<HeadphonesIcon />}>
          {audio.error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
          <CircularProgress aria-label="جارٍ تحميل السورة" />
        </Box>
      )}

      {error && !loading && (
        <>
          <EmptyState kind="error" description="تعذّر تحميل السورة، حاول مرة أخرى." />
          <Stack direction="row" justifyContent="center">
            <Button variant="contained" onClick={load}>
              إعادة المحاولة
            </Button>
          </Stack>
        </>
      )}

      {surah && !loading && (
        <>
          {viewMode === "cards" ? (
            <>
              {number !== 1 && number !== 9 && (
                <Typography
                  sx={{
                    fontFamily: fonts.quran,
                    textAlign: "center",
                    fontSize: "1.4rem",
                    color: "text.secondary",
                  }}
                >
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </Typography>
              )}

              <Box>
                {surah.ayahs.map((ayah) => (
                  <Box key={ayah.numberInSurah} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <AyahCard
                        text={ayah.text}
                        surahNumber={number}
                        surahName={meta.name}
                        ayahNumber={ayah.numberInSurah}
                        fontSize={fontSize}
                        bookmarked={isBookmarked(number, ayah.numberInSurah)}
                        onToggleBookmark={() =>
                          toggle({
                            surah: number,
                            surahName: meta.name,
                            ayah: ayah.numberInSurah,
                            text: ayah.text,
                          })
                        }
                      />
                    </Box>
                    <Tooltip title={playingAyah === ayah.numberInSurah ? "إيقاف" : "استماع للآية"}>
                      <IconButton
                        aria-label={`استماع للآية ${ayah.numberInSurah}`}
                        onClick={() =>
                          playingAyah === ayah.numberInSurah
                            ? toggleActive()
                            : void playAyah(ayah)
                        }
                        color={playingAyah === ayah.numberInSurah ? "primary" : "default"}
                        sx={{ mt: 1.5 }}
                      >
                        {playingAyah === ayah.numberInSurah ? <PauseIcon /> : <PlayArrowIcon />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            </>
          ) : viewMode === "pages" ? (
            <Stack spacing={3}>
              {pages.map((page) => (
                <MushafPage
                  key={page.page}
                  surahNumber={number}
                  surahName={meta.name}
                  revelation={meta.revelation}
                  ayahCount={meta.ayahCount}
                  juz={page.juz}
                  pageNumber={page.page}
                  ayahs={page.ayahs}
                  showSurahHeader={page.ayahs[0]?.numberInSurah === 1}
                  fontSize={fontSize}
                  playingAyah={playingAyah}
                  selectedAyah={selectedAyah}
                  onSelectAyah={selectAyah}
                  onTogglePlay={(ayah) =>
                    playingAyah === ayah.numberInSurah ? toggleActive() : void playAyah(ayah)
                  }
                  registerAyah={registerAyah}
                />
              ))}
            </Stack>
          ) : (
            <MushafPage
              surahNumber={number}
              surahName={meta.name}
              revelation={meta.revelation}
              ayahCount={meta.ayahCount}
              juz={pages[0]?.juz}
              ayahs={surah.ayahs}
              showSurahHeader
              fontSize={fontSize}
              playingAyah={playingAyah}
              selectedAyah={selectedAyah}
              onSelectAyah={selectAyah}
              onTogglePlay={(ayah) =>
                playingAyah === ayah.numberInSurah ? toggleActive() : void playAyah(ayah)
              }
              registerAyah={registerAyah}
            />
          )}

          <Divider />

          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              startIcon={<ArrowForwardIcon />}
              disabled={!previousMeta}
              onClick={() => navigate(`/quran/${number - 1}`)}
            >
              {previousMeta ? `سورة ${previousMeta.name}` : "السورة السابقة"}
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              endIcon={<ArrowBackIcon />}
              disabled={!nextMeta}
              onClick={() => navigate(`/quran/${number + 1}`)}
            >
              {nextMeta ? `سورة ${nextMeta.name}` : "السورة التالية"}
            </Button>
          </Stack>
        </>
      )}

      {activeAyah && (
        <QuranAudioBar
          surahName={meta.name}
          ayahNumber={activeAyah.numberInSurah}
          ayahText={activeAyah.text}
          ayahUrl={ayahAudioUrl(audio.reciter, activeAyah.number)}
          status={audio.status}
          error={audio.error}
          position={audio.position}
          duration={audio.duration}
          reciter={audio.reciter}
          bookmarked={isBookmarked(number, activeAyah.numberInSurah)}
          canPrev={activeAyah.numberInSurah > 1}
          canNext={activeAyah.numberInSurah < meta.ayahCount}
          onTogglePlay={toggleActive}
          onPrev={() => goAyah(-1)}
          onNext={() => goAyah(1)}
          onSeek={audio.seek}
          onReciterChange={audio.setReciter}
          onToggleBookmark={() =>
            toggle({
              surah: number,
              surahName: meta.name,
              ayah: activeAyah.numberInSurah,
              text: activeAyah.text,
            })
          }
          onClose={stopAndClose}
        />
      )}
    </Stack>
  );
}

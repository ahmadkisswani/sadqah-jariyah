import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import { useNavigate, useParams } from "react-router-dom";
import { SURAHS } from "../data/quran/surahs";
import { fetchSurah, type SurahPayload } from "../data/quran/api";
import { AyahCard } from "../components/AyahCard";
import { EmptyState } from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";
import { usePageTitle } from "../hooks/usePageTitle";
import { useBookmarks } from "../hooks/useBookmarks";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { fonts } from "../theme";
import { toArabicNumber } from "../utils/arabic";

const AUDIO_BASE = "https://cdn.islamic.network/quran/audio/128/ar.alafasy";

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
          <Button variant="contained" onClick={() => navigate(`/quran/${lastRead.surah}`)}>
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
  const { isBookmarked, toggle } = useBookmarks();
  const [fontSize, setFontSize] = useLocalStorage<number>("sj-quran-font", 26);
  const [, setLastRead] = useLocalStorage<{ surah: number; ayah: number } | null>("sj-last-read", null);

  const [surah, setSurah] = useState<SurahPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // إيقاف الصوت عند مغادرة السورة
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, [number]);

  const playAyah = (ayahNumber: number, globalNumber: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingAyah === ayahNumber) {
      audio.pause();
      setPlayingAyah(null);
      return;
    }
    audio.src = `${AUDIO_BASE}/${globalNumber}.mp3`;
    audio.play().then(() => setPlayingAyah(ayahNumber)).catch(() => setPlayingAyah(null));
    setLastRead({ surah: number, ayah: ayahNumber });
  };

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

  return (
    <Stack spacing={3}>
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

          <audio ref={audioRef} onEnded={() => setPlayingAyah(null)} preload="none" />
        </Stack>
      </Paper>

      {loading && (
        <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
          <CircularProgress aria-label="جارٍ تحميل السورة" />
        </Box>
      )}

      {error && !loading && (
        <>
          <EmptyState
            kind="error"
            description="تعذّر تحميل السورة، حاول مرة أخرى."
          />
          <Stack direction="row" justifyContent="center">
            <Button variant="contained" onClick={load}>
              إعادة المحاولة
            </Button>
          </Stack>
        </>
      )}

      {surah && !loading && (
        <>
          {number !== 1 && number !== 9 && (
            <Typography
              sx={{ fontFamily: fonts.quran, textAlign: "center", fontSize: "1.4rem", color: "text.secondary" }}
            >
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </Typography>
          )}

          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
            <Tooltip title="كتم/تشغيل التلاوة لكل آية عند الضغط على زر الاستماع">
              <Chip icon={<HeadphonesIcon />} label="استماع (يتطلب اتصالًا)" variant="outlined" size="small" />
            </Tooltip>
          </Stack>

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
                    onClick={() => playAyah(ayah.numberInSurah, ayah.number)}
                    color={playingAyah === ayah.numberInSurah ? "primary" : "default"}
                    sx={{ mt: 1.5 }}
                  >
                    {playingAyah === ayah.numberInSurah ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            ))}
          </Box>

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
    </Stack>
  );
}

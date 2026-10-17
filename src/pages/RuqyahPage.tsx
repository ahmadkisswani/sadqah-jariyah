import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { ruqyahVerses, ruqyahDuas, ruqyahAudio, type RuqyahItem } from "../data/ruqyah";
import { SectionHeader } from "../components/SectionHeader";
import { ShareButton, CopyButton } from "../components/ShareButton";
import { usePageTitle } from "../hooks/usePageTitle";
import { useSnack } from "../hooks/useSnack";
import { fonts } from "../theme";
import { withDedication } from "../constants/dedication";
import { toArabicNumber } from "../utils/arabic";

export default function RuqyahPage() {
  usePageTitle("الرقية الشرعية");
  // تسجيل واحد فقط يُشغَّل في كل مرة: عند تشغيل تسجيل جديد يُزال المشغّل السابق
  // من الصفحة تمامًا (لا يمكن إيقاف مشغّل خارجي مستضاف عبر iframe بغير إزالته).
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);

  return (
    <Stack spacing={4}>
      <SectionHeader
        title="الرقية الشرعية"
        subtitle="آيات من القرآن الكريم وأدعية مأثورة تُقرأ ضمن الرقية."
      />

      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{ alignItems: "center" }}
      >
        الرقية الشرعية تكون بقراءة القرآن الكريم والدعاء لله تعالى، مع اليقين بأن النفع والشفاء بيد الله
        وحده. وهي لا تغني عن مراجعة الطبيب عند الحاجة.
      </Alert>

      {/* الآيات */}
      <Box component="section" aria-labelledby="ruqyah-verses">
        <SectionHeader title="آيات من القرآن الكريم" align="start" />
        <Stack spacing={2}>
          {ruqyahVerses.map((item, i) => (
            <RuqyahBlock key={item.id} item={item} index={i} actionLabel="نسخ الآيات" />
          ))}
        </Stack>
      </Box>

      <Divider />

      {/* الأدعية */}
      <Box component="section" aria-labelledby="ruqyah-duas">
        <SectionHeader title="أدعية مأثورة" align="start" />
        <Stack spacing={2}>
          {ruqyahDuas.map((item, i) => (
            <RuqyahBlock key={item.id} item={item} index={i} actionLabel="نسخ الدعاء" />
          ))}
        </Stack>
      </Box>

      <Divider />

      {/* الاستماع */}
      <Box component="section" aria-labelledby="ruqyah-audio">
        <SectionHeader
          title="الاستماع إلى الرقية الشرعية"
          align="start"
          subtitle="تتطلب هذه التسجيلات اتصالًا بالإنترنت، ويُشغَّل تسجيل واحد في كل مرة."
        />
        <Stack spacing={2}>
          {ruqyahAudio.map((audio) => (
            <AudioCard
              key={audio.id}
              title={audio.title}
              reciter={audio.reciter}
              url={audio.url}
              active={activeAudioId === audio.id}
              onPlay={() => setActiveAudioId(audio.id)}
              onStop={() => setActiveAudioId(null)}
            />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

function RuqyahBlock({ item, index, actionLabel }: { item: RuqyahItem; index: number; actionLabel: string }) {
  const fullText = item.lines.join("\n");
  return (
    <Paper component="article" sx={{ p: { xs: 2.5, sm: 3 }, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" gap={1}>
        <Chip label={toArabicNumber(index + 1)} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
          {item.title}
        </Typography>
        {item.note && <Chip label={item.note} size="small" variant="outlined" />}
      </Stack>

      <Stack spacing={1.25} sx={{ mb: 2.5 }}>
        {item.lines.map((line, i) => (
          <Typography key={i} sx={{ fontFamily: fonts.quran, fontSize: { xs: "1.25rem", sm: "1.4rem" }, lineHeight: 2.1 }}>
            {line}
          </Typography>
        ))}
      </Stack>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        <CopyButton text={fullText} label={actionLabel} size="small" />
        <ShareButton text={withDedication(fullText)} label="مشاركة" size="small" />
      </Stack>
    </Paper>
  );
}

type AudioCardProps = {
  title: string;
  reciter: string;
  url: string;
  /** هل هذا هو التسجيل قيد التشغيل الآن؟ */
  active: boolean;
  onPlay: () => void;
  onStop: () => void;
};

/**
 * بطاقة تسجيل: يشغّل المشغّل المستضاف (iframe) عند الطلب ويُزال بالكامل عند
 * إيقافه أو عند تشغيل تسجيل آخر — فلا تتشغّل تسجيلات متعدّدة معًا.
 */
function AudioCard({ title, reciter, url, active, onPlay, onStop }: AudioCardProps) {
  const snack = useSnack();

  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 }, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
        <Box
          aria-hidden
          sx={{
            width: 46,
            height: 46,
            borderRadius: "14px",
            bgcolor: active ? "rgba(201,162,75,0.18)" : "rgba(31,93,76,0.10)",
            color: active ? "secondary.dark" : "primary.main",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            transition: "background-color .2s ease",
          }}
        >
          <HeadphonesIcon />
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 160 }}>
          <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {reciter}
          </Typography>
        </Box>
        {active ? (
          <Button variant="outlined" color="inherit" startIcon={<StopIcon />} onClick={onStop}>
            إيقاف
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={() => {
              onPlay();
              snack("جارٍ تحميل التسجيل…", "info");
            }}
          >
            تشغيل
          </Button>
        )}
      </Stack>

      <Collapse in={active} unmountOnExit timeout={200}>
        <Box sx={{ mt: 2, borderRadius: 2, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
          <Box
            component="iframe"
            src={url}
            title={`${title} — ${reciter}`}
            loading="lazy"
            allow="autoplay"
            sx={{ width: "100%", height: 300, border: 0, display: "block" }}
          />
        </Box>
      </Collapse>
    </Paper>
  );
}

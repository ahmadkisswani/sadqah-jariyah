import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import ExploreIcon from "@mui/icons-material/Explore";
import PlaceIcon from "@mui/icons-material/Place";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PublicIcon from "@mui/icons-material/Public";
import CalculateIcon from "@mui/icons-material/Calculate";
import UpdateIcon from "@mui/icons-material/Update";
import { Link as RouterLink } from "react-router-dom";
import { STRINGS, type Lang } from "../../data/prayer/labels";
import { primaryText } from "../../theme";

type Props = {
  lang: Lang;
  timezone: string | null;
  methodLabel: string | null;
  stale: boolean;
  loading: boolean;
  locationLabel: string;
};

const COPY = {
  ar: {
    title: "عن هذه المواقيت",
    calculated: "محسوبة فلكيًا — ليست أذان مسجدك",
    timezone: "المنطقة الزمنية",
    method: "طريقة الحساب",
    source: "المصدر",
    stale: "تُعرض آخر نسخة محفوظة على جهازك",
    fresh: "متزامنة مع خدمة المواقيت",
    tools: "أدوات قريبة",
    qibla: "اتجاه القبلة",
    mosques: "المساجد القريبة",
    hijri: "التقويم الهجري",
    location: "الموقع",
  },
  en: {
    title: "About these times",
    calculated: "Astronomical calculation — not your mosque's adhan",
    timezone: "Timezone",
    method: "Calculation method",
    source: "Source",
    stale: "Showing the last copy saved on your device",
    fresh: "Synced with the prayer times service",
    tools: "Nearby tools",
    qibla: "Qibla direction",
    mosques: "Nearby mosques",
    hijri: "Hijri calendar",
    location: "Location",
  },
} as const;

/**
 * بطاقة توضيحية صغيرة تحت جدول المواقيت:
 * تفصل بين "الوقت المحسوب" و"أذان المسجد"، وتعرض المنطقة الزمنية والطريقة،
 * وتجمع مداخل القبلة والمساجد والتقويم الهجري.
 */
export function PrayerInfoCard({ lang, timezone, methodLabel, stale, loading, locationLabel }: Props) {
  const copy = COPY[lang];
  return (
    <Paper
      component="section"
      aria-label={copy.title}
      sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
    >
      <Stack spacing={1.75}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 800 }}>
            {copy.title}
          </Typography>
          <Chip
            size="small"
            color="secondary"
            variant="outlined"
            icon={<CalculateIcon />}
            label={copy.calculated}
          />
          {!loading ? (
            <Chip
              size="small"
              variant="outlined"
              color={stale ? "warning" : "success"}
              icon={<UpdateIcon />}
              label={stale ? copy.stale : copy.fresh}
            />
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
          {timezone ? (
            <Chip size="small" variant="outlined" icon={<PublicIcon />} label={`${copy.timezone}: ${timezone}`} />
          ) : null}
          {methodLabel ? (
            <Chip
              size="small"
              variant="outlined"
              icon={<CalculateIcon />}
              label={`${copy.method}: ${methodLabel}`}
            />
          ) : null}
          <Chip size="small" variant="outlined" icon={<PlaceIcon />} label={`${copy.location}: ${locationLabel}`} />
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {STRINGS.accuracyNote[lang]} {STRINGS.hijriNote[lang]}
        </Typography>

        <Divider />

        <Box>
          <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {copy.tools}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
            <Button
              component={RouterLink}
              to="/qibla"
              size="small"
              variant="outlined"
              startIcon={<ExploreIcon />}
            >
              {copy.qibla}
            </Button>
            <Button
              component={RouterLink}
              to="/mosques"
              size="small"
              variant="outlined"
              startIcon={<PlaceIcon sx={{ color: (theme) => primaryText(theme.palette.mode) }} />}
            >
              {copy.mosques}
            </Button>
            <Button
              component={RouterLink}
              to="/hijri-calendar"
              size="small"
              variant="outlined"
              startIcon={<CalendarMonthIcon />}
            >
              {copy.hijri}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

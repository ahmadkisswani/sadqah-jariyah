import { Box, Button, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import PublicIcon from "@mui/icons-material/Public";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { IslamicPattern } from "../IslamicPattern";
import { LiveCountdown } from "./LiveCountdown";
import { srOnly } from "./shared";
import { STRINGS, prayerLabel, type Lang } from "../../data/prayer/labels";
import type { DayTimings } from "../../data/prayer/api";
import type { ResolvedLocation } from "../../data/prayer/location";
import type { PrayerInstant, TimeFormat } from "../../utils/prayer";
import { formatGregorianLong, formatHijri } from "../../utils/prayer";

type Props = {
  nowMs: number;
  lang: Lang;
  timeFormat: TimeFormat;
  next: PrayerInstant | null;
  current: PrayerInstant | null;
  location: ResolvedLocation | null;
  timezone: string | null;
  hijri: DayTimings["hijri"] | null;
  todayKey: string;
  loading: boolean;
  onOpenLocation: () => void;
};

/** البطاقة الرئيسية: الصلاة القادمة + العدّ التنازلي + الموقع والتاريخان. */
export function NextPrayerCard({
  nowMs,
  lang,
  timeFormat,
  next,
  current,
  location,
  timezone,
  hijri,
  todayKey,
  loading,
  onOpenLocation,
}: Props) {
  const cityLine = location
    ? lang === "ar"
      ? `${location.city}${location.country ? `، ${location.country}` : ""}`
      : `${location.cityEn}${location.countryEn ? `, ${location.countryEn}` : ""}`
    : STRINGS.location[lang];

  const nextLabel = next ? prayerLabel(next.key) : null;
  const currentLabel = current ? prayerLabel(current.key) : null;
  const countdownLabel = nextLabel
    ? lang === "ar"
      ? `الوقت المتبقّي حتى ${nextLabel.ar}`
      : `Time remaining until ${nextLabel.en}`
    : STRINGS.timeRemaining[lang];

  const localTime = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone ?? undefined,
    hour12: timeFormat === "12",
  }).format(new Date(nowMs));

  return (
    <Paper
      component="section"
      aria-label={STRINGS.nextPrayer.ar}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        p: { xs: 2.5, md: 3.5 },
        backgroundImage:
          "linear-gradient(180deg, rgba(31,93,76,0.06) 0%, rgba(31,93,76,0) 55%)",
      }}
    >
      <IslamicPattern opacity={0.05} />
      <Stack spacing={2.5} sx={{ position: "relative" }}>
        {/* الموقع + زر تغيير الموقع */}
        <Stack
          direction="row"
          spacing={1}
          rowGap={1}
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" rowGap={0.5}>
            <PlaceIcon fontSize="small" color="primary" />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {cityLine}
            </Typography>
            {location ? (
              <Chip
                size="small"
                variant="outlined"
                color={location.source === "gps" ? "success" : "default"}
                label={
                  location.source === "gps"
                    ? STRINGS.exactGps[lang]
                    : location.source === "ip"
                      ? STRINGS.approximate[lang]
                      : lang === "ar"
                        ? "اختيار يدوي"
                        : "Manual"
                }
              />
            ) : null}
          </Stack>
          <Button
            size="small"
            variant="outlined"
            startIcon={<EditLocationAltIcon />}
            onClick={onOpenLocation}
          >
            {STRINGS.changeLocation[lang]}
          </Button>
        </Stack>

        {/* الصلاة القادمة والعدّ التنازلي */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.5, sm: 2 }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "flex-end" }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              {STRINGS.nextPrayer[lang]}
            </Typography>
            <Typography variant="h3" component="p" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {nextLabel ? nextLabel[lang] : "—"}
              {nextLabel ? (
                <Typography
                  component="span"
                  variant="h6"
                  color="text.secondary"
                  sx={{ ms: 1.5, fontWeight: 500 }}
                >
                  {lang === "ar" ? nextLabel.en : nextLabel.ar}
                </Typography>
              ) : null}
            </Typography>
            {currentLabel && nextLabel ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {STRINGS.windowNow[lang]}
                {": "}
                {currentLabel[lang]}
                {" — "}
                {lang === "ar" ? `حتى ${nextLabel.ar}` : `until ${nextLabel.en}`}
              </Typography>
            ) : null}
          </Box>

          {next ? (
            <LiveCountdown
              msRemaining={next.at - nowMs}
              lang={lang}
              label={countdownLabel}
              sx={{ alignItems: { xs: "flex-start", sm: "flex-end" } }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              {loading ? STRINGS.loading[lang] : ""}
            </Typography>
          )}
        </Stack>

        <Divider />

        {/* التاريخان + الوقت المحلي */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1.25, sm: 3 }}
          flexWrap="wrap"
          rowGap={1}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            <CalendarMonthIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {STRINGS.gregorian[lang]}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatGregorianLong(todayKey, lang)}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.75} alignItems="center">
            <PublicIcon fontSize="small" color="secondary" />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {STRINGS.hijri[lang]}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {hijri
                  ? formatHijri(
                      hijri.day,
                      lang === "ar" ? hijri.monthNameAr : hijri.monthNameEn,
                      hijri.year,
                      lang,
                    )
                  : STRINGS.loading[lang]}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.75} alignItems="center">
            <ScheduleIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                {STRINGS.localTime[lang]}
                {timezone ? ` · ${timezone}` : ""}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }} dir="ltr">
                {localTime}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        <Box sx={srOnly} aria-live="polite">
          {`${STRINGS.localTime[lang]}: ${localTime}${timezone ? ` (${timezone})` : ""}`}
        </Box>
      </Stack>
    </Paper>
  );
}

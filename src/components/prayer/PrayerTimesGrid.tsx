import { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RefreshIcon from "@mui/icons-material/Refresh";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  EXTRA_TIMINGS,
  STRINGS,
  prayerLabel,
  type ExtraTimingKey,
  type Lang,
} from "../../data/prayer/labels";
import type { DayTimings } from "../../data/prayer/api";
import type { PrayerRow, TimeFormat } from "../../utils/prayer";
import { formatClock, formatCountdownShort } from "../../utils/prayer";
import { PRAYER_ICONS, TABULAR_NUMBERS, srOnly } from "./shared";

type Props = {
  day: DayTimings | null;
  rows: PrayerRow[];
  lang: Lang;
  timeFormat: TimeFormat;
  loading: boolean;
  stale: boolean;
  error: string | null;
  methodLabel: string | null;
  onRetry: () => void;
};

/** جدول الصلوات الخمس + الأوقات المساعدة + حالة كل صلاة. */
export function PrayerTimesGrid({
  day,
  rows,
  lang,
  timeFormat,
  loading,
  stale,
  error,
  methodLabel,
  onRetry,
}: Props) {
  const theme = useTheme();
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const extraTimes = useMemo(() => {
    if (!day) return [];
    return EXTRA_TIMINGS.filter((item) => item.key === "imsak" || item.key === "sunset").map(
      (item) => ({
        key: item.key,
        label: lang === "ar" ? item.ar : item.en,
        clock: day.clock[item.key as ExtraTimingKey] ?? "",
      }),
    );
  }, [day, lang]);

  if (error && !day) {
    return (
      <Alert
        severity="error"
        sx={{ borderRadius: 3 }}
        action={
          <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
            {STRINGS.retry[lang]}
          </Button>
        }
      >
        {STRINGS.timesUnavailable[lang]}
        <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.85 }}>
          {error}
        </Typography>
      </Alert>
    );
  }

  if (!day && loading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={1.5}>
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
        </Stack>
      </Paper>
    );
  }

  if (!day) return null;

  return (
    <Stack spacing={1.5} component="section" aria-label={STRINGS.todaySchedule.ar}>
      {stale ? (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          {STRINGS.offlineUsingCache[lang]}
        </Alert>
      ) : null}

      <Paper sx={{ p: { xs: 1, md: 1.5 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
        <Stack component="ul" sx={{ listStyle: "none", m: 0, p: 0 }} divider={<Divider component="li" />}>
          {rows.map((row) => {
            const label = prayerLabel(row.key);
            const statusText =
              row.state === "current"
                ? STRINGS.now[lang]
                : row.state === "completed"
                  ? STRINGS.passed[lang]
                  : `${STRINGS.inTime[lang]} ${formatCountdownShort(row.deltaMs, lang)}`;
            return (
              <Box
                component="li"
                key={row.key}
                data-prayer={row.key}
                data-state={row.state}
                aria-current={row.state === "current" ? "true" : undefined}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1, md: 2 },
                  px: { xs: 1, md: 1.5 },
                  py: 1,
                  borderRadius: 3,
                  bgcolor:
                    row.state === "current"
                      ? theme.palette.mode === "dark"
                        ? "rgba(201,162,75,0.16)"
                        : "rgba(31,93,76,0.08)"
                      : "transparent",
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: "12px",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: row.state === "current" ? "primary.main" : "action.hover",
                    color: row.state === "current" ? "primary.contrastText" : "text.secondary",
                  }}
                >
                  {(() => {
                    const Icon = PRAYER_ICONS[row.key];
                    return <Icon fontSize="small" />;
                  })()}
                </Box>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle1" component="p" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {label[lang]}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ ms: 1 }}
                    >
                      {lang === "ar" ? label.en : label.ar}
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {statusText}
                  </Typography>
                </Box>

                {row.isNext ? (
                  <Chip
                    size="small"
                    color="primary"
                    label={STRINGS.nextPrayer[lang]}
                    sx={{ display: { xs: "none", sm: "inline-flex" } }}
                  />
                ) : null}

                <Typography
                  dir="ltr"
                  variant="h6"
                  component="p"
                  sx={{ ...TABULAR_NUMBERS, fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  {formatClock(row.clock, timeFormat, lang)}
                </Typography>

                <Box component="span" sx={{ display: "grid", placeItems: "center", width: 24 }}>
                  {row.state === "completed" ? (
                    <CheckCircleIcon fontSize="small" sx={{ color: "success.main", opacity: 0.7 }} />
                  ) : row.state === "current" ? (
                    <Box
                      aria-hidden
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        bgcolor: "secondary.main",
                        boxShadow: "0 0 0 4px rgba(201,162,75,0.22)",
                        animation: reduceMotion ? "none" : "sjPulse 2s ease-in-out infinite",
                        "@keyframes sjPulse": {
                          "0%, 100%": { transform: "scale(1)", opacity: 1 },
                          "50%": { transform: "scale(0.78)", opacity: 0.75 },
                        },
                      }}
                    />
                  ) : (
                    <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "text.disabled" }} />
                  )}
                </Box>
                <Box sx={srOnly}>
                  {row.state === "current"
                    ? STRINGS.now.ar
                    : row.state === "completed"
                      ? STRINGS.passed.ar
                      : STRINGS.upcoming.ar}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Paper>

      {/* الأوقات المساعدة: الإمساك والشروق والغروب */}
      <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} alignItems="center">
        <Typography variant="caption" color="text.secondary">
          {STRINGS.extraTimings[lang]} ({STRINGS.extraNote[lang]}):
        </Typography>
        {day ? (
          <Chip
            size="small"
            variant="outlined"
            label={`${lang === "ar" ? "الشروق" : "Sunrise"} ${formatClock(day.clock.sunrise, timeFormat, lang)}`}
          />
        ) : null}
        {extraTimes.map((item) => (
          <Chip
            key={item.key}
            size="small"
            variant="outlined"
            label={`${item.label} ${formatClock(item.clock, timeFormat, lang)}`}
          />
        ))}
      </Stack>

      {/* الشفافية: الطريقة المستخدمة فعليًا + تنبيه الدقّة */}
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <InfoOutlinedIcon fontSize="small" sx={{ color: "text.secondary", mt: 0.25 }} />
        <Box>
          {methodLabel ? (
            <Typography variant="caption" color="text.secondary" display="block">
              {STRINGS.effectiveMethod[lang]}: {methodLabel}
            </Typography>
          ) : null}
          <Typography variant="caption" color="text.secondary">
            {STRINGS.accuracyNote[lang]}
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
}

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import TodayIcon from "@mui/icons-material/Today";
import CloseIcon from "@mui/icons-material/Close";
import type { CalendarDay, DayTimings, MonthCalendar } from "../../data/prayer/api";
import {
  OBLIGATORY_PRAYERS,
  STRINGS,
  prayerLabel,
  translateHoliday,
  type Lang,
} from "../../data/prayer/labels";
import {
  formatClock,
  formatGregorianLong,
  formatHijri,
  formatMonthTitle,
  formatWeekdayShort,
  shiftDateKey,
  type TimeFormat,
} from "../../utils/prayer";
import { toArabicNumber } from "../../utils/arabic";
import { TABULAR_NUMBERS } from "./shared";

type Props = {
  lang: Lang;
  timeFormat: TimeFormat;
  todayKey: string;
  calendar: MonthCalendar | null;
  loading: boolean;
  error: string | null;
  isCurrent: boolean;
  viewYear: number;
  viewMonth: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  onRetry: () => void;
  loadDay: (dateKey: string) => Promise<DayTimings>;
};

/** أسبوع يبدأ بالأحد (2026-01-04 أحد — تاريخ ثابت لاستخراج أسماء الأيام باللغة). */
const WEEK_START_KEY = "2026-01-04";

const digits = (value: number, lang: Lang) =>
  lang === "ar" ? toArabicNumber(value) : String(value);

function weekdayIndex(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** التقويم الشهري: ميلادي مع ما يقابله هجريًا ومناسبات الأيام. */
export function MonthCalendar({
  lang,
  timeFormat,
  todayKey,
  calendar,
  loading,
  error,
  isCurrent,
  viewYear,
  viewMonth,
  onPrev,
  onNext,
  onToday,
  canGoPrev,
  canGoNext,
  onRetry,
  loadDay,
}: Props) {
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const [dayTimings, setDayTimings] = useState<DayTimings | null>(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState<string | null>(null);

  const weekdays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => formatWeekdayShort(shiftDateKey(WEEK_START_KEY, index), lang)),
    [lang],
  );

  const hijriHeader = useMemo(() => {
    if (!calendar) return "";
    const seen: string[] = [];
    for (const day of calendar.days) {
      const name = lang === "ar" ? day.hMonthNameAr : day.hMonthNameEn;
      if (name && !seen.includes(name)) seen.push(name);
    }
    if (seen.length === 0) return "";
    const year = calendar.days[0]?.hYear;
    const yearLabel = year ? `${digits(year, lang)} ${lang === "ar" ? "هـ" : "AH"}` : "";
    return `${seen.join(" – ")} ${yearLabel}`.trim();
  }, [calendar, lang]);

  const leadingBlanks = calendar && calendar.days.length > 0 ? weekdayIndex(calendar.days[0].dateKey) : 0;

  const openDay = (day: CalendarDay) => {
    setSelected(day);
    setDayTimings(null);
    setDayError(null);
    setDayLoading(true);
    loadDay(day.dateKey)
      .then((value) => setDayTimings(value))
      .catch(() => setDayError(STRINGS.timesUnavailable[lang]))
      .finally(() => setDayLoading(false));
  };

  return (
    <Stack component="section" aria-label={STRINGS.calendar.ar} spacing={1.5}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        flexWrap="wrap"
        rowGap={1}
      >
        <Box>
          <Typography variant="h6" component="p" sx={{ fontWeight: 800 }}>
            {formatMonthTitle(viewYear, viewMonth, lang)}
          </Typography>
          {hijriHeader ? (
            <Typography variant="caption" color="text.secondary">
              {hijriHeader}
            </Typography>
          ) : null}
        </Box>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton
            aria-label={STRINGS.previousMonth[lang]}
            onClick={onPrev}
            size="small"
            disabled={!canGoPrev}
          >
            <ChevronRightIcon />
          </IconButton>
          <Button size="small" startIcon={<TodayIcon />} onClick={onToday}>
            {STRINGS.thisMonth[lang]}
          </Button>
          <IconButton
            aria-label={STRINGS.nextMonth[lang]}
            onClick={onNext}
            size="small"
            disabled={!canGoNext}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Stack>
      </Stack>

      {error ? (
        <Alert
          severity="warning"
          sx={{ borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={onRetry}>
              {STRINGS.retry[lang]}
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      <Paper sx={{ p: { xs: 1, md: 1.5 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: { xs: 0.5, md: 0.75 },
          }}
        >
          {weekdays.map((name) => (
            <Typography
              key={name}
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: "center", fontWeight: 700, py: 0.5 }}
            >
              {name}
            </Typography>
          ))}

          {loading && (!calendar || !isCurrent)
            ? Array.from({ length: 35 }, (_, index) => (
                <Skeleton key={`skeleton-${index}`} variant="rounded" height={52} />
              ))
            : null}

          {calendar && isCurrent ? (
            <>
              {Array.from({ length: leadingBlanks }, (_, index) => (
                <Box key={`blank-${index}`} aria-hidden />
              ))}
              {calendar.days.map((day) => {
                const isToday = day.dateKey === todayKey;
                const holiday = day.holidays.length > 0;
                return (
                  <Box
                    key={day.dateKey}
                    component="button"
                    type="button"
                    data-calendar-day={day.dateKey}
                    data-today={isToday ? "true" : undefined}
                    onClick={() => openDay(day)}
                    aria-label={`${formatGregorianLong(day.dateKey, lang)} — ${formatHijri(
                      day.hDay,
                      lang === "ar" ? day.hMonthNameAr : day.hMonthNameEn,
                      day.hYear,
                      lang,
                    )}${holiday ? ` — ${day.holidays.map((name) => translateHoliday(name, lang)).join("، ")}` : ""}`}
                    sx={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.25,
                      minHeight: { xs: 48, md: 56 },
                      p: 0.5,
                      cursor: "pointer",
                      bgcolor: isToday ? "rgba(201,162,75,0.16)" : "background.paper",
                      color: "text.primary",
                      border: "1px solid",
                      borderColor: isToday ? "secondary.main" : "divider",
                      borderRadius: 2,
                      font: "inherit",
                      transition: "background-color 120ms ease",
                      "&:hover": { bgcolor: "action.hover" },
                      "&:focus-visible": {
                        outline: "2px solid",
                        outlineColor: "primary.main",
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: isToday ? 800 : 600, lineHeight: 1.1, ...TABULAR_NUMBERS }}
                    >
                      {digits(day.gDay, lang)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                      {digits(day.hDay, lang)}
                    </Typography>
                    {holiday ? (
                      <Box
                        aria-hidden
                        sx={{
                          position: "absolute",
                          top: 6,
                          insetInlineEnd: 6,
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: "secondary.main",
                        }}
                      />
                    ) : null}
                  </Box>
                );
              })}
            </>
          ) : null}
        </Box>
      </Paper>

      <Typography variant="caption" color="text.secondary">
        {STRINGS.hijriNote[lang]}
      </Typography>

      {/* نافذة تفاصيل اليوم */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="sj-day-title"
      >
        {selected ? (
          <>
            <DialogTitle id="sj-day-title" sx={{ pe: 6 }}>
              <Typography variant="h6" component="p" sx={{ fontWeight: 800 }}>
                {formatGregorianLong(selected.dateKey, lang)}
              </Typography>
              <Typography variant="body2" color="secondary.dark" sx={{ fontWeight: 700 }}>
                {formatHijri(
                  selected.hDay,
                  lang === "ar" ? selected.hMonthNameAr : selected.hMonthNameEn,
                  selected.hYear,
                  lang,
                )}
              </Typography>
              <IconButton
                aria-label={STRINGS.close[lang]}
                onClick={() => setSelected(null)}
                sx={{ position: "absolute", insetInlineEnd: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                {selected.holidays.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                    {selected.holidays.map((name) => (
                      <Chip
                        key={name}
                        size="small"
                        color="secondary"
                        label={translateHoliday(name, lang)}
                      />
                    ))}
                  </Stack>
                ) : null}

                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {STRINGS.times[lang]}
                </Typography>

                {dayLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      {STRINGS.loading[lang]}
                    </Typography>
                  </Stack>
                ) : dayError ? (
                  <Typography variant="body2" color="text.secondary">
                    {dayError}
                  </Typography>
                ) : dayTimings ? (
                  <Stack divider={<Divider flexItem />} spacing={0.5}>
                    {OBLIGATORY_PRAYERS.map((key) => {
                      const label = prayerLabel(key);
                      return (
                        <Stack
                          key={key}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          spacing={2}
                        >
                          <Typography variant="body2">{label[lang]}</Typography>
                          <Typography
                            variant="body2"
                            dir="ltr"
                            sx={{ ...TABULAR_NUMBERS, fontWeight: 700 }}
                          >
                            {formatClock(dayTimings.clock[key], timeFormat, lang)}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                ) : null}

                <Typography variant="caption" color="text.secondary">
                  {STRINGS.hijriNote[lang]}
                </Typography>
              </Stack>
            </DialogContent>
          </>
        ) : null}
      </Dialog>
    </Stack>
  );
}

import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import TodayIcon from "@mui/icons-material/Today";
import CloseIcon from "@mui/icons-material/Close";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import MosqueIcon from "@mui/icons-material/Mosque";
import { Link as RouterLink } from "react-router-dom";
import { SectionHeader } from "../components/SectionHeader";
import { usePrayerSettings } from "../hooks/usePrayerSettings";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useNow } from "../hooks/useNow";
import { STRINGS } from "../data/prayer/labels";
import { formatGregorianLong, formatWeekdayShort, todayKeyIn } from "../utils/prayer";
import {
  HIJRI_MONTHS,
  HIJRI_SUPPORTED_RANGE,
  buildHijriMonthGrid,
  formatHijriDate,
  formatHijriMonth,
  gregorianToHijri,
  hijriToGregorian,
  previousHijriMonth,
  nextHijriMonth,
  todayHijri,
  type HijriCalendarCell,
  type HijriDate,
} from "../utils/hijri";
import { toArabicNumber } from "../utils/arabic";
import { fonts, primaryText } from "../theme";

const WEEK_START_KEY = "2026-01-04";
const OFFSET_KEY = "sj-hijri-offset-v1";

const COPY = {
  ar: {
    title: "التقويم الهجري",
    subtitle:
      "تصفّح الأشهر الهجرية، وحوّل بين الهجري والميلادي، وتعرّف على المناسبات. الحساب محلي على جهازك حسب تقويم أم القرى.",
    previous: "الشهر السابق",
    next: "الشهر التالي",
    today: "اليوم",
    offset: "إزاحة التاريخ",
    offsetHelp:
      "قد يبدأ الشهر في بلدك يومًا قبل أو بعد أم القرى. اختر الإزاحة التي تطابق تقويم جهتك المحلية.",
    note:
      "يعتمد الحساب على تقويم أم القرى المتوفر في المتصفح، وقد تختلف بداية الشهر حسب رؤية الهلال والجهة المعتمدة في بلدك.",
    events: "مناسبات الشهر",
    noEvents: "لا مناسبات مسجّلة في هذا الشهر.",
    dayDetails: "تفاصيل اليوم",
    gregorian: "الميلادي",
    hijri: "الهجري",
    convert: "محوّل التاريخ",
    gregorianToHijri: "من الميلادي إلى الهجري",
    hijriToGregorian: "من الهجري إلى الميلادي",
    gregorianDate: "التاريخ الميلادي",
    hijriDay: "اليوم",
    hijriMonth: "الشهر",
    hijriYear: "السنة",
    result: "النتيجة",
    invalid: "التاريخ خارج المدى المدعوم.",
    openPrayer: "مواقيت الصلاة",
    monthRange: (from: string, to: string) => `${from} — ${to}`,
    offsetValue: (value: number) =>
      value === 0 ? "بدون إزاحة" : `${value > 0 ? "+" : "−"}${toArabicNumber(Math.abs(value))} يوم`,
  },
  en: {
    title: "Hijri Calendar",
    subtitle:
      "Browse Hijri months, convert between Hijri and Gregorian dates, and see Islamic events. Calculation runs locally using Umm al-Qura.",
    previous: "Previous month",
    next: "Next month",
    today: "Today",
    offset: "Date offset",
    offsetHelp:
      "Your local month may start a day before or after Umm al-Qura. Choose the offset that matches your local authority.",
    note:
      "The calendar uses the Umm al-Qura calendar available in the browser; month starts may differ by moon sighting and local authority.",
    events: "Events this month",
    noEvents: "No listed events this month.",
    dayDetails: "Day details",
    gregorian: "Gregorian",
    hijri: "Hijri",
    convert: "Date converter",
    gregorianToHijri: "Gregorian to Hijri",
    hijriToGregorian: "Hijri to Gregorian",
    gregorianDate: "Gregorian date",
    hijriDay: "Day",
    hijriMonth: "Month",
    hijriYear: "Year",
    result: "Result",
    invalid: "Date is outside the supported range.",
    openPrayer: "Prayer times",
    monthRange: (from: string, to: string) => `${from} — ${to}`,
    offsetValue: (value: number) =>
      value === 0 ? "No offset" : `${value > 0 ? "+" : "−"}${Math.abs(value)} day(s)`,
  },
} as const;

const digits = (value: number, lang: "ar" | "en") =>
  lang === "ar" ? toArabicNumber(value) : String(value);

function formatGregorianCompact(dateKey: string, lang: "ar" | "en"): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export default function HijriCalendarPage() {
  const { settings } = usePrayerSettings();
  const lang = settings.lang;
  const copy = COPY[lang];
  const now = useNow(60_000);
  const todayKey = todayKeyIn(undefined, now);
  const [offsetStored, setOffsetStored] = useLocalStorage<number>(OFFSET_KEY, 0);
  const offset = Math.max(-2, Math.min(2, Math.round(offsetStored)));
  const today = useMemo(() => todayHijri(todayKey, offset), [todayKey, offset]);
  const [view, setView] = useState<HijriDate>(() => todayHijri(todayKey, offset));
  const [selected, setSelected] = useState<HijriCalendarCell | null>(null);

  const grid = useMemo(
    () => buildHijriMonthGrid(view.year, view.month, offset, todayKey),
    [view.year, view.month, offset, todayKey],
  );

  const weekdays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(`${WEEK_START_KEY}T12:00:00Z`);
        date.setUTCDate(date.getUTCDate() + index);
        return formatWeekdayShort(date.toISOString().slice(0, 10), lang);
      }),
    [lang],
  );

  const canGoPrev = view.year > HIJRI_SUPPORTED_RANGE.min || view.month > 1;
  const canGoNext = view.year < HIJRI_SUPPORTED_RANGE.max || view.month < 12;

  const goPrev = () => setView((current) => ({ ...previousHijriMonth(current.year, current.month), day: 1 }));
  const goNext = () => setView((current) => ({ ...nextHijriMonth(current.year, current.month), day: 1 }));
  const goToday = () => setView(today);

  const monthEvents = useMemo(
    () => grid.cells.flatMap((cell) => cell.events.map((event) => ({ event, cell }))),
    [grid.cells],
  );

  const [gregorianInput, setGregorianInput] = useState(todayKey);
  const [hijriInput, setHijriInput] = useState<HijriDate>(() => todayHijri(todayKey, offset));

  const gregorianToHijriResult = useMemo(() => {
    try {
      return formatHijriDate(gregorianToHijri(gregorianInput, offset), lang);
    } catch {
      return copy.invalid;
    }
  }, [gregorianInput, offset, lang, copy.invalid]);

  const hijriToGregorianResult = useMemo(() => {
    try {
      return formatGregorianLong(hijriToGregorian(hijriInput, offset), lang);
    } catch {
      return copy.invalid;
    }
  }, [hijriInput, offset, lang, copy.invalid]);

  return (
    <Stack spacing={4}>
      <SectionHeader
        level="h1"
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          <Button component={RouterLink} to="/prayer-times" size="small" startIcon={<MosqueIcon />}>
            {copy.openPrayer}
          </Button>
        }
      />

      <Alert severity="info" sx={{ borderRadius: 3 }} icon={<CalendarMonthIcon />}>
        {copy.note}
      </Alert>

      <Paper
        component="section"
        aria-label={copy.title}
        sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            flexWrap="wrap"
            rowGap={1}
          >
            <Box>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
                {formatHijriMonth(view.year, view.month, lang)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {copy.monthRange(
                  formatGregorianCompact(grid.startKey, lang),
                  formatGregorianCompact(grid.endKey, lang),
                )}
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <IconButton aria-label={copy.previous} onClick={goPrev} disabled={!canGoPrev} size="small">
                <ChevronRightIcon />
              </IconButton>
              <Button size="small" startIcon={<TodayIcon />} onClick={goToday}>
                {copy.today}
              </Button>
              <IconButton aria-label={copy.next} onClick={goNext} disabled={!canGoNext} size="small">
                <ChevronLeftIcon />
              </IconButton>
            </Stack>
          </Stack>

          <Divider />

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
            {Array.from({ length: grid.leadingBlanks }, (_, index) => (
              <Box key={`blank-${index}`} aria-hidden />
            ))}
            {grid.cells.map((cell) => {
              const eventLabel = cell.events
                .map((event) => (lang === "ar" ? event.ar : event.en))
                .join("، ");
              const label = `${formatHijriDate(cell.hijriDate, lang)} — ${formatGregorianLong(
                cell.gregorianKey,
                lang,
              )}${eventLabel ? ` — ${eventLabel}` : ""}`;
              return (
                <Box
                  key={cell.gregorianKey}
                  component="button"
                  type="button"
                  data-hijri-day={cell.hijriDate.day}
                  data-gregorian={cell.gregorianKey}
                  data-today={cell.isToday ? "true" : undefined}
                  onClick={() => setSelected(cell)}
                  aria-label={label}
                  sx={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.25,
                    minHeight: { xs: 50, md: 58 },
                    p: 0.5,
                    cursor: "pointer",
                    bgcolor: cell.isToday ? "rgba(201,162,75,0.16)" : "background.paper",
                    color: "text.primary",
                    border: "1px solid",
                    borderColor: cell.isToday ? "secondary.main" : "divider",
                    borderRadius: 2,
                    font: "inherit",
                    "&:hover": { bgcolor: "action.hover" },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "secondary.dark",
                      outlineOffset: 2,
                    },
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: cell.isToday ? 800 : 700, lineHeight: 1.1 }}
                  >
                    {digits(cell.hijriDate.day, lang)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
                    {digits(Number(cell.gregorianKey.slice(8, 10)), lang)}
                  </Typography>
                  {cell.events.length > 0 ? (
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
          </Box>
        </Stack>
      </Paper>

      <Paper
        component="section"
        aria-label={copy.offset}
        sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={1.25}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 800 }}>
            {copy.offset}
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={offset}
            onChange={(_, value: number | null) => {
              if (value !== null) setOffsetStored(value);
            }}
            aria-label={copy.offset}
          >
            {[-2, -1, 0, 1, 2].map((value) => (
              <ToggleButton key={value} value={value} aria-label={copy.offsetValue(value)}>
                {value === 0 ? (lang === "ar" ? "٠" : "0") : `${value > 0 ? "+" : "−"}${digits(Math.abs(value), lang)}`}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary">
            {copy.offsetHelp}
          </Typography>
        </Stack>
      </Paper>

      <Paper
        component="section"
        aria-label={copy.events}
        sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={1.25}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 800 }}>
            {copy.events}
          </Typography>
          {monthEvents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {copy.noEvents}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {monthEvents.map(({ event, cell }) => (
                <Stack
                  key={`${event.key}-${cell.gregorianKey}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  rowGap={0.5}
                >
                  <Chip size="small" color="secondary" label={lang === "ar" ? event.ar : event.en} />
                  <Typography variant="body2" color="text.secondary">
                    {digits(cell.hijriDate.day, lang)} {formatHijriMonth(cell.hijriDate.year, cell.hijriDate.month, lang)} —{" "}
                    {formatGregorianCompact(cell.gregorianKey, lang)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      <Paper
        component="section"
        aria-label={copy.convert}
        sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 800 }}>
            {copy.convert}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Stack spacing={1.25}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {copy.gregorianToHijri}
              </Typography>
              <TextField
                type="date"
                size="small"
                label={copy.gregorianDate}
                value={gregorianInput}
                onChange={(event) => setGregorianInput(event.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: "1900-01-01", max: "2199-12-31" }}
              />
              <Typography variant="body2" color="secondary.dark" sx={{ fontWeight: 700 }}>
                {copy.result}: {gregorianToHijriResult}
              </Typography>
            </Stack>

            <Stack spacing={1.25}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {copy.hijriToGregorian}
              </Typography>
              <Stack direction="row" spacing={1}>
                <TextField
                  select
                  size="small"
                  label={copy.hijriDay}
                  value={hijriInput.day}
                  onChange={(event) =>
                    setHijriInput((current) => ({ ...current, day: Number(event.target.value) }))
                  }
                  sx={{ minWidth: 86 }}
                >
                  {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => (
                    <MenuItem key={day} value={day}>
                      {digits(day, lang)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label={copy.hijriMonth}
                  value={hijriInput.month}
                  onChange={(event) =>
                    setHijriInput((current) => ({ ...current, month: Number(event.target.value) }))
                  }
                  sx={{ flexGrow: 1, minWidth: 130 }}
                >
                  {HIJRI_MONTHS.map((month, index) => (
                    <MenuItem key={month.en} value={index + 1}>
                      {month[lang]}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  type="number"
                  size="small"
                  label={copy.hijriYear}
                  value={hijriInput.year}
                  onChange={(event) =>
                    setHijriInput((current) => ({ ...current, year: Number(event.target.value) }))
                  }
                  inputProps={{ min: HIJRI_SUPPORTED_RANGE.min, max: HIJRI_SUPPORTED_RANGE.max }}
                  sx={{ width: 100 }}
                />
              </Stack>
              <Typography variant="body2" color="secondary.dark" sx={{ fontWeight: 700 }}>
                {copy.result}: {hijriToGregorianResult}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="sj-hijri-day-title"
      >
        {selected ? (
          <>
            <DialogTitle id="sj-hijri-day-title" sx={{ pe: 6 }}>
              <Typography variant="h6" component="p" sx={{ fontWeight: 800 }}>
                {formatHijriDate(selected.hijriDate, lang)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatGregorianLong(selected.gregorianKey, lang)}
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
                {selected.events.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                    {selected.events.map((event) => (
                      <Chip
                        key={event.key}
                        color="secondary"
                        label={lang === "ar" ? event.ar : event.en}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {copy.noEvents}
                  </Typography>
                )}
                <Button
                  component={RouterLink}
                  to="/prayer-times"
                  variant="outlined"
                  startIcon={<MosqueIcon />}
                  onClick={() => setSelected(null)}
                >
                  {copy.openPrayer}
                </Button>
                <Typography variant="caption" color="text.secondary">
                  {copy.note}
                </Typography>
              </Stack>
            </DialogContent>
          </>
        ) : null}
      </Dialog>

      <Box sx={{ textAlign: "center" }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontFamily: fonts.naskh, color: (theme) => primaryText(theme.palette.mode) }}
        >
          {copy.note}
        </Typography>
      </Box>
    </Stack>
  );
}

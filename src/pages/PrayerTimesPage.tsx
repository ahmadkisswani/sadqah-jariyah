import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import MosqueIcon from "@mui/icons-material/Mosque";
import { SectionHeader } from "../components/SectionHeader";
import { ShareButton } from "../components/ShareButton";
import { NextPrayerCard } from "../components/prayer/NextPrayerCard";
import { PrayerTimesGrid } from "../components/prayer/PrayerTimesGrid";
import { RamadanCard } from "../components/prayer/RamadanCard";
import { EventsCard } from "../components/prayer/EventsCard";
import { MonthCalendar } from "../components/prayer/MonthCalendar";
import { LocationDialog } from "../components/prayer/LocationDialog";
import {
  PrayerSettingsCard,
  settingsLocationLabel,
} from "../components/prayer/PrayerSettingsCard";
import { usePageTitle } from "../hooks/usePageTitle";
import { useNow } from "../hooks/useNow";
import { usePrayerSettings } from "../hooks/usePrayerSettings";
import { useLocationResolver } from "../hooks/useLocationResolver";
import { usePrayerTimes } from "../hooks/usePrayerTimes";
import { useMonthCalendar } from "../hooks/useMonthCalendar";
import { useIslamicEvents } from "../hooks/useIslamicEvents";
import { defaultMethodFor, methodName } from "../data/prayer/methods";
import { OBLIGATORY_PRAYERS, STRINGS, prayerLabel } from "../data/prayer/labels";
import { describeApiError } from "../data/prayer/api";
import { withDedication } from "../constants/dedication";
import {
  buildPrayerRows,
  findCurrentAndNext,
  formatClock,
  formatGregorianLong,
  ramadanWindows,
  todayKeyIn,
} from "../utils/prayer";

/** صفحة مواقيت الصلاة والتقويم الهجري. */
export default function PrayerTimesPage() {
  usePageTitle("مواقيت الصلاة — Prayer Times");

  const { settings, update, reset } = usePrayerSettings();
  const lang = settings.lang;
  const timeFormat = settings.timeFormat;
  const location = settings.location;

  const resolver = useLocationResolver({ location, onChange: update });
  const now = useNow(1000);

  /** المنطقة الزمنية تأتي من ردّ الخدمة (لا نفترضها) — ثم يُضبط مفتاح اليوم بها. */
  const [resolvedTimezone, setResolvedTimezone] = useState<string | null>(null);
  const todayKey = todayKeyIn(resolvedTimezone ?? undefined, now);

  const methodId = settings.methodId ?? defaultMethodFor(location?.countryCode);

  const times = usePrayerTimes({
    location,
    methodId,
    school: settings.school,
    highLatitude: settings.highLatitude,
    tune: settings.tune,
    todayKey,
    enabled: Boolean(location),
  });

  useEffect(() => {
    const timezone = times.today?.timezone;
    if (timezone && timezone !== resolvedTimezone) setResolvedTimezone(timezone);
  }, [times.today?.timezone, resolvedTimezone]);

  const { current, next } = useMemo(
    () => findCurrentAndNext(times.days, now),
    [times.days, now],
  );

  const rows = useMemo(
    () => (times.today ? buildPrayerRows(times.today, current, next, now) : []),
    [times.today, current, next, now],
  );

  const ramadanWindow = useMemo(() => ramadanWindows(times.days, now), [times.days, now]);

  const hijriYear = times.today?.hijri.year ?? null;
  const { events } = useIslamicEvents({ location, hijriYear, todayKey });
  const inRamadan = times.today?.hijri.month === 9;
  const ramadanEvent = events?.find((event) => event.key === "ramadan") ?? null;
  const visibleEvents = useMemo(
    () => (inRamadan ? (events ?? []).filter((event) => event.key !== "ramadan") : events),
    [events, inRamadan],
  );

  /* التقويم الشهري: يبدأ من شهر اليوم الحالي، وله تنقّل مستقل */
  const [view, setView] = useState(() => {
    const key = todayKeyIn(undefined);
    return { year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)) };
  });
  const month = useMonthCalendar({
    location,
    viewYear: view.year,
    viewMonth: view.month,
    enabled: Boolean(location),
  });

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);

  const monthOffset =
    (view.year - Number(todayKey.slice(0, 4))) * 12 + (view.month - Number(todayKey.slice(5, 7)));
  const canGoPrev = monthOffset > -18;
  const canGoNext = monthOffset < 18;

  const goPrevMonth = () =>
    setView((value) =>
      value.month === 1 ? { year: value.year - 1, month: 12 } : { year: value.year, month: value.month - 1 },
    );
  const goNextMonth = () =>
    setView((value) =>
      value.month === 12 ? { year: value.year + 1, month: 1 } : { year: value.year, month: value.month + 1 },
    );
  const goToday = () =>
    setView({ year: Number(todayKey.slice(0, 4)), month: Number(todayKey.slice(5, 7)) });

  const errorText = times.error ? describeApiError(times.error) : null;
  const methodLabel = times.today ? methodName(times.today.method.id, lang) : null;

  const shareText = withDedication(
    times.today
      ? [
          `${STRINGS.pageTitle.ar}${location ? ` — ${location.city}` : ""}`,
          formatGregorianLong(todayKey, "ar"),
          "",
          ...OBLIGATORY_PRAYERS.map(
            (key) => `${prayerLabel(key).ar}: ${formatClock(times.today!.clock[key], timeFormat, "ar")}`,
          ),
          "",
          STRINGS.accuracyNote.ar,
          STRINGS.hijriNote.ar,
        ].join("\n")
      : STRINGS.pageTitle.ar,
  );

  const noLocationYet = !location && resolver.status !== "resolving";

  return (
    <Stack spacing={4}>
      <SectionHeader
        title={STRINGS.pageTitle[lang]}
        subtitle={STRINGS.pageSubtitle[lang]}
        action={times.today ? <ShareButton text={shareText} size="small" /> : undefined}
      />

      {/* تنقّل سريع داخل الصفحة */}
      <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: -2 }}>
        <Chip component="a" href="#sj-times" label={STRINGS.times[lang]} clickable variant="outlined" />
        <Chip
          component="a"
          href="#sj-calendar"
          label={STRINGS.calendar[lang]}
          clickable
          variant="outlined"
        />
        <Chip
          component="a"
          href="#sj-settings"
          label={STRINGS.settings[lang]}
          clickable
          variant="outlined"
        />
      </Stack>

      {resolver.status === "resolving" && !location ? (
        <Paper sx={{ p: 2, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
          <LinearProgress sx={{ borderRadius: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            {STRINGS.locatingNow[lang]}
          </Typography>
        </Paper>
      ) : null}

      {noLocationYet ? (
        <Paper
          component="section"
          aria-label={STRINGS.location.ar}
          sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
        >
          <Stack spacing={1.5} alignItems="flex-start">
            <Stack direction="row" spacing={1} alignItems="center">
              <MosqueIcon color="primary" />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
                {STRINGS.location[lang]}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {resolver.notice ?? STRINGS.useGpsExplain[lang]}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="contained"
                startIcon={<MyLocationIcon />}
                onClick={() => void resolver.requestPrecise()}
                disabled={resolver.busy}
              >
                {STRINGS.useMyLocation[lang]}
              </Button>
              <Button
                variant="outlined"
                startIcon={<EditLocationAltIcon />}
                onClick={() => setLocationDialogOpen(true)}
              >
                {STRINGS.chooseManually[lang]}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      {location && resolver.status === "approximate" ? (
        <Alert
          severity="info"
          sx={{ borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => void resolver.requestPrecise()}>
              {lang === "ar" ? "تحديد أدق" : "Refine"}
            </Button>
          }
        >
          {lang === "ar"
            ? `المواقيت محسوبة على موقع تقريبي حسب الشبكة (${location.city}). اسمح بالوصول لموقعك لدقة أعلى.`
            : `Times are based on an approximate network location (${location.cityEn}). Allow location access for better accuracy.`}
        </Alert>
      ) : null}

      {location && (resolver.status === "denied" || resolver.status === "missing") && resolver.notice ? (
        <Alert
          severity="warning"
          sx={{ borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => setLocationDialogOpen(true)}>
              {STRINGS.chooseManually[lang]}
            </Button>
          }
        >
          {resolver.notice}
        </Alert>
      ) : null}

      {location ? (
        <>
          <Box id="sj-times" sx={{ scrollMarginTop: 88 }}>
            <Stack spacing={3}>
              <NextPrayerCard
                nowMs={now}
                lang={lang}
                timeFormat={timeFormat}
                next={next}
                current={current}
                location={location}
                timezone={times.today?.timezone ?? resolvedTimezone}
                hijri={times.today?.hijri ?? null}
                todayKey={todayKey}
                loading={times.loading}
                onOpenLocation={() => setLocationDialogOpen(true)}
              />
              <PrayerTimesGrid
                day={times.today}
                rows={rows}
                lang={lang}
                timeFormat={timeFormat}
                loading={times.loading}
                stale={times.stale}
                error={errorText}
                methodLabel={methodLabel}
                onRetry={times.retry}
              />
            </Stack>
          </Box>

          <RamadanCard
            lang={lang}
            timeFormat={timeFormat}
            hijri={times.today?.hijri ?? null}
            today={times.today}
            window={ramadanWindow}
            daysUntilRamadan={ramadanEvent ? ramadanEvent.daysUntil : null}
            ramadanStartKey={ramadanEvent ? ramadanEvent.dateKey : null}
          />

          <EventsCard lang={lang} events={visibleEvents} loading={!visibleEvents} />

          <Box id="sj-calendar" sx={{ scrollMarginTop: 88 }}>
            <MonthCalendar
              lang={lang}
              timeFormat={timeFormat}
              todayKey={todayKey}
              calendar={month.calendar}
              loading={month.loading}
              error={month.error ? describeApiError(month.error) : null}
              isCurrent={month.isCurrent}
              viewYear={view.year}
              viewMonth={view.month}
              onPrev={goPrevMonth}
              onNext={goNextMonth}
              onToday={goToday}
              canGoPrev={canGoPrev}
              canGoNext={canGoNext}
              onRetry={month.retry}
              loadDay={times.loadDay}
            />
          </Box>

          <Box id="sj-settings" sx={{ scrollMarginTop: 88 }}>
            <PrayerSettingsCard
              lang={lang}
              settings={settings}
              onUpdate={update}
              onReset={reset}
              onOpenLocation={() => setLocationDialogOpen(true)}
              effectiveMethodId={times.today?.method.id ?? null}
              locationLabel={settingsLocationLabel(location, lang)}
              latitude={location.latitude}
            />
          </Box>

          <Typography variant="caption" color="text.secondary">
            {STRINGS.hijriNote[lang]} {STRINGS.accuracyNote[lang]}
          </Typography>
        </>
      ) : null}

      <LocationDialog
        open={locationDialogOpen}
        onClose={() => setLocationDialogOpen(false)}
        lang={lang}
        location={location}
        status={resolver.status}
        permission={resolver.permission}
        busy={resolver.busy}
        notice={resolver.notice}
        onRequestPrecise={() => void resolver.requestPrecise()}
        onUseManualCity={(city) => {
          resolver.useManualCity(city);
        }}
        onUseCoordinates={resolver.useCoordinates}
      />
    </Stack>
  );
}

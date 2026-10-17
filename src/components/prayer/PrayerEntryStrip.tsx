import { useMemo } from "react";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import MosqueIcon from "@mui/icons-material/Mosque";
import PlaceIcon from "@mui/icons-material/Place";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { Link as RouterLink } from "react-router-dom";
import { usePrayerSettings } from "../../hooks/usePrayerSettings";
import { useNow } from "../../hooks/useNow";
import { peekDayTimings } from "../../data/prayer/api";
import { defaultMethodFor } from "../../data/prayer/methods";
import { STRINGS, prayerLabel } from "../../data/prayer/labels";
import { findCurrentAndNext, formatClock, formatCountdownShort, todayKeyIn } from "../../utils/prayer";

/**
 * مدخل الصفحة الرئيسية إلى المواقيت — بلا أي طلب شبكة ولا طلب إذن.
 *
 * يقرأ فقط ما حفظه الزائر سابقًا في هذا الجهاز (الموقع + مواقيت اليوم المخزّنة)،
 * فإن لم يوجد شيء يظهر المدخل بصيغته العامة. هكذا تبقى الرئيسية سريعة ولا
 * تزاحم هدف الموقع الأساسي.
 */
export function PrayerEntryStrip() {
  const { settings } = usePrayerSettings();
  const location = settings.location;
  const now = useNow(1000);

  const methodId = settings.methodId ?? defaultMethodFor(location?.countryCode);
  const dayKey = todayKeyIn(undefined, now);

  // يعاد الحساب فقط عند تغيّر اليوم/الموقع/الإعدادات — لا مع كل ثانية.
  const day = useMemo(() => {
    if (!location) return null;
    return peekDayTimings({
      latitude: location.latitude,
      longitude: location.longitude,
      dateKey: dayKey,
      methodId,
      school: settings.school,
      highLatitude: settings.highLatitude,
      tune: settings.tune,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    location,
    methodId,
    settings.school,
    settings.highLatitude,
    settings.timeFormat,
    settings.tune,
    dayKey,
  ]);

  const next = day ? findCurrentAndNext([day], now).next : null;

  const line = (() => {
    if (day && next) {
      return `الصلاة القادمة: ${prayerLabel(next.key).ar} · ${formatClock(
        next.clock,
        settings.timeFormat,
        "ar",
      )} · بعد ${formatCountdownShort(next.at - now, "ar")}`;
    }
    if (day && !next) {
      return "انتهت صلوات اليوم — تصفّح مواقيت الغد والتفاصيل كاملة.";
    }
    return STRINGS.entrySubtitle.ar;
  })();

  return (
    <Paper
      component={RouterLink}
      to="/prayer-times"
      sx={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        p: { xs: 2, md: 2.5 },
        transition: "border-color 160ms ease, transform 160ms ease",
        "&:hover": { borderColor: "primary.main" },
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <MosqueIcon color="primary" fontSize="large" />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={0.5}>
            <Typography variant="subtitle1" component="p" sx={{ fontWeight: 800 }}>
              {STRINGS.entryTitle.ar}
            </Typography>
            {location ? (
              <Chip
                size="small"
                variant="outlined"
                icon={<PlaceIcon />}
                label={location.city}
                sx={{ maxWidth: 180 }}
              />
            ) : null}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {line}
          </Typography>
        </Box>
        {day && next ? (
          <Chip color="primary" size="small" label="مباشر" />
        ) : (
          <Button size="small" sx={{ display: { xs: "none", sm: "inline-flex" } }}>
            {STRINGS.entryCta.ar}
          </Button>
        )}
        <ChevronLeftIcon sx={{ color: "text.secondary" }} />
      </Stack>
    </Paper>
  );
}

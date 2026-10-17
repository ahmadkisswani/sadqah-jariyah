import { Divider, Paper, Stack, Typography } from "@mui/material";
import MosqueIcon from "@mui/icons-material/Mosque";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import WbTwilightIcon from "@mui/icons-material/WbTwilight";
import { IslamicPattern } from "../IslamicPattern";
import { LiveCountdown } from "./LiveCountdown";
import { STRINGS, type Lang } from "../../data/prayer/labels";
import type { DayTimings } from "../../data/prayer/api";
import type { RamadanWindow, TimeFormat } from "../../utils/prayer";
import { formatClock, formatGregorianLong, relativeDays } from "../../utils/prayer";
import { toArabicNumber } from "../../utils/arabic";

type Props = {
  lang: Lang;
  timeFormat: TimeFormat;
  hijri: DayTimings["hijri"] | null;
  today: DayTimings | null;
  window: RamadanWindow;
  /** أيام متبقية حتى رمضان (0 = اليوم/غدًا) — null إن كان بعيدًا. */
  daysUntilRamadan: number | null;
  /** أول أيام رمضان القادم من تقويم الخدمة. */
  ramadanStartKey: string | null;
};

/**
 * بطاقة رمضان: تُعرض داخل رمضان (مع الإفطار والسحور)، أو قبل رمضان بقليل
 * (عدّ الأيام). كل التواريخ من تقويم الخدمة، وكل الأوقات من مواقيت اليوم نفسه.
 */
export function RamadanCard({
  lang,
  timeFormat,
  hijri,
  today,
  window,
  daysUntilRamadan,
  ramadanStartKey,
}: Props) {
  const inRamadan = hijri?.month === 9;
  const approaching =
    !inRamadan && daysUntilRamadan !== null && daysUntilRamadan >= 0 && daysUntilRamadan <= 45;

  if (!inRamadan && !approaching) return null;

  /** يذكر "غدًا" عندما يقع الهدف في يوم مختلف عن يوم اليوم المعروض. */
  const dayHint = (dateKey?: string) =>
    today && dateKey && dateKey !== today.dateKey ? `${STRINGS.tomorrow[lang]}` : "";

  return (
    <Paper
      component="section"
      aria-label={STRINGS.ramadan.ar}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid",
        borderColor: "secondary.main",
        p: { xs: 2.5, md: 3 },
        backgroundImage:
          "linear-gradient(180deg, rgba(201,162,75,0.12) 0%, rgba(201,162,75,0) 60%)",
      }}
    >
      <IslamicPattern opacity={0.05} />
      <Stack spacing={2} sx={{ position: "relative" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <MosqueIcon color="secondary" />
          <Typography variant="h6" component="h3" sx={{ fontWeight: 800 }}>
            {inRamadan
              ? STRINGS.ramadanMubarak[lang]
              : `${STRINGS.ramadan[lang]} — ${relativeDays(daysUntilRamadan ?? 0, lang)}`}
          </Typography>
        </Stack>

        {inRamadan && hijri ? (
          <>
            <Typography variant="body1">
              {lang === "ar"
                ? `${STRINGS.ramadanDay.ar} ${toArabicNumber(hijri.day)} ${STRINGS.ramadanOf.ar}`
                : `Day ${hijri.day} of Ramadan`}
            </Typography>
            <Divider />
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 2.5, sm: 4 }}
              divider={
                <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
              }
            >
              <Stack spacing={0.75}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <WbTwilightIcon fontSize="small" color="secondary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {STRINGS.iftar[lang]}
                    {window.iftar ? ` · ${formatClock(window.iftar.clock, timeFormat, lang)}` : ""}
                  </Typography>
                </Stack>
                {window.iftar ? (
                  <LiveCountdown
                    msRemaining={window.iftarMs}
                    lang={lang}
                    label={STRINGS.iftarIn[lang]}
                    variant="h4"
                    sx={{ alignItems: "flex-start" }}
                  />
                ) : null}
                <Typography variant="caption" color="text.secondary">
                  {dayHint(window.iftar?.dateKey)}
                </Typography>
              </Stack>

              <Stack spacing={0.75}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <NightsStayIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {STRINGS.suhoor[lang]}
                    {window.suhoor ? ` · ${formatClock(window.suhoor.clock, timeFormat, lang)}` : ""}
                  </Typography>
                </Stack>
                {window.suhoor ? (
                  <LiveCountdown
                    msRemaining={window.suhoorMs}
                    lang={lang}
                    label={STRINGS.suhoorIn[lang]}
                    variant="h4"
                    sx={{ alignItems: "flex-start" }}
                  />
                ) : null}
                <Typography variant="caption" color="text.secondary">
                  {[
                    dayHint(window.suhoor?.dateKey),
                    today ? `${STRINGS.imsak[lang]}: ${formatClock(today.clock.imsak, timeFormat, lang)}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Typography>
              </Stack>
            </Stack>
          </>
        ) : (
          <>
            <Typography variant="body1">
              {lang === "ar"
                ? `أوّل أيام رمضان ${relativeDays(daysUntilRamadan ?? 1, lang)}${
                    ramadanStartKey ? ` — ${formatGregorianLong(ramadanStartKey, lang)}` : ""
                  }`
                : `The first day of Ramadan is ${
                    ramadanStartKey
                      ? formatGregorianLong(ramadanStartKey, lang)
                      : `in ${daysUntilRamadan ?? 1} days`
                  }.`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {STRINGS.hijriNote[lang]}
            </Typography>
          </>
        )}
      </Stack>
    </Paper>
  );
}

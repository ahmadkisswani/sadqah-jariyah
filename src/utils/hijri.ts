/**
 * تحويلات التقويم الهجري (أم القرى) محليًا وبلا شبكة.
 *
 * نعتمد على تقويم `islamic-umalqura` المتوفر في Intl داخل المتصفحات الحديثة،
 * وهو التقويم المعتمد رسميًا في السعودية. لا ندّعي أنه يطابق رؤية الهلال في
 * كل بلد؛ لذلك تتاح للمستخدم إزاحة ±يومين في صفحة التقويم.
 *
 * كل الحسابات تجري عند منتصف ليل UTC لتجنّب انزياح المناطق الزمنية.
 */

import { toArabicNumber } from "./arabic";
import { ISLAMIC_EVENTS, type EventDefinition } from "../data/prayer/labels";

export type HijriDate = { year: number; month: number; day: number };

export type HijriMonthInfo = { ar: string; en: string };

export const HIJRI_MONTHS: HijriMonthInfo[] = [
  { ar: "مُحَرَّم", en: "Muharram" },
  { ar: "صَفَر", en: "Safar" },
  { ar: "رَبيع الأوّل", en: "Rabi' al-awwal" },
  { ar: "رَبيع الآخر", en: "Rabi' al-thani" },
  { ar: "جُمادى الأولى", en: "Jumada al-awwal" },
  { ar: "جُمادى الآخرة", en: "Jumada al-thani" },
  { ar: "رَجَب", en: "Rajab" },
  { ar: "شَعْبان", en: "Sha'ban" },
  { ar: "رَمَضان", en: "Ramadan" },
  { ar: "شَوّال", en: "Shawwal" },
  { ar: "ذو القَعْدة", en: "Dhu al-Qi'dah" },
  { ar: "ذو الحِجّة", en: "Dhu al-Hijjah" },
];

const DAY_MS = 86_400_000;
const UMM_AL_QURA = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  timeZone: "UTC",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  numberingSystem: "latn",
});

const clampOffset = (offset: number) =>
  Number.isFinite(offset) ? Math.max(-2, Math.min(2, Math.round(offset))) : 0;

const dateKeyToMs = (dateKey: string): number => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
};

const msToDateKey = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

const parsePart = (parts: Intl.DateTimeFormatPart[], type: string): number => {
  const value = parts.find((part) => part.type === type)?.value ?? "";
  return Number(value.replace(/[^\d]/g, ""));
};

/** تحويل تاريخ ميلادي (YYYY-MM-DD) إلى هجري، مع إزاحة اختيارية ±يومين. */
export function gregorianToHijri(dateKey: string, offset = 0): HijriDate {
  const shifted = msToDateKey(dateKeyToMs(dateKey) + clampOffset(offset) * DAY_MS);
  const date = new Date(`${shifted}T12:00:00Z`);
  const parts = UMM_AL_QURA.formatToParts(date);
  return {
    year: parsePart(parts, "year"),
    month: parsePart(parts, "month"),
    day: parsePart(parts, "day"),
  };
}

const hijriOrdinal = (date: HijriDate): number =>
  date.year * 10_000 + date.month * 100 + date.day;

/** تحويل تاريخ هجري إلى ميلادي (YYYY-MM-DD)، مع إزاحة اختيارية ±يومين. */
export function hijriToGregorian(date: HijriDate, offset = 0): string {
  const target = hijriOrdinal(date);
  let low = dateKeyToMs("1900-01-01");
  let high = dateKeyToMs("2200-01-01");

  while (low < high) {
    const mid = low + Math.floor((high - low) / DAY_MS / 2) * DAY_MS;
    const midDate = new Date(mid);
    const parts = UMM_AL_QURA.formatToParts(midDate);
    const current = hijriOrdinal({
      year: parsePart(parts, "year"),
      month: parsePart(parts, "month"),
      day: parsePart(parts, "day"),
    });
    if (current < target) low = mid + DAY_MS;
    else high = mid;
  }

  const found = new Date(low);
  const parts = UMM_AL_QURA.formatToParts(found);
  const actual = hijriOrdinal({
    year: parsePart(parts, "year"),
    month: parsePart(parts, "month"),
    day: parsePart(parts, "day"),
  });
  if (actual !== target) {
    throw new Error("التاريخ الهجري خارج المدى المدعوم");
  }

  // الإزاحة تعني: التاريخ الهجري المعروض = أم القرى + offset.
  return msToDateKey(low - clampOffset(offset) * DAY_MS);
}

/** طول شهر هجري (٢٩ أو ٣٠ يومًا) حسب أم القرى. */
export function hijriMonthLength(year: number, month: number): number {
  const start = hijriToGregorian({ year, month, day: 1 });
  const next = nextHijriMonth(year, month);
  const end = hijriToGregorian({ ...next, day: 1 });
  return Math.round((dateKeyToMs(end) - dateKeyToMs(start)) / DAY_MS);
}

export function hijriMonthName(month: number, lang: "ar" | "en" = "ar"): string {
  return HIJRI_MONTHS[month - 1]?.[lang] ?? "";
}

export function nextHijriMonth(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

export function previousHijriMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

export function todayHijri(todayKey: string, offset = 0): HijriDate {
  return gregorianToHijri(todayKey, offset);
}

export function eventsForHijriDay(month: number, day: number): EventDefinition[] {
  return ISLAMIC_EVENTS.filter((event) => event.month === month && event.day === day);
}

export type HijriCalendarCell = {
  hijriDate: HijriDate;
  gregorianKey: string;
  isToday: boolean;
  events: EventDefinition[];
};

export type HijriMonthGrid = {
  year: number;
  month: number;
  monthNameAr: string;
  monthNameEn: string;
  length: number;
  leadingBlanks: number;
  startKey: string;
  endKey: string;
  cells: HijriCalendarCell[];
};

function weekdayIndex(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
}

/** بناء شبكة شهر هجري كامل مع مقابلها الميلادي وهوية اليوم. */
export function buildHijriMonthGrid(
  year: number,
  month: number,
  offset = 0,
  todayKey = "",
): HijriMonthGrid {
  const safeOffset = clampOffset(offset);
  const startKey = hijriToGregorian({ year, month, day: 1 }, safeOffset);
  const length = hijriMonthLength(year, month);
  const cells: HijriCalendarCell[] = [];

  for (let day = 1; day <= length; day += 1) {
    const gregorianKey = msToDateKey(dateKeyToMs(startKey) + (day - 1) * DAY_MS);
    cells.push({
      hijriDate: { year, month, day },
      gregorianKey,
      isToday: gregorianKey === todayKey,
      events: eventsForHijriDay(month, day),
    });
  }

  return {
    year,
    month,
    monthNameAr: hijriMonthName(month, "ar"),
    monthNameEn: hijriMonthName(month, "en"),
    length,
    leadingBlanks: weekdayIndex(startKey),
    startKey,
    endKey: cells[cells.length - 1]?.gregorianKey ?? startKey,
    cells,
  };
}

/** صياغة تاريخ هجري مقروء. */
export function formatHijriDate(date: HijriDate, lang: "ar" | "en" = "ar"): string {
  const day = lang === "ar" ? toArabicNumber(date.day) : String(date.day);
  const year = lang === "ar" ? toArabicNumber(date.year) : String(date.year);
  const suffix = lang === "ar" ? "هـ" : "AH";
  return `${day} ${hijriMonthName(date.month, lang)} ${year} ${suffix}`;
}

/** صياغة الشهر والسنة فقط. */
export function formatHijriMonth(year: number, month: number, lang: "ar" | "en" = "ar"): string {
  const digits = (value: number) => (lang === "ar" ? toArabicNumber(value) : String(value));
  return `${hijriMonthName(month, lang)} ${digits(year)} ${lang === "ar" ? "هـ" : "AH"}`;
}

/** أقل/أكبر سنة مدعومة في التحويل المحلي. */
export const HIJRI_SUPPORTED_RANGE = { min: 1318, max: 1522 } as const;

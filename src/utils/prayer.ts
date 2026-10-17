/**
 * أدوات حسابية بحتة للمواقيت (بلا شبكة ولا حالة React):
 * حالات الصلوات، الصلاة القادمة، العدّ التنازلي، وتنسيق التواريخ والأرقام.
 *
 * كل المقارنات الزمنية تجري بين "لحظات مطلقة" (Date.parse لصيغة ISO مع الإزاحة)
 * وبين Date.now() — فلا جمع فروق مناطق زمنية يدويًا ولا مشكلة مع التوقيت الصيفي.
 */

import {
  OBLIGATORY_PRAYERS,
  type Lang,
  type ObligatoryPrayerKey,
  type PrayerKey,
} from "../data/prayer/labels";
import type { DayTimings } from "../data/prayer/api";
import { toArabicNumber } from "./arabic";

export type TimeFormat = "12" | "24";

/* ------------------------------ مفاتيح التواريخ ------------------------------ */

/** تاريخ اليوم بصيغة YYYY-MM-DD في منطقة زمنية معيّنة (أو المحلية إن لم تُحدَّد). */
export function todayKeyIn(timeZone: string | undefined, now: number = Date.now()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date(now));
}

/** إضافة أيام إلى مفتاح تاريخ (حساب تقويمي بحت). */
export function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** فرق الأيام بين مفتاحي تاريخ (بلا تأثير للتوقيت الصيفي). */
export function daysBetweenKeys(fromKey: string, toKey: string): number {
  const parse = (key: string) => {
    const [year, month, day] = key.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((parse(toKey) - parse(fromKey)) / 86_400_000);
}

/** هل الإحداثيات صالحة؟ (نرفض أي قيمة غير منطقية). */
export function areCoordinatesValid(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

/* ------------------------------ محرّك الصلوات ------------------------------ */

export type PrayerInstant = {
  key: PrayerKey;
  iso: string;
  /** الساعة المحلية "HH:MM" كما تظهر في جدول اليوم. */
  clock: string;
  /** اللحظة المطلقة بالمللي ثانية. */
  at: number;
  dateKey: string;
};

/** كل لحظات الصلوات الخمس من الأيام المتاحة مرتّبة زمنيًا. */
export function prayerInstants(days: DayTimings[]): PrayerInstant[] {
  const list: PrayerInstant[] = [];
  for (const day of days) {
    if (!day) continue;
    for (const key of OBLIGATORY_PRAYERS) {
      const iso = day.iso[key];
      const at = Date.parse(iso);
      if (Number.isFinite(at)) list.push({ key, iso, clock: day.clock[key], at, dateKey: day.dateKey });
    }
  }
  return list.sort((a, b) => a.at - b.at);
}

/**
 * الصلاة الجارية (الحالية) والصلاة القادمة بالنسبة للحظة معيّنة.
 * "الحالية" = آخر صلاة دخل وقتها؛ و"القادمة" = أول صلاة لم يدخل وقتها بعد
 * (وقد تكون فجر الغد بعد العشاء).
 */
export function findCurrentAndNext(days: DayTimings[], nowMs: number) {
  const instants = prayerInstants(days);
  let current: PrayerInstant | null = null;
  let next: PrayerInstant | null = null;
  for (const instant of instants) {
    if (instant.at <= nowMs) current = instant;
    else {
      next = instant;
      break;
    }
  }
  return { current, next, instants };
}

export type PrayerState = "completed" | "current" | "upcoming";

export type PrayerRow = {
  key: ObligatoryPrayerKey;
  clock: string;
  at: number;
  state: PrayerState;
  /** صحيح للصلاة القادمة فقط. */
  isNext: boolean;
  /** الفرق بالمللي ثانية: متبقٍ للقادمة، ومضى للجارية. */
  deltaMs: number;
};

/** صفوف الصلوات الخمس ليوم معيّن مع حالتها بالنسبة للآن. */
export function buildPrayerRows(
  day: DayTimings,
  current: PrayerInstant | null,
  next: PrayerInstant | null,
  nowMs: number,
): PrayerRow[] {
  return OBLIGATORY_PRAYERS.map((key) => {
    const at = Date.parse(day.iso[key]);
    const state: PrayerState =
      current && current.at === at ? "current" : at <= nowMs ? "completed" : "upcoming";
    const isNext = Boolean(next && next.at === at);
    const deltaMs = state === "upcoming" ? at - nowMs : state === "current" ? nowMs - at : 0;
    return { key, clock: day.clock[key], at, state, isNext, deltaMs };
  });
}

/* ------------------------------ الوقت والعدّ ------------------------------ */

export type Duration = { hours: number; minutes: number; seconds: number };

export function splitDuration(ms: number): Duration {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** عدّ تنازلي رقمي "٠٢:٤٧:٣١" (أو "02:47:31" بالإنجليزية). */
export function formatCountdown(ms: number, lang: Lang): string {
  const { hours, minutes, seconds } = splitDuration(ms);
  const pad = (value: number) => String(value).padStart(2, "0");
  const text = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return lang === "ar" ? toArabicNumber(text) : text;
}

/** عدّ تنازلي مختصر "٠٢:٤٧" للصفوف والبطاقات الصغيرة. */
export function formatCountdownShort(ms: number, lang: Lang): string {
  const { hours, minutes } = splitDuration(ms);
  const text = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return lang === "ar" ? toArabicNumber(text) : text;
}

/** صيغة منطوقة للقارئ الشاشي: "متبقٍ ساعتان و١٢ دقيقة". */
export function formatCountdownWords(ms: number, lang: Lang): string {
  const { hours, minutes } = splitDuration(ms);
  if (lang === "en") {
    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    if (parts.length === 0) return "less than a minute remaining";
    return `${parts.join(" and ")} remaining`;
  }
  const hourWords = (value: number) => {
    if (value === 1) return "ساعة";
    if (value === 2) return "ساعتان";
    if (value <= 10) return `${toArabicNumber(value)} ساعات`;
    return `${toArabicNumber(value)} ساعة`;
  };
  const minuteWords = (value: number) => {
    if (value === 1) return "دقيقة";
    if (value === 2) return "دقيقتان";
    if (value <= 10) return `${toArabicNumber(value)} دقائق`;
    return `${toArabicNumber(value)} دقيقة`;
  };
  const parts: string[] = [];
  if (hours > 0) parts.push(hourWords(hours));
  if (minutes > 0) parts.push(minuteWords(minutes));
  if (parts.length === 0) return "متبقٍ أقل من دقيقة";
  return `متبقٍ ${parts.join(" و")}`;
}

/** وقت الصلاة بصيغة ١٢ أو ٢٤ ساعة، بأرقام عربية هندية عند العربية. */
export function formatClock(clock24: string, format: TimeFormat, lang: Lang): string {
  const [hours = 0, minutes = 0] = clock24.split(":").map(Number);
  const pad = (value: number) => String(value).padStart(2, "0");
  if (format === "24") {
    const text = `${pad(hours)}:${pad(minutes)}`;
    return lang === "ar" ? toArabicNumber(text) : text;
  }
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const suffix = hours < 12 ? (lang === "ar" ? "ص" : "AM") : lang === "ar" ? "م" : "PM";
  const text = `${hour12}:${pad(minutes)} ${suffix}`;
  return lang === "ar" ? toArabicNumber(text) : text;
}

/* ------------------------------ تنسيق التواريخ ------------------------------ */

const locale = (lang: Lang) => (lang === "ar" ? "ar" : "en-GB");

/** تاريخ ميلادي طويل: "السبت، ١٧ أكتوبر ٢٠٢٦". */
export function formatGregorianLong(dateKey: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateKeyToUtc(dateKey));
}

/** تاريخ ميلادي مختصر بلا سنة: "١٧ أكتوبر". */
export function formatGregorianShort(dateKey: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(dateKeyToUtc(dateKey));
}

/** عنوان شهر ميلادي: "أكتوبر ٢٠٢٦". */
export function formatMonthTitle(year: number, month: number, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

/** اسم اليوم المختصر لرأس شبكة التقويم. */
export function formatWeekdayShort(dateKey: string, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { weekday: "short", timeZone: "UTC" }).format(
    dateKeyToUtc(dateKey),
  );
}

/** تاريخ هجري مقروء: "٦ جُمادى الأولى ١٤٤٨ هـ". */
export function formatHijri(
  day: number,
  monthName: string,
  year: number,
  lang: Lang,
): string {
  const digits = (value: number) => (lang === "ar" ? toArabicNumber(value) : String(value));
  const suffix = lang === "ar" ? "هـ" : "AH";
  return `${digits(day)} ${monthName} ${digits(year)} ${suffix}`;
}

/** المباركة بحسب عدد الأيام: "اليوم" / "غدًا" / "بعد ٣ أيام". */
export function relativeDays(days: number, lang: Lang): string {
  if (days <= 0) return lang === "ar" ? "اليوم" : "today";
  if (days === 1) return lang === "ar" ? "غدًا" : "tomorrow";
  if (lang === "en") return `in ${days} days`;
  if (days === 2) return "بعد يومين";
  if (days <= 10) return `بعد ${toArabicNumber(days)} أيام`;
  return `بعد ${toArabicNumber(days)} يومًا`;
}

function dateKeyToUtc(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

/* ------------------------------ رمضان والصيام ------------------------------ */

export type RamadanWindow = {
  /** أقرب إفطار (مغرب اليوم أو الغد). */
  iftar: PrayerInstant | null;
  iftarMs: number;
  /** نهاية السحور = أقرب فجر قادم (فجر اليوم إن لم يمضِ، وإلا فجر الغد). */
  suhoor: PrayerInstant | null;
  suhoorMs: number;
};

/**
 * نوافذ الصيام: أقرب إفطار وأقرب فجر (نهاية السحور).
 * تُحسب من لحظات الأيام المتاحة (أمس/اليوم/غد) — لا قيم ثابتة.
 */
export function ramadanWindows(days: DayTimings[], nowMs: number): RamadanWindow {
  const instants = prayerInstants(days);
  const maghribs = instants.filter((instant) => instant.key === "maghrib");
  const fajrs = instants.filter((instant) => instant.key === "fajr");

  const iftar = maghribs.find((instant) => instant.at > nowMs) ?? null;
  const suhoor = fajrs.find((instant) => instant.at > nowMs) ?? null;

  return {
    iftar,
    iftarMs: iftar ? iftar.at - nowMs : 0,
    suhoor,
    suhoorMs: suhoor ? suhoor.at - nowMs : 0,
  };
}

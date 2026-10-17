/**
 * خدمة مواقيت الصلاة والتقويم الهجري — تعتمد AlAdhan API مباشرة من المتصفح.
 *
 * لماذا AlAdhan؟
 * - بلا مفاتيح ولا حساب (لا أسرار في الواجهة).
 * - تُراعي الإحداثيات والمنطقة الزمنية وطريقة الحساب والمذهب وقواعد خطوط العرض.
 * - تُعيد المواقيت بصيغة ISO8601 عند طلب ذلك، وهو ما يجعل العدّ التنازلي آمنًا
 *   مع التوقيت الصيفي واختلاف المناطق الزمنية (بدل جمع فروق يدوية).
 *
 * كل الطلبات تمرّ من هنا وتُخزَّن نتيجتها محليًا (localStorage) بمفتاح يشمل
 * الموقع والتاريخ والطريقة والمذهب، فلا يُعاد الطلب إلا عند تغيّر أحدها.
 */

import type { ExtraTimingKey, PrayerKey } from "./labels";
import { areCoordinatesValid, daysBetweenKeys, shiftDateKey, todayKeyIn } from "../../utils/prayer";

export { areCoordinatesValid, daysBetweenKeys, shiftDateKey, todayKeyIn };

const API_BASE = "https://api.aladhan.com/v1";
const REQUEST_TIMEOUT_MS = 12_000;

export type TimingKey = PrayerKey | ExtraTimingKey;

/* --------------------------------- الأنواع -------------------------------- */

export type DayTimings = {
  /** تاريخ اليوم في المنطقة الزمنية للموقع (YYYY-MM-DD). */
  dateKey: string;
  /** المنطقة الزمنية التي أعادها الخادم لهذا الموقع (مثل Asia/Amman). */
  timezone: string;
  /** أوقات ثابتة بصيغة ISO8601 كاملة مع الإزاحة. */
  iso: Record<TimingKey, string>;
  /** نفس الأوقات بصيغة ساعة الجدار المحلي "HH:MM" (24 ساعة). */
  clock: Record<TimingKey, string>;
  hijri: {
    day: number;
    month: number;
    year: number;
    monthNameAr: string;
    monthNameEn: string;
    holidays: string[];
  };
  gregorian: { day: number; month: number; year: number };
  method: { id: number; name: string };
  school: "STANDARD" | "HANAFI";
};

export type CalendarDay = {
  dateKey: string;
  gDay: number;
  gMonth: number;
  gYear: number;
  hDay: number;
  hMonth: number;
  hYear: number;
  hMonthNameAr: string;
  hMonthNameEn: string;
  /** مناسبات هذا اليوم كما تعيدها الخدمة (بالإنجليزية). */
  holidays: string[];
};

export type MonthCalendar = {
  year: number;
  month: number;
  days: CalendarDay[];
  timezone: string | null;
};

export type IslamicEvent = {
  key: string;
  ar: string;
  en: string;
  dateKey: string;
  hijriDay: number;
  hijriMonth: number;
  hijriYear: number;
  /** عدد الأيام من "اليوم" (0 = اليوم نفسه، سالب = مضى). */
  daysUntil: number;
  holidays: string[];
};

export type TuneMap = Partial<Record<PrayerKey, number>>;

export type DayTimingsParams = {
  latitude: number;
  longitude: number;
  dateKey: string;
  methodId: number;
  school: 0 | 1;
  highLatitude: "auto" | 1 | 2 | 3;
  tune: TuneMap;
};

/* -------------------------------- الأخطاء -------------------------------- */

export type PrayerApiErrorKind =
  | "network"
  | "timeout"
  | "http"
  | "rate-limit"
  | "invalid"
  | "parse";

export class PrayerApiError extends Error {
  kind: PrayerApiErrorKind;
  status?: number;

  constructor(kind: PrayerApiErrorKind, message?: string, status?: number) {
    super(message ?? kind);
    this.name = "PrayerApiError";
    this.kind = kind;
    this.status = status;
  }
}

/** رسالة عربية مختصرة لعرض سبب الفشل للمستخدم. */
export function describeApiError(error: unknown): string {
  if (error instanceof PrayerApiError) {
    switch (error.kind) {
      case "rate-limit":
        return "الخدمة مشغولة الآن (طلبات كثيرة). جرّب بعد قليل.";
      case "timeout":
        return "انتهت مهلة الاتصال بالخدمة. تحقّق من الإنترنت وحاول مجددًا.";
      case "http":
        return `تعذّر الوصول إلى الخدمة (${error.status ?? "خطأ"}).`;
      case "parse":
        return "ردّ غير مفهوم من الخدمة. حاول مرة أخرى.";
      case "invalid":
        return "بيانات الموقع غير صحيحة — أعد اختيار الموقع.";
      default:
        return "تعذّر الاتصال بالإنترنت.";
    }
  }
  return "حدث خطأ غير متوقّع.";
}

/* ------------------------------ أدوات مساعدة ------------------------------ */

type Json = Record<string, unknown>;

const asRecord = (value: unknown): Json | null =>
  typeof value === "object" && value !== null ? (value as Json) : null;

const asString = (value: unknown): string | null => (typeof value === "string" ? value : null);
const asNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** "YYYY-MM-DD" ←→ "DD-MM-YYYY" كما تفهمه الخدمة. */
export function dateKeyToApiDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  return `${day}-${month}-${year}`;
}

export function apiDateToDateKey(apiDate: string): string {
  const [day, month, year] = apiDate.split("-");
  return `${year}-${month}-${day}`;
}

/** ترتيب التعديلات اليدوية كما تتوقّعه الخدمة: Imsak, Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha, Midnight, Sunset. */
function tuneParam(tune: TuneMap): string | null {
  const minutes = [
    0,
    tune.fajr ?? 0,
    0,
    tune.dhuhr ?? 0,
    tune.asr ?? 0,
    tune.maghrib ?? 0,
    tune.isha ?? 0,
    0,
    0,
  ];
  return minutes.some((value) => value !== 0) ? minutes.join(",") : null;
}

/* --------------------------------- التخزين -------------------------------- */

const CACHE_KEY = "sj-prayer-cache-v1";
const CACHE_MAX_ENTRIES = 60;

type CacheEntry = { at: number; data: unknown };

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CacheEntry>) {
  try {
    const entries = Object.entries(cache);
    if (entries.length > CACHE_MAX_ENTRIES) {
      entries.sort((a, b) => b[1].at - a[1].at);
      cache = Object.fromEntries(entries.slice(0, CACHE_MAX_ENTRIES));
    }
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* التخزين غير متاح — نتجاهل بهدوء */
  }
}

function cacheGet<T>(key: string, maxAgeMs: number): T | null {
  const entry = readCache()[key];
  if (!entry || Date.now() - entry.at > maxAgeMs) return null;
  return entry.data as T;
}

function cachePut(key: string, data: unknown) {
  const cache = readCache();
  cache[key] = { at: Date.now(), data };
  writeCache(cache);
}

/** قراءة من التخزين بأي عمر — للعرض عند تعذّر الشبكة (بلا ادّعاء حداثة). */
export function readAnyCache<T>(key: string): T | null {
  return cacheGet<T>(key, Number.POSITIVE_INFINITY);
}

/** حذف كل مخزون المواقيت (عند استعادة الإعدادات أو تغيير كبير). */
export function clearPrayerCache() {
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* تجاهُل */
  }
}

export function dayTimingsCacheKey(params: DayTimingsParams): string {
  const { latitude, longitude, methodId, school, highLatitude, tune, dateKey } = params;
  const tuneKey = [tune.fajr, tune.dhuhr, tune.asr, tune.maghrib, tune.isha]
    .map((value) => value ?? 0)
    .join(".");
  return `t:${dateKey}:${latitude.toFixed(3)}:${longitude.toFixed(3)}:${methodId}:${school}:${highLatitude}:${tuneKey}`;
}

/* ------------------------------- الشبكة ------------------------------- */

async function fetchJson(url: string): Promise<Json> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
  } catch (error) {
    if ((error as DOMException | undefined)?.name === "AbortError") {
      throw new PrayerApiError("timeout");
    }
    throw new PrayerApiError("network");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) throw new PrayerApiError("rate-limit", "429", 429);
  if (!response.ok) throw new PrayerApiError("http", `HTTP ${response.status}`, response.status);

  try {
    return (await response.json()) as Json;
  } catch {
    throw new PrayerApiError("parse");
  }
}

/** يتحقّق من غلاف ردّ AlAdhan الموحّد ويعيد بياناته. */
function unwrap(payload: Json): unknown {
  const code = asNumber(payload.code);
  if (code !== 200) throw new PrayerApiError("invalid", `code=${String(code)}`);
  if (payload.data === undefined || payload.data === null) {
    throw new PrayerApiError("invalid", "empty data");
  }
  return payload.data;
}

const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)$/;

function assertIso(value: string | null, name: string): string {
  if (!value || !ISO_PATTERN.test(value)) {
    throw new PrayerApiError("parse", `غير متوقّع: ${name}`);
  }
  return value;
}

/* ------------------------------ مواقيت يوم ------------------------------ */

const TIMING_KEYS: TimingKey[] = [
  "imsak",
  "fajr",
  "sunrise",
  "dhuhr",
  "asr",
  "sunset",
  "maghrib",
  "isha",
  "midnight",
  "lastthird",
];

/** مفاتيح الخدمة تقابل مفاتيحنا الداخلية. */
const API_TIMING_NAMES: Record<TimingKey, string> = {
  imsak: "Imsak",
  fajr: "Fajr",
  sunrise: "Sunrise",
  dhuhr: "Dhuhr",
  asr: "Asr",
  sunset: "Sunset",
  maghrib: "Maghrib",
  isha: "Isha",
  midnight: "Midnight",
  lastthird: "Lastthird",
};

function normalizeDayTimings(payload: Json): DayTimings {
  const data = asRecord(unwrap(payload));
  const rawTimings = asRecord(data?.timings);
  const date = asRecord(data?.date);
  const gregorian = asRecord(date?.gregorian);
  const hijri = asRecord(date?.hijri);
  const hijriMonth = asRecord(hijri?.month);
  const meta = asRecord(data?.meta);
  const method = asRecord(meta?.method);

  const apiDate = asString(gregorian?.date);
  const timezone = asString(meta?.timezone);
  if (!rawTimings || !apiDate || !hijri || !hijriMonth) {
    throw new PrayerApiError("parse", "بنية ردّ غير متوقّعة");
  }

  const iso = {} as Record<TimingKey, string>;
  const clock = {} as Record<TimingKey, string>;
  for (const key of TIMING_KEYS) {
    const value = assertIso(asString(rawTimings[API_TIMING_NAMES[key]]), API_TIMING_NAMES[key]);
    iso[key] = value;
    clock[key] = value.slice(11, 16);
  }

  return {
    dateKey: apiDateToDateKey(apiDate),
    timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    iso,
    clock,
    hijri: {
      day: asNumber(hijri.day) ?? 0,
      month: asNumber(hijriMonth.number) ?? 0,
      year: asNumber(hijri.year) ?? 0,
      monthNameAr: asString(hijriMonth.ar) ?? "",
      monthNameEn: asString(hijriMonth.en) ?? "",
      holidays: Array.isArray(hijri.holidays) ? (hijri.holidays as string[]) : [],
    },
    gregorian: {
      day: asNumber(gregorian?.day) ?? 0,
      month: asNumber(asRecord(gregorian?.month)?.number) ?? 0,
      year: asNumber(gregorian?.year) ?? 0,
    },
    method: {
      id: asNumber(method?.id) ?? 0,
      name: asString(method?.name) ?? "",
    },
    school: asString(meta?.school) === "HANAFI" ? "HANAFI" : "STANDARD",
  };
}

/**
 * مواقيت يوم واحد لموقع محدّد.
 * يُستخدم التخزين أولًا (نفس اليوم/الموقع/الطريقة)، ثم الشبكة.
 * `force` = تجاهُل التخزين الحديث (يُستعمل عند الضغط على "إعادة المحاولة").
 */
export async function fetchDayTimings(
  params: DayTimingsParams,
  options: { force?: boolean } = {},
): Promise<DayTimings> {
  const { latitude, longitude, dateKey, methodId, school, highLatitude, tune } = params;
  if (!areCoordinatesValid(latitude, longitude)) {
    throw new PrayerApiError("invalid", "إحداثيات غير صالحة");
  }

  const key = dayTimingsCacheKey(params);
  if (!options.force) {
    const cached = cacheGet<DayTimings>(key, 6 * 60 * 60 * 1000);
    if (cached) return cached;
  }

  const url = new URL(`${API_BASE}/timings/${dateKeyToApiDate(dateKey)}`);
  url.searchParams.set("latitude", latitude.toFixed(4));
  url.searchParams.set("longitude", longitude.toFixed(4));
  url.searchParams.set("method", String(methodId));
  url.searchParams.set("school", String(school));
  url.searchParams.set("iso8601", "true");
  if (highLatitude !== "auto") {
    url.searchParams.set("latitudeAdjustmentMethod", String(highLatitude));
  }
  const tuneValue = tuneParam(tune);
  if (tuneValue) url.searchParams.set("tune", tuneValue);

  const normalized = normalizeDayTimings(await fetchJson(url.toString()));
  cachePut(key, normalized);
  return normalized;
}

/** قراءة فورية (بلا شبكة) لمواقيت محفوظة — تُستخدم في بطاقة الرئيسية. */
export function peekDayTimings(params: DayTimingsParams): DayTimings | null {
  return cacheGet<DayTimings>(dayTimingsCacheKey(params), 24 * 60 * 60 * 1000);
}

/* ------------------------------ التقويم الشهري ------------------------------ */

const MONTH_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * تقويم شهر ميلادي كامل مع ما يقابله هجريًا ومناسباته.
 * (الشهر قيمة عرض — التنقّل بين الأشهر يحمّل الشهر المطلوب فقط).
 */
export async function fetchMonthCalendar(
  options: {
    year: number;
    month: number;
    latitude: number;
    longitude: number;
  },
  request: { force?: boolean } = {},
): Promise<MonthCalendar> {
  const { year, month, latitude, longitude } = options;
  if (!areCoordinatesValid(latitude, longitude)) {
    throw new PrayerApiError("invalid", "إحداثيات غير صالحة");
  }

  const key = `cal:${year}-${month}:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
  if (!request.force) {
    const cached = cacheGet<MonthCalendar>(key, MONTH_CACHE_MAX_AGE);
    if (cached) return cached;
  }

  const url = new URL(`${API_BASE}/gToHCalendar/${month}/${year}`);
  url.searchParams.set("latitude", latitude.toFixed(4));
  url.searchParams.set("longitude", longitude.toFixed(4));

  const payload = await fetchJson(url.toString());
  const data = unwrap(payload);
  if (!Array.isArray(data) || data.length === 0) {
    throw new PrayerApiError("parse", "تقويم فارغ");
  }

  const days: CalendarDay[] = [];
  for (const rawDay of data) {
    const day = asRecord(rawDay);
    const gregorian = asRecord(day?.gregorian);
    const hijri = asRecord(day?.hijri);
    const hijriMonth = asRecord(hijri?.month);
    const apiDate = asString(gregorian?.date);
    if (!gregorian || !hijri || !hijriMonth || !apiDate) continue;
    days.push({
      dateKey: apiDateToDateKey(apiDate),
      gDay: asNumber(gregorian.day) ?? 0,
      gMonth: asNumber(asRecord(gregorian.month)?.number) ?? month,
      gYear: asNumber(gregorian.year) ?? year,
      hDay: asNumber(hijri.day) ?? 0,
      hMonth: asNumber(hijriMonth.number) ?? 0,
      hYear: asNumber(hijri.year) ?? 0,
      hMonthNameAr: asString(hijriMonth.ar) ?? "",
      hMonthNameEn: asString(hijriMonth.en) ?? "",
      holidays: Array.isArray(hijri.holidays) ? (hijri.holidays as string[]) : [],
    });
  }

  if (days.length === 0) throw new PrayerApiError("parse", "تقويم بلا أيام");

  const meta = asRecord(asRecord(payload)?.meta);
  const calendar: MonthCalendar = {
    year,
    month,
    days,
    timezone: asString(meta?.timezone),
  };
  cachePut(key, calendar);
  return calendar;
}

/* --------------------------- الأشهر الهجرية والأحداث --------------------------- */

export type HijriDay = {
  dateKey: string;
  hDay: number;
  hMonth: number;
  hYear: number;
  holidays: string[];
};

/** شهر هجري كامل (لحساب الأحداث القادمة من بيانات الخدمة نفسها). */
export async function fetchHijriMonth(options: {
  hijriYear: number;
  hijriMonth: number;
  latitude: number;
  longitude: number;
}): Promise<HijriDay[]> {
  const { hijriYear, hijriMonth, latitude, longitude } = options;
  const key = `hijri:${hijriYear}-${hijriMonth}:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
  const cached = cacheGet<HijriDay[]>(key, MONTH_CACHE_MAX_AGE);
  if (cached) return cached;

  const url = new URL(`${API_BASE}/hijriCalendar/${hijriYear}/${hijriMonth}`);
  url.searchParams.set("latitude", latitude.toFixed(4));
  url.searchParams.set("longitude", longitude.toFixed(4));

  const data = unwrap(await fetchJson(url.toString()));
  if (!Array.isArray(data)) throw new PrayerApiError("parse", "شهر هجري غير متوقّع");

  const days: HijriDay[] = [];
  for (const rawDay of data) {
    const day = asRecord(rawDay);
    const gregorian = asRecord(asRecord(day?.date)?.gregorian);
    const hijri = asRecord(asRecord(day?.date)?.hijri);
    const hijriMonthInfo = asRecord(hijri?.month);
    const apiDate = asString(gregorian?.date);
    if (!gregorian || !hijri || !hijriMonthInfo || !apiDate) continue;
    days.push({
      dateKey: apiDateToDateKey(apiDate),
      hDay: asNumber(hijri.day) ?? 0,
      hMonth: asNumber(hijriMonthInfo.number) ?? hijriMonth,
      hYear: asNumber(hijri.year) ?? hijriYear,
      holidays: Array.isArray(hijri.holidays) ? (hijri.holidays as string[]) : [],
    });
  }

  if (days.length === 0) throw new PrayerApiError("parse", "شهر هجري بلا أيام");
  cachePut(key, days);
  return days;
}

/**
 * خدمة الموقع: تحديد موقع الزائر (GPS) ثم الاسم الجغرافي، مع بدائل آمنة.
 *
 * أولوية تحديد الموقع:
 *   1) إحداثيات الجهاز (GPS) — إن سمح المستخدم.
 *   2) موقع محفوظ مسبقًا (جهاز/يدوي).
 *   3) موقع تقريبي حسب عنوان الشبكة (IP).
 *   4) اختيار يدوي للدولة والمدينة.
 *
 * أسماء المدن تأتي من خدمة BigDataCloud المجانية بلا مفاتيح. وإذا فشلت، لا
 * يتعطّل شيء: نعرض الإحداثيات نفسها ونكمل بعرض المواقيت.
 */

export type LocationSource = "gps" | "manual" | "ip";

export type ResolvedLocation = {
  latitude: number;
  longitude: number;
  city: string;
  cityEn: string;
  country: string;
  countryEn: string;
  countryCode: string;
  source: LocationSource;
  /** وقت آخر تحديث لهذا الموقع (لإعادة التحقق من GPS يوميًا). */
  savedAt: number;
};

export type GeolocationFailureKind =
  | "denied"
  | "unavailable"
  | "timeout"
  | "unsupported"
  | "insecure";

export class GeolocationError extends Error {
  kind: GeolocationFailureKind;

  constructor(kind: GeolocationFailureKind, message?: string) {
    super(message ?? kind);
    this.name = "GeolocationError";
    this.kind = kind;
  }
}

export type LocationNames = {
  city: string;
  cityEn: string;
  country: string;
  countryEn: string;
  countryCode: string;
};

const GEO_API = "https://api.bigdatacloud.net/data/reverse-geocode-client";
const GEO_CACHE_KEY = "sj-prayer-geo-v1";
const GEO_CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const IP_CACHE_MAX_AGE = 6 * 60 * 60 * 1000;
const GEO_TIMEOUT_MS = 8_000;

/**
 * مهل تحديد الموقع — مضبوطة على أجهزة الجوال وخصوصًا iPhone:
 * أول محاولة سريعة من الشبكة (واي فاي/أبراج)، ثم محاولة GPS حقيقية بمهلة أطول،
 * ثم المراقبة كملاذ أخير (بعض الأجهزة لا تُرجع الموقع عبر getCurrentPosition
 * لكنها تُرجعه عبر watchPosition).
 */
const GEO_COARSE_TIMEOUT_MS = 10_000;
const GEO_PRECISE_TIMEOUT_MS = 18_000;
const GEO_WATCH_TIMEOUT_MS = 10_000;
const GEO_RETRY_DELAY_MS = 700;

type Json = Record<string, unknown>;
type CacheEntry = { at: number; data: unknown };

const asRecord = (value: unknown): Json | null =>
  typeof value === "object" && value !== null ? (value as Json) : null;

const asText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const asNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function readGeoCache(): Record<string, CacheEntry> {
  try {
    const raw = window.localStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeGeoCache(key: string, data: unknown) {
  try {
    const cache = readGeoCache();
    cache[key] = { at: Date.now(), data };
    const entries = Object.entries(cache);
    if (entries.length > 40) {
      entries.sort((a, b) => b[1].at - a[1].at);
      window.localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(Object.fromEntries(entries.slice(0, 40))));
      return;
    }
    window.localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* التخزين غير متاح */
  }
}

function readGeoCacheEntry<T>(key: string, maxAgeMs: number): T | null {
  const entry = readGeoCache()[key];
  if (!entry || Date.now() - entry.at > maxAgeMs) return null;
  return entry.data as T;
}

async function fetchGeoJson(url: string): Promise<Json> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEO_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new GeolocationError("unavailable", `HTTP ${response.status}`);
    return (await response.json()) as Json;
  } catch (error) {
    if (error instanceof GeolocationError) throw error;
    if ((error as DOMException | undefined)?.name === "AbortError") {
      throw new GeolocationError("timeout");
    }
    throw new GeolocationError("unavailable");
  } finally {
    clearTimeout(timer);
  }
}

function buildGeoUrl(language: "ar" | "en", latitude?: number, longitude?: number): string {
  const url = new URL(GEO_API);
  if (latitude !== undefined && longitude !== undefined) {
    url.searchParams.set("latitude", latitude.toFixed(4));
    url.searchParams.set("longitude", longitude.toFixed(4));
  }
  url.searchParams.set("localityLanguage", language);
  return url.toString();
}

/** اسم مقروء من ردّ الخدمة (مدينة ← بلدة ← محافظة). */
function nameFrom(payload: Json): string {
  return (
    asText(payload.city) ||
    asText(payload.locality) ||
    asText(payload.principalSubdivision) ||
    asText(payload.countryName)
  );
}

/** نص الإحداثيات — بديل مقروء عند فشل ترجمة الموقع إلى اسم. */
export function coordinatesText(latitude: number, longitude: number): string {
  return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
}

/**
 * تحويل إحداثيات إلى اسم مدينة/دولة (بالعربية والإنجليزية).
 * يفشل بصمت إن تعذّر الاتصال — المتصل يقرّر البديل.
 */
export async function resolveLocationNames(
  latitude: number,
  longitude: number,
): Promise<LocationNames> {
  const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const cached = readGeoCacheEntry<LocationNames>(cacheKey, GEO_CACHE_MAX_AGE);
  if (cached) return cached;

  const [arResult, enResult] = await Promise.allSettled([
    fetchGeoJson(buildGeoUrl("ar", latitude, longitude)),
    fetchGeoJson(buildGeoUrl("en", latitude, longitude)),
  ]);

  const ar = arResult.status === "fulfilled" ? arResult.value : null;
  const en = enResult.status === "fulfilled" ? enResult.value : null;
  if (!ar && !en) throw new GeolocationError("unavailable");

  const names: LocationNames = {
    city: (ar ? nameFrom(ar) : "") || (en ? nameFrom(en) : "") || coordinatesText(latitude, longitude),
    cityEn: (en ? nameFrom(en) : "") || (ar ? nameFrom(ar) : "") || coordinatesText(latitude, longitude),
    country: (ar ? asText(ar.countryName) : "") || (en ? asText(en.countryName) : ""),
    countryEn: (en ? asText(en.countryName) : "") || (ar ? asText(ar.countryName) : ""),
    countryCode: ((en ? asText(en.countryCode) : "") || (ar ? asText(ar.countryCode) : "")).toUpperCase(),
  };

  writeGeoCache(cacheKey, names);
  return names;
}

/** حالة الإذن الحالية للموقع (prompt/denied/granted) إن أمكن معرفتها. */
export async function getGeolocationPermission(): Promise<
  "granted" | "denied" | "prompt" | "unknown"
> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) return "unknown";
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" });
    return (status?.state as "granted" | "denied" | "prompt") ?? "unknown";
  } catch {
    return "unknown";
  }
}

/** بيئة تحديد الموقع في هذا الجهاز: جاهز، أو غير آمن (http)، أو غير مدعوم. */
export type GeolocationEnvironment = "ok" | "insecure" | "unsupported";

/**
 * فحص بيئة الموقع قبل أي طلب.
 * مهم لـ iPhone: نظام Safari لا يسمح بالموقع إلا عبر اتصال آمن (https)، وعند
 * فتح النسخة التجريبية من الجوال عبر عنوان الشبكة المحلية (http) يفشل الطلب
 * بلا نافذة إذن — فنُظهر للزائر سببًا واضحًا بدل «تعذّر تحديد موقعك».
 */
export function geolocationEnvironment(): GeolocationEnvironment {
  if (typeof window !== "undefined" && window.isSecureContext === false) return "insecure";
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) return "unsupported";
  return "ok";
}

/** جهاز آبل (iPhone/iPad) — لإظهار إرشاد الإذن الخاص بـ iOS. */
export function isAppleMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && typeof document !== "undefined" && "ontouchend" in document)
  );
}

type Coordinates = { latitude: number; longitude: number };

function toCoordinates(position: GeolocationPosition): Coordinates {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    throw new GeolocationError("unavailable");
  }
  return { latitude, longitude };
}

function classifyError(error: GeolocationPositionError): GeolocationError {
  if (error.code === error.PERMISSION_DENIED) return new GeolocationError("denied");
  if (error.code === error.TIMEOUT) return new GeolocationError("timeout");
  return new GeolocationError("unavailable");
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getPositionOnce(options: PositionOptions): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            resolve(toCoordinates(position));
          } catch (error) {
            reject(error);
          }
        },
        (error) => reject(classifyError(error)),
        options,
      );
    } catch {
      reject(new GeolocationError("unsupported"));
    }
  });
}

/** أول قراءة من watchPosition ثم إيقاف المراقبة — ملاذ أخير في بعض الأجهزة. */
function getPositionFromWatch(timeoutMs: number): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let watchId: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timer !== null) clearTimeout(timer);
      action();
    };

    try {
      watchId = navigator.geolocation.watchPosition(
        (position) =>
          finish(() => {
            try {
              resolve(toCoordinates(position));
            } catch (error) {
              reject(error);
            }
          }),
        (error) => finish(() => reject(classifyError(error))),
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 },
      );
      timer = setTimeout(() => finish(() => reject(new GeolocationError("timeout"))), timeoutMs);
    } catch {
      finish(() => reject(new GeolocationError("unsupported")));
    }
  });
}

/**
 * طلب إحداثيات الجهاز بثلاث محاولات متدرّجة:
 *   ١) إصلاح سريع من الشبكة (واي فاي/أبراج) — الأسرع على الجوال وعادة يكفي للمواقيت.
 *   ٢) إصلاح GPS حقيقي بمهلة أطول — لمن لا تعمل معه المحاولة الأولى.
 *   ٣) المراقبة (watchPosition) — بعض الأجهزة لا تُرجع شيئًا عبر getCurrentPosition.
 *
 * رفض الإذن (denied) يُوقف المحاولات فورًا فلا نُزعج الزائر بنوافذ متكرّرة.
 */
export async function requestPrecisePosition(): Promise<Coordinates> {
  const environment = geolocationEnvironment();
  if (environment === "insecure") throw new GeolocationError("insecure");
  if (environment === "unsupported") throw new GeolocationError("unsupported");

  const attempts: Array<() => Promise<Coordinates>> = [
    () =>
      getPositionOnce({
        enableHighAccuracy: false,
        timeout: GEO_COARSE_TIMEOUT_MS,
        maximumAge: 5 * 60 * 1000,
      }),
    () => getPositionOnce({ enableHighAccuracy: true, timeout: GEO_PRECISE_TIMEOUT_MS, maximumAge: 0 }),
    () => getPositionFromWatch(GEO_WATCH_TIMEOUT_MS),
  ];

  let lastError: GeolocationError = new GeolocationError("unavailable");
  for (let index = 0; index < attempts.length; index += 1) {
    // مهلة قصيرة قبل إعادة المحاولة: تعالج فشل أول طلب على iPhone/PWA.
    if (index > 0) await delay(GEO_RETRY_DELAY_MS);
    try {
      return await attempts[index]();
    } catch (error) {
      const geoError = error instanceof GeolocationError ? error : new GeolocationError("unavailable");
      if (geoError.kind === "denied" || geoError.kind === "unsupported" || geoError.kind === "insecure") {
        throw geoError;
      }
      lastError = geoError;
    }
  }
  throw lastError;
}

/** موقع تقريبي حسب عنوان الشبكة (IP) — بلا إذن المستخدم. */
export async function approximateLocationFromIp(): Promise<ResolvedLocation | null> {
  const cached = readGeoCacheEntry<ResolvedLocation>("ip", IP_CACHE_MAX_AGE);
  if (cached) return cached;

  try {
    const [ar, en] = await Promise.all([
      fetchGeoJson(buildGeoUrl("ar")),
      fetchGeoJson(buildGeoUrl("en")),
    ]);
    const latitude = asNumber(ar.latitude) ?? asNumber(en.latitude);
    const longitude = asNumber(ar.longitude) ?? asNumber(en.longitude);
    if (latitude === null || longitude === null || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return null;
    }

    const location: ResolvedLocation = {
      latitude,
      longitude,
      city: nameFrom(ar) || nameFrom(en) || coordinatesText(latitude, longitude),
      cityEn: nameFrom(en) || nameFrom(ar) || coordinatesText(latitude, longitude),
      country: asText(ar.countryName) || asText(en.countryName),
      countryEn: asText(en.countryName) || asText(ar.countryName),
      countryCode: (asText(ar.countryCode) || asText(en.countryCode)).toUpperCase(),
      source: "ip",
      savedAt: Date.now(),
    };
    writeGeoCache("ip", location);
    return location;
  } catch {
    return null;
  }
}

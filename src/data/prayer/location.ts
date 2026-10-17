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

export type GeolocationFailureKind = "denied" | "unavailable" | "timeout" | "unsupported";

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

/**
 * طلب إحداثيات الجهاز.
 * لا نستعمل دقة عالية عن قصد: مواقيت الصلاة تحتاج مستوى المدينة، والدقة العالية
 * تُستهلك البطارية وتُبطئ الاستجابة بلا فائدة.
 */
export function requestPrecisePosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new GeolocationError("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          Math.abs(latitude) > 90 ||
          Math.abs(longitude) > 180
        ) {
          reject(new GeolocationError("unavailable"));
          return;
        }
        resolve({ latitude, longitude });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) reject(new GeolocationError("denied"));
        else if (error.code === error.TIMEOUT) reject(new GeolocationError("timeout"));
        else reject(new GeolocationError("unavailable"));
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60 * 1000 },
    );
  });
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

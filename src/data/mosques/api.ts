/**
 * البحث عن المساجد القريبة عبر OpenStreetMap / Overpass API.
 *
 * لماذا Overpass؟
 * - بيانات مفتوحة (ODbL) بلا مفاتيح ولا حساب.
 * - البحث يجري لحظيًا حول إحداثيات المستخدم فقط.
 *
 * الحدود المعروفة:
 * - خدمة عامة best-effort وقد ترفض الطلبات عند الضغط؛ لذلك نستخدم استعلامًا
 *   صغيرًا، ونتيح خادمًا بديلًا، ونحفظ النتائج محليًا لتفادي تكرار الطلبات.
 * - تغطية المساجد تختلف بين المدن؛ النتائج ليست حصرًا رسميًا.
 * - لا نرسل أي معرّف عن المستخدم، فقط إحداثيات مقرّبة ونصف القطر.
 */

import { haversineDistanceKm, type Coordinates } from "../../utils/geo";

export type Mosque = {
  id: string;
  name: string;
  nameEn: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  address: string;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  denomination: string | null;
  /** وسم OSM الذي عُرّف به العنصر (للتشخيص فقط). */
  kind: "place_of_worship" | "mosque" | "other";
};

export type MosqueSearchResult = {
  mosques: Mosque[];
  source: "network" | "cache";
  stale: boolean;
  fetchedAt: number;
};

export type MosqueSearchErrorKind = "network" | "timeout" | "http" | "rate-limit" | "parse";

export class MosqueSearchError extends Error {
  kind: MosqueSearchErrorKind;
  status?: number;

  constructor(kind: MosqueSearchErrorKind, message?: string, status?: number) {
    super(message ?? kind);
    this.name = "MosqueSearchError";
    this.kind = kind;
    this.status = status;
  }
}

export function describeMosqueError(error: unknown): string {
  if (error instanceof MosqueSearchError) {
    switch (error.kind) {
      case "rate-limit":
        return "خدمة خرائط المساجد مشغولة الآن. جرّب بعد قليل أو افتح الخريطة مباشرة.";
      case "timeout":
        return "انتهت مهلة البحث. تحقّق من الإنترنت وحاول مرة أخرى.";
      case "http":
        return `تعذّر الوصول إلى خدمة المساجد (${error.status ?? "خطأ"}).`;
      case "parse":
        return "وصل ردّ غير مفهوم من خدمة المساجد. حاول مرة أخرى.";
      default:
        return "تعذّر الاتصال بخدمة المساجد. يمكنك فتح الخريطة للبحث يدويًا.";
    }
  }
  return "حدث خطأ غير متوقّع أثناء البحث عن المساجد.";
}

/**
 * خوادم Overpass العامة ذات التغطية العالمية فقط، مرتّبة حسب الاستجابة.
 * لا نرسل الطلب إلا بضغطة المستخدم، ونجرّب البديل التالي عند فشل السابق.
 *
 * تنبيه: لا تُضَف خوادم إقليمية مثل `overpass.osm.ch` (سويسرا فقط)؛ فهي تردّ
 * بنجاح وقائمة فارغة خارج منطقتها، فتبدو النتيجة كأنه «لا توجد مساجد».
 */
export const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const ENDPOINT_TIMEOUT_MS = 10_000;
// الإصدار ٢ يلغي نتائج «صفر مساجد» التي خزّنها الخادم الإقليمي السابق.
const CACHE_KEY = "sj-mosques-cache-v2";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_STALE_MS = 45 * 24 * 60 * 60 * 1000;
// نتيجة واحدة فقط: آخر بحث، وليس سجلًا زمنيًا للمواقع.
const CACHE_MAX_ENTRIES = 1;

export const MOSQUE_RADII_KM = [1, 3, 5, 10] as const;
export type MosqueRadiusKm = (typeof MOSQUE_RADII_KM)[number];

const clampRadiusMeters = (radiusKm: number) =>
  Math.round(Math.min(15, Math.max(0.5, radiusKm)) * 1000);

/**
 * استعلام Overpass: مساجد وأماكن عبادة إسلامية، مع بناء مسجد كاحتياط.
 * الحد ٨٠ نتيجة يحمي الخدمة والواجهة معًا.
 */
export function buildOverpassQuery(location: Coordinates, radiusKm: number): string {
  const lat = Number(location.latitude.toFixed(5));
  const lon = Number(location.longitude.toFixed(5));
  const radius = clampRadiusMeters(radiusKm);
  return [
    "[out:json][timeout:25];",
    "(",
    `  nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${lat},${lon});`,
    `  nwr["building"="mosque"](around:${radius},${lat},${lon});`,
    ");",
    "out center 80;",
  ].join("\n");
}

type Json = Record<string, unknown>;
const asRecord = (value: unknown): Json | null =>
  typeof value === "object" && value !== null ? (value as Json) : null;
const asString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;
const asNumber = (value: unknown): number | null => {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const tag = (tags: Json, key: string): string | null => asString(tags[key]);

function addressFromTags(tags: Json): string {
  const parts = [
    tag(tags, "addr:street"),
    tag(tags, "addr:district"),
    tag(tags, "addr:city"),
    tag(tags, "addr:state"),
  ].filter((part): part is string => Boolean(part));
  return parts.join("، ");
}

function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * تحويل ردّ Overpass إلى قائمة مساجد مرتّبة بالمسافة.
 * دالة نقية قابلة للاختبار بلا شبكة.
 */
export function parseOverpassPayload(payload: unknown, user: Coordinates): Mosque[] {
  const root = asRecord(payload);
  const elements = Array.isArray(root?.elements) ? root.elements : [];
  const results: Mosque[] = [];

  for (const raw of elements) {
    const element = asRecord(raw);
    if (!element) continue;
    const center = asRecord(element.center);
    const latitude = asNumber(element.lat) ?? asNumber(center?.lat);
    const longitude = asNumber(element.lon) ?? asNumber(center?.lon);
    if (latitude === null || longitude === null) continue;
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) continue;

    const tags = asRecord(element.tags) ?? {};
    const amenity = tag(tags, "amenity");
    const building = tag(tags, "building");
    const religion = tag(tags, "religion");
    const isPlaceOfWorship = amenity === "place_of_worship";
    const isMosqueBuilding = building === "mosque";
    // places of worship are included only when explicitly tagged Muslim;
    // building=mosque is accepted even if religion is missing.
    if (!isMosqueBuilding && !(isPlaceOfWorship && religion === "muslim")) continue;

    const name = tag(tags, "name:ar") ?? tag(tags, "name") ?? tag(tags, "name:en");
    const nameEn = tag(tags, "name:en") ?? tag(tags, "name") ?? (isMosqueBuilding ? "Mosque" : "Muslim place of worship");
    const distanceKm = haversineDistanceKm(user, { latitude, longitude });

    results.push({
      id: `${String(element.type ?? "element")}/${String(element.id ?? `${latitude},${longitude}`)}`,
      name: name ?? (isMosqueBuilding ? "مسجد" : "مصلى"),
      nameEn,
      latitude,
      longitude,
      distanceKm,
      address: addressFromTags(tags),
      phone: tag(tags, "phone") ?? tag(tags, "contact:phone"),
      website: safeHttpUrl(tag(tags, "website") ?? tag(tags, "contact:website")),
      openingHours: tag(tags, "opening_hours"),
      denomination: tag(tags, "denomination"),
      kind: isPlaceOfWorship ? "place_of_worship" : "mosque",
    });
  }

  results.sort((a, b) => a.distanceKm - b.distanceKm);

  // إزالة التكرار القريب جدًا (عقدة وبناء لنفس المسجد) دون حذف مساجد متجاورة.
  const unique: Mosque[] = [];
  for (const mosque of results) {
    const duplicate = unique.some(
      (existing) =>
        existing.id === mosque.id ||
        (existing.distanceKm && mosque.distanceKm &&
          Math.abs(existing.distanceKm - mosque.distanceKm) < 0.03 &&
          haversineDistanceKm(existing, mosque) < 0.08 &&
          existing.name.trim() === mosque.name.trim()),
    );
    if (!duplicate) unique.push(mosque);
  }
  return unique.slice(0, 80);
}

/* --------------------------------- التخزين -------------------------------- */

type CacheEntry = { at: number; mosques: Mosque[] };

function readCache(): Record<string, CacheEntry> {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    if (!parsed || typeof parsed !== "object") return {};
    const entries = Object.entries(parsed)
      .filter(([, entry]) => entry && typeof entry.at === "number" && Array.isArray(entry.mosques))
      .sort((a, b) => b[1].at - a[1].at);
    // تنظيف النسخ القديمة التي كانت تحتفظ بعدة مواقع.
    if (entries.length > CACHE_MAX_ENTRIES) {
      const trimmed = Object.fromEntries(entries.slice(0, CACHE_MAX_ENTRIES));
      try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
      } catch {
        /* التخزين غير متاح */
      }
      return trimmed;
    }
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, CacheEntry>) {
  try {
    const entries = Object.entries(cache).sort((a, b) => b[1].at - a[1].at);
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify(Object.fromEntries(entries.slice(0, CACHE_MAX_ENTRIES))),
    );
  } catch {
    /* التخزين غير متاح */
  }
}

export function mosqueCacheKey(location: Coordinates, radiusKm: number): string {
  return `m:${location.latitude.toFixed(3)}:${location.longitude.toFixed(3)}:${radiusKm}`;
}

/** المسافات تُحسب دائمًا من الموقع الحالي، حتى لو جاءت القائمة من ذاكرة موقع مقرّب. */
function withCurrentDistances(mosques: Mosque[], location: Coordinates): Mosque[] {
  return mosques
    .map((mosque) => ({
      ...mosque,
      distanceKm: haversineDistanceKm(location, mosque),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function readCachedMosques(
  location: Coordinates,
  radiusKm: number,
  maxAgeMs = CACHE_TTL_MS,
): CacheEntry | null {
  const entry = readCache()[mosqueCacheKey(location, radiusKm)];
  if (!entry || Date.now() - entry.at > maxAgeMs) return null;
  // لا نثق بنتيجة فارغة مخزّنة: قد تكون من خادم إقليمي أو تغطية ناقصة.
  if (entry.mosques.length === 0) return null;
  return entry;
}

function putCache(location: Coordinates, radiusKm: number, mosques: Mosque[]) {
  const cache = readCache();
  cache[mosqueCacheKey(location, radiusKm)] = { at: Date.now(), mosques };
  writeCache(cache);
}

/* --------------------------------- الشبكة -------------------------------- */

/** مسار نفس الأصل الذي يمرّر الاستعلام عبر عامل Cloudflare للموقع. */
const PROXY_PATH = "/api/mosques";
const PROXY_TIMEOUT_MS = 32_000;

/** رابط تمرير البحث عبر عامل Cloudflare (نفس الأصل). */
export function buildProxySearchUrl(
  origin: string,
  location: Coordinates,
  radiusKm: number,
): string {
  const params = new URLSearchParams({
    lat: location.latitude.toFixed(5),
    lon: location.longitude.toFixed(5),
    r: String(radiusKm),
  });
  return `${origin}${PROXY_PATH}?${params.toString()}`;
}

/**
 * تمرير البحث عبر عامل Cloudflare الخاص بالموقع (نفس الأصل).
 * يفيد حين تكون خدمات Overpass العامة محجوبة أو بطيئة من شبكة المستخدم.
 * لا يُستخدم إلا للقراءة، ولا يُخزَّن شيء على الخادم.
 */
async function fetchViaProxy(location: Coordinates, radiusKm: number): Promise<unknown | null> {
  if (typeof window === "undefined" || !window.location?.origin) return null;
  const origin = window.location.origin;
  try {
    const base = new URL(origin);
    if (base.protocol !== "http:" && base.protocol !== "https:") return null;
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);
  try {
    const response = await fetch(buildProxySearchUrl(origin, location, radiusKm), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as Json;
    // العامل يعيد عناصر Overpass الخام كما هي.
    if (!Array.isArray(payload.elements)) return null;
    return payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFromEndpoint(
  endpoint: string,
  query: string,
  signal: AbortSignal,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal,
    });
  } catch (error) {
    if ((error as DOMException | undefined)?.name === "AbortError") {
      throw new MosqueSearchError("timeout");
    }
    throw new MosqueSearchError("network");
  }

  if (response.status === 429) throw new MosqueSearchError("rate-limit", "429", 429);
  if (!response.ok) throw new MosqueSearchError("http", `HTTP ${response.status}`, response.status);

  try {
    return (await response.json()) as unknown;
  } catch {
    throw new MosqueSearchError("parse");
  }
}

/** البحث عن المساجد حول موقع محدد. لا يُستدعى إلا بضغطة صريحة من المستخدم. */
export async function searchMosques(
  location: Coordinates,
  radiusKm: number,
  options: { force?: boolean } = {},
): Promise<MosqueSearchResult> {
  const cached = readCachedMosques(location, radiusKm);
  if (!options.force && cached) {
    return {
      mosques: withCurrentDistances(cached.mosques, location),
      source: "cache",
      stale: false,
      fetchedAt: cached.at,
    };
  }

  const query = buildOverpassQuery(location, radiusKm);
  let lastError: unknown = null;
  let emptyResult: Mosque[] | null = null;

  // أولًا: نفس الأصل — عامل Cloudflare يمرّر الاستعلام من شبكة قريبة من
  // الخوادم العامة، فيكون أسرع وأقل عرضة للحجب من اتصال المتصفح مباشرة.
  const proxied = await fetchViaProxy(location, radiusKm);
  if (proxied) {
    const mosques = parseOverpassPayload(proxied, location);
    // العامل يجرّب كل الخوادم قبل أن يعيد نتيجة فارغة، فلا حاجة لتكرار الطلب.
    if (mosques.length > 0) putCache(location, radiusKm, mosques);
    return { mosques, source: "network", stale: false, fetchedAt: Date.now() };
  }

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ENDPOINT_TIMEOUT_MS);
    try {
      const payload = await fetchFromEndpoint(endpoint, query, controller.signal);
      const mosques = parseOverpassPayload(payload, location);
      if (mosques.length > 0) {
        putCache(location, radiusKm, mosques);
        return { mosques, source: "network", stale: false, fetchedAt: Date.now() };
      }
      // ردّ ناجح لكنه فارغ قد يأتي من نسخة ناقصة التغطية؛ نجرّب البديل التالي
      // قبل الحكم بعدم وجود مساجد. ولا نخزّن نتيجة فارغة كي لا تلتصق بالمستخدم.
      emptyResult = mosques;
    } catch (error) {
      // نجرّب الخادم البديل أيضًا عند 429/المهلة/الخطأ الشبكي.
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
  }

  if (emptyResult) {
    return { mosques: emptyResult, source: "network", stale: false, fetchedAt: Date.now() };
  }

  const stale = readCachedMosques(location, radiusKm, CACHE_STALE_MS);
  if (stale) {
    return {
      mosques: withCurrentDistances(stale.mosques, location),
      source: "cache",
      stale: true,
      fetchedAt: stale.at,
    };
  }
  throw lastError instanceof MosqueSearchError
    ? lastError
    : new MosqueSearchError("network");
}

/** رابط خريطة OpenStreetMap كبديل عند فشل البحث. */
export function osmMapLink(location: Coordinates): string {
  const lat = location.latitude.toFixed(5);
  const lon = location.longitude.toFixed(5);
  return `https://www.openstreetmap.org/#map=15/${lat}/${lon}`;
}

/** رابط اتجاهات من موقع المستخدم إلى المسجد. */
export function directionsLink(from: Coordinates, mosque: Mosque): string {
  const fromParam = `${from.latitude.toFixed(5)},${from.longitude.toFixed(5)}`;
  const toParam = `${mosque.latitude.toFixed(5)},${mosque.longitude.toFixed(5)}`;
  return `https://www.openstreetmap.org/directions?from=${fromParam}&to=${toParam}`;
}

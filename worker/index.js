/**
 * Cloudflare Worker خفيف فوق الأصول الثابتة.
 * لا يغيّر المحتوى؛ يضيف رؤوس أمان وتخزين مؤقت مناسبة ويترك توجيه HTML
 * وإعداد 404 إلى إعداد assets في wrangler.jsonc.
 *
 * الاستثناء الوحيد: المسار `/api/mosques` يمرّر استعلام Overpass من شبكة
 * Cloudflare (لتفادي حجب شبكات المستخدم لخدمات Overpass العامة) دون تخزين
 * أي إحداثيات أو سجل بحث.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
  "font-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "media-src 'self' blob: data: https://cdn.islamic.network",
  "connect-src 'self' https://api.aladhan.com https://api.bigdatacloud.net https://cdn.islamic.network https://overpass-api.de https://maps.mail.ru https://overpass.private.coffee",
  "frame-src https://www.tvquran.com https://*.tvquran.com",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(self), camera=(), microphone=(), payment=(), usb=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Cross-Origin-Resource-Policy": "same-origin",
};

function cacheControl(pathname) {
  if (pathname.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  if (pathname === "/sw.js" || pathname === "/manifest.webmanifest") return "no-cache";
  if (pathname.endsWith(".html") || pathname === "/") return "public, max-age=0, must-revalidate";
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt") return "public, max-age=86400";
  if (pathname.startsWith("/icons/") || pathname === "/favicon.svg" || pathname === "/theme-init.js") {
    return "public, max-age=604800";
  }
  return "public, max-age=3600";
}

/* --------------------------- تمرير بحث المساجد --------------------------- */

const MOSQUE_API_PATH = "/api/mosques";
// خوادم Overpass ذات التغطية العالمية فقط (لا خوادم إقليمية).
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
const OVERPASS_TIMEOUT_MS = 6000;
// مهلة إجمالية لكل مرحلة حتى لا يتأخر الردّ على المستخدم.
const OVERPASS_STAGE_BUDGET_MS = 12000;
const PHOTON_ENDPOINT = "https://photon.komoot.io/api/";
const PHOTON_TIMEOUT_MS = 5000;
const PHOTON_STAGE_BUDGET_MS = 14000;
const ALLOWED_ORIGINS = new Set([
  "https://sadqah-jariyah.ahmadkisswanisite.workers.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

function buildOverpassQuery(lat, lon, radiusMeters) {
  return [
    "[out:json][timeout:20];",
    "(",
    `  nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusMeters},${lat},${lon});`,
    `  nwr["building"="mosque"](around:${radiusMeters},${lat},${lon});`,
    ");",
    "out center 80;",
  ].join("\n");
}

/** اسم المضيف فقط، لأغراض التشخيص في رسائل الخطأ. */
function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return "unknown";
  }
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371008.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Photon: فهرس جغرافي لنفس بيانات OSM، يُستعمل حين تعجز خوادم Overpass. */
async function fetchPhotonMosques(lat, lon, radiusMeters) {
  const dLat = radiusMeters / 111320;
  const cos = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
  const dLon = radiusMeters / (111320 * cos);
  const bbox = [
    (lon - dLon).toFixed(5),
    (lat - dLat).toFixed(5),
    (lon + dLon).toFixed(5),
    (lat + dLat).toFixed(5),
  ].join(",");

  const queries = [
    { q: "مسجد", tag: "amenity:place_of_worship" },
    { q: "mosque", tag: "amenity:place_of_worship" },
    { q: "mosque", tag: "building:mosque" },
  ];

  const deadline = Date.now() + PHOTON_STAGE_BUDGET_MS;
  const elements = [];
  const seen = new Set();

  for (const { q, tag } of queries) {
    if (Date.now() > deadline) break;
    // نكتفي بالاستعلامين الأولين إن أفرزا نتائج؛ والثالث احتياطي.
    if (elements.length > 0 && tag !== "building:mosque") continue;
    if (elements.length > 0 && tag === "building:mosque") break;
    const url = `${PHOTON_ENDPOINT}?${new URLSearchParams({
      q,
      bbox,
      limit: "50",
      osm_tag: tag,
    }).toString()}`;
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(PHOTON_TIMEOUT_MS),
      });
      if (!response.ok) continue;
      const payload = await response.json();
      for (const feature of Array.isArray(payload?.features) ? payload.features : []) {
        const props = feature?.properties ?? {};
        const coords = feature?.geometry?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) continue;
        const [featureLon, featureLat] = coords;
        if (!Number.isFinite(featureLat) || !Number.isFinite(featureLon)) continue;
        if (haversineMeters(lat, lon, featureLat, featureLon) > radiusMeters) continue;

        const name = typeof props.name === "string" ? props.name : "";
        const nameEn = typeof props.name_en === "string" ? props.name_en : "";
        const isExplicitMosque = props.osm_key === "building" && props.osm_value === "mosque";
        const mentionsMosque =
          name.includes("مسجد") ||
          nameEn.toLowerCase().includes("mosque") ||
          name.toLowerCase().includes("mosque");
        // نقبل فقط ما هو مسجد بالاسم صراحةً؛ فلا تُعرض كنائس أو معابد.
        if (!isExplicitMosque && !mentionsMosque) continue;

        const key = `${props.osm_type ?? "N"}/${props.osm_id ?? ""}/${featureLat.toFixed(4)}/${featureLon.toFixed(4)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const tags = {
          name,
          ...(nameEn ? { "name:en": nameEn } : {}),
          ...(props.street ? { "addr:street": props.street } : {}),
          ...(props.city ? { "addr:city": props.city } : {}),
          ...(props.state ? { "addr:state": props.state } : {}),
          ...(props.country ? { "addr:country": props.country } : {}),
          ...(props.postcode ? { "addr:postcode": props.postcode } : {}),
        };
        if (isExplicitMosque) {
          tags.building = "mosque";
        } else {
          tags.amenity = "place_of_worship";
          tags.religion = "muslim";
        }

        elements.push({
          type: props.osm_type === "W" ? "way" : props.osm_type === "R" ? "relation" : "node",
          id: props.osm_id ?? elements.length + 1,
          lat: featureLat,
          lon: featureLon,
          tags,
        });
      }
    } catch {
      // نتابع المحاولة التالية.
    }
  }

  return elements;
}

/**
 * يمرّر استعلام Overpass من شبكة Cloudflare ويعيد JSON الخام كما هو.
 * لا يحفظ أي إحداثيات، ولا ينشئ سجل بحث.
 */
async function handleMosqueApi(request, url) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=600",
    "X-Content-Type-Options": "nosniff",
  };
  const origin = request.headers.get("Origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  const radiusKm = Number(url.searchParams.get("r"));
  const valid =
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    Number.isFinite(radiusKm) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lon) <= 180 &&
    radiusKm >= 0.5 &&
    radiusKm <= 15;

  if (!valid) {
    return new Response(JSON.stringify({ error: "bad-request" }), { status: 400, headers });
  }

  const radiusMeters = Math.round(radiusKm * 1000);
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const cache = caches.default;
  const cached = await cache.match(cacheKey).catch(() => null);
  if (cached) return cached;

  // مصدران بالتوازي: Overpass (أغنى بالوسوم) وPhoton (نفس بيانات OSM، أسرع).
  const [overpass, photon] = await Promise.all([
    fetchOverpassMosques(lat, lon, radiusMeters),
    fetchPhotonMosques(lat, lon, radiusMeters),
  ]);

  const attempts = [...overpass.attempts];
  let payload = null;
  let source = "";

  if (overpass.elements.length > 0) {
    payload = { elements: overpass.elements, source: "overpass" };
    source = "overpass";
  } else if (photon.length > 0) {
    payload = { elements: photon, source: "photon", note: "OpenStreetMap via Photon" };
    source = "photon";
  } else if (overpass.emptyPayload) {
    payload = overpass.emptyPayload;
    source = "overpass";
  }

  if (!payload) {
    attempts.push("photon=empty");
    return new Response(
      JSON.stringify({ error: "upstream-unavailable", detail: attempts.join("; ") }),
      { status: 502, headers },
    );
  }

  const response = new Response(JSON.stringify(payload), { status: 200, headers });
  // تخزين مؤقت عند الحافة: يتجنّب تكرار الطلبات العامة لنفس المنطقة.
  await cache.put(cacheKey, response.clone()).catch(() => {});
  return response;
}

/** استعلام Overpass من شبكة Cloudflare مع تخطّي الردّ الفارغ. */
async function fetchOverpassMosques(lat, lon, radiusMeters) {
  const query = buildOverpassQuery(lat.toFixed(5), lon.toFixed(5), radiusMeters);
  const body = `data=${encodeURIComponent(query)}`;
  const attempts = [];
  let emptyPayload = null;
  const deadline = Date.now() + OVERPASS_STAGE_BUDGET_MS;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    if (Date.now() > deadline) break;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "SadqahJariyah/1.0 (+https://sadqah-jariyah.ahmadkisswanisite.workers.dev)",
        },
        body,
        signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
      });
      if (!response.ok) {
        attempts.push(`${hostOf(endpoint)}=http-${response.status}`);
        continue;
      }
      const payload = await response.json();
      const elements = Array.isArray(payload?.elements) ? payload.elements : [];
      if (elements.length === 0) {
        // ردّ ناجح لكن فارغ: قد تكون تغطية ناقصة، فنجرّب الخادم التالي.
        emptyPayload = payload;
        attempts.push(`${hostOf(endpoint)}=empty`);
        continue;
      }
      attempts.push(`${hostOf(endpoint)}=ok`);
      return { elements, emptyPayload, attempts };
    } catch (error) {
      attempts.push(
        `${hostOf(endpoint)}=${error?.name === "TimeoutError" ? "timeout" : "network"}`,
      );
    }
  }
  return { elements: [], emptyPayload, attempts };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === MOSQUE_API_PATH) {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Accept",
            "Access-Control-Max-Age": "86400",
            Vary: "Origin",
          },
        });
      }
      if (request.method !== "GET") {
        return new Response(JSON.stringify({ error: "method-not-allowed" }), {
          status: 405,
          headers: { "Content-Type": "application/json; charset=utf-8" },
        });
      }
      return handleMosqueApi(request, url);
    }

    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);

    for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
    if (!headers.has("Cache-Control")) headers.set("Cache-Control", cacheControl(url.pathname));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

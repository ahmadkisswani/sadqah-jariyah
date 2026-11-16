/**
 * Cloudflare Worker خفيف فوق الأصول الثابتة.
 * لا يغيّر المحتوى؛ يضيف رؤوس أمان وتخزين مؤقت مناسبة ويترك توجيه HTML
 * وإعداد 404 إلى إعداد assets في wrangler.jsonc.
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

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    const url = new URL(request.url);

    for (const [key, value] of Object.entries(SECURITY_HEADERS)) headers.set(key, value);
    if (!headers.has("Cache-Control")) headers.set("Cache-Control", cacheControl(url.pathname));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};

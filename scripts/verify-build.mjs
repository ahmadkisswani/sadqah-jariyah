// @ts-nocheck
/**
 * فحص مخرجات البناء الحقيقية: SEO، PWA، الأصول، صفحات المسارات، ورؤوس الأمان.
 * يفشل بعمليات خروج غير صفرية بدل الاكتفاء بطباعة تحذيرات.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SITE_URL = (process.env.VITE_SITE_URL || "https://sadqah-jariyah.ahmadkisswanisite.workers.dev").replace(/\/+$/, "");
const DIST = "dist";
const errors = [];
const warnings = [];

const pass = (name, detail = "") => console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
const fail = (name, detail = "") => {
  errors.push(`${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
};
const warn = (name, detail = "") => {
  warnings.push(`${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`WARN  ${name}${detail ? ` — ${detail}` : ""}`);
};
const check = (name, condition, detail = "") => (condition ? pass(name, detail) : fail(name, detail));
const read = (file) => readFileSync(join(DIST, file), "utf8");
const exists = (file) => existsSync(join(DIST, file));

const html = exists("index.html") ? read("index.html") : "";
const canonical = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(html)?.[1];
const title = /<title>(.*?)<\/title>/is.exec(html)?.[1];
const description = /<meta\s+name="description"\s+content="([^"]*)"/is.exec(html)?.[1];
const theme = /<meta\s+name="theme-color"\s+content="([^"]+)"/i.exec(html)?.[1];

console.log(`\n=== الموقع: ${SITE_URL} ===\n`);
console.log("--- الصفحة الرئيسية ---");
check("index.html موجود", Boolean(html));
check("lang=ar وdir=rtl", /<html[^>]*lang="ar"[^>]*dir="rtl"/i.test(html));
check("عنوان الصفحة", Boolean(title) && title.includes("صدقة جارية"), title?.slice(0, 70));
check("وصف الصفحة", Boolean(description) && description.length >= 80, `${description?.length ?? 0} حرفًا`);
check(
  "canonical يطابق النطاق",
  canonical === `${SITE_URL}/`,
  canonical ?? "مفقود",
);
check("لا يوجد نطاق pages.dev قديم", !html.includes("sadqah-jariyah.pages.dev"));
check("لا توجد عناصر %SITE_URL%", !html.includes("%SITE_URL%"));
check("og:title", html.includes("og:title"));
check("og:url", new RegExp(`property="og:url" content="${SITE_URL}/"`).test(html));
check("og:image مطلق", new RegExp(`property="og:image" content="${SITE_URL}/icons/social-preview.png"`).test(html));
check("twitter:card", html.includes('name="twitter:card"'));
check("manifest", html.includes("manifest.webmanifest"));
check("theme-color", Boolean(theme), theme);
check("JSON-LD منظم", /application\/ld\+json/.test(html) && /"@type"\s*:\s*"WebSite"/.test(html));
check("رابط ملف تهيئة الوضع", html.includes('src="/theme-init.js"'));

console.log("\n--- SEO والأصول ---");
const artifact = (file) => check(file, exists(file) && statSync(join(DIST, file)).size > 0);
["robots.txt", "sitemap.xml", "404.html", "sw.js", "manifest.webmanifest", "theme-init.js", "_headers"].forEach(artifact);
["icons/icon-192.png", "icons/icon-512.png", "icons/social-preview.png", "favicon.svg"].forEach(artifact);

const robots = exists("robots.txt") ? read("robots.txt") : "";
check("robots يشير إلى sitemap", robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`));

const sitemap = exists("sitemap.xml") ? read("sitemap.xml") : "";
const urlCount = (sitemap.match(/<url>/g) ?? []).length;
check("sitemap: ١٢٧ رابطًا مفهرسًا", urlCount === 127, `وجد ${urlCount}`);
check("sitemap: الرئيسية", sitemap.includes(`<loc>${SITE_URL}/</loc>`));
check("sitemap: القرآن", sitemap.includes(`<loc>${SITE_URL}/quran/1</loc>`) && sitemap.includes(`<loc>${SITE_URL}/quran/114</loc>`));
check("sitemap: استثناء المحفوظات", !sitemap.includes("/bookmarks"));
check("sitemap: لا صفحات أخطاء", !sitemap.includes("/404"));

const routeShells = [
  ["quran.html", "/quran", "القرآن الكريم"],
  ["quran/1.html", "/quran/1", "سورة الفاتحة"],
  ["quran/114.html", "/quran/114", "سورة الناس"],
  ["about.html", "/about", "عن الموقع"],
  ["privacy.html", "/privacy", "الخصوصية"],
  ["prayer-times.html", "/prayer-times", "مواقيت الصلاة"],
  ["qibla.html", "/qibla", "اتجاه القبلة"],
  ["mosques.html", "/mosques", "المساجد القريبة"],
  ["hijri-calendar.html", "/hijri-calendar", "التقويم الهجري"],
];
for (const [file, path, expectedTitle] of routeShells) {
  if (!exists(file)) {
    fail(`shell ${file}`, "مفقود");
    continue;
  }
  const shell = read(file);
  check(`shell ${file}`, shell.includes(`<title>`) && shell.includes(expectedTitle) && shell.includes(`href="${SITE_URL}${path}"`));
}

const shellCount = existsSync(join(DIST, "quran"))
  ? readdirSync(join(DIST, "quran")).filter((file) => file.endsWith(".html")).length
  : 0;
check("shells: ١١٤ صفحة سورة", shellCount === 114, `وجد ${shellCount}`);
if (exists("bookmarks.html")) check("bookmarks noindex", /name="robots" content="noindex/i.test(read("bookmarks.html")));
if (exists("404.html")) check("404 noindex", /name="robots" content="noindex/i.test(read("404.html")));

console.log("\n--- PWA ---");
if (exists("manifest.webmanifest")) {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  check("manifest id", manifest.id === "/");
  check("manifest display", manifest.display === "standalone");
  check("manifest icons", Array.isArray(manifest.icons) && manifest.icons.length === 3);
  const shortcutUrls = Array.isArray(manifest.shortcuts)
    ? manifest.shortcuts.map((shortcut) => shortcut.url)
    : [];
  check(
    "manifest shortcuts",
    shortcutUrls.length >= 3 &&
      ["/quran", "/azkar", "/prayer-times", "/qibla"].every((url) => shortcutUrls.includes(url)),
    shortcutUrls.join(", "),
  );
}

const swFile = readdirSync(DIST).find((file) => /^sw\.js$/.test(file));
const sw = swFile ? read(swFile) : "";
const precacheUrls = [...sw.matchAll(/url:"([^"]+)"/g)].map((match) => match[1]);
check("sw.js يحوي precache", precacheUrls.length > 0, `${precacheUrls.length} عنصرًا`);
const duplicates = precacheUrls.filter((url, index) => precacheUrls.indexOf(url) !== index);
check("لا تكرار في precache", duplicates.length === 0, duplicates.slice(0, 3).join(", "));
check("SW لا يخزّن الصوت", !precacheUrls.some((url) => url.endsWith(".mp3")));
check("أيقونة 192 مرة واحدة", precacheUrls.filter((url) => url.includes("icon-192.png")).length === 1);

const headers = exists("_headers") ? read("_headers") : "";
check("رؤوس CSP", headers.includes("Content-Security-Policy"));
check("CSP: بلاطات OpenStreetMap", headers.includes("tile.openstreetmap.org"));
check("CSP: خدمة Overpass", headers.includes("overpass-api.de"));
check("CSP: خادم Overpass الاحتياطي", headers.includes("maps.mail.ru"));
check("CSP: خادم Overpass الثالث", headers.includes("overpass.private.coffee"));
check("CSP: لا خادم إقليمي", !headers.includes("overpass.osm.ch"));
check("رؤوس Permissions-Policy", headers.includes("Permissions-Policy"));
check("wrangler.jsonc موجود", existsSync("wrangler.jsonc") && readFileSync("wrangler.jsonc", "utf8").includes('"ASSETS"'));

if (warnings.length) console.log(`\n${warnings.length} تحذيرات غير حاجزة.`);
if (errors.length) {
  console.error(`\n${errors.length} فحص/فحوص فشلت.`);
  process.exit(1);
}
console.log("\nكل فحوص البناء ناجحة ✔");

// @ts-nocheck
/**
 * يولّد بعد بناء Vite:
 *  - robots.txt وsitemap.xml
 *  - نسخة HTML لكل مسار معروف بعنوان/وصف/canonical/OG خاص به
 *  - صفحة 404 حقيقية
 *
 * الهدف: الزاحف الاجتماعي ومحرك البحث يرى بيانات الصفحة الصحيحة قبل تشغيل
 * React (SPA)، مع بقاء التطبيق نفسه كما هو. المحتوى المرئي يظل يُرسم في المتصفح.
 *
 * التشغيل: node scripts/generate-seo.mjs (يُستدعى تلقائيًا بعد npm run build)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const SITE_URL = (process.env.VITE_SITE_URL || "https://sadqah-jariyah.ahmadkisswanisite.workers.dev").replace(/\/+$/, "");
const SITE_NAME = "صدقة جارية";
const SOCIAL_IMAGE = `${SITE_URL}/icons/social-preview.png`;
const TODAY = new Date().toISOString().slice(0, 10);

if (!existsSync(join(DIST, "index.html"))) {
  console.error("generate-seo: dist/index.html غير موجود — شغّل vite build أولًا.");
  process.exit(1);
}

const template = readFileSync(join(DIST, "index.html"), "utf8");
if (template.includes("%SITE_URL%")) {
  console.error("generate-seo: بقي %SITE_URL% في index.html — تحقّق من إضافة siteUrlPlugin.");
  process.exit(1);
}

const staticRoutes = JSON.parse(readFileSync(join(ROOT, "src/config/seo-routes.json"), "utf8"));
const homeRoute = staticRoutes.find((route) => route.path === "/");
if (!homeRoute) {
  console.error("generate-seo: المسار / غير موجود في seo-routes.json");
  process.exit(1);
}

const surahSource = readFileSync(join(ROOT, "src/data/quran/surahs.ts"), "utf8");
const surahRe =
  /\{\s*number:\s*(\d+),\s*name:\s*"([^"]+)",\s*englishName:\s*"([^"]+)",\s*ayahCount:\s*(\d+),\s*revelation:\s*"([^"]+)"\s*\}/g;
const surahs = [];
for (const match of surahSource.matchAll(surahRe)) {
  surahs.push({
    number: Number(match[1]),
    name: match[2],
    ayahCount: Number(match[4]),
    revelation: match[5],
  });
}
if (surahs.length !== 114) {
  console.error(`generate-seo: توقّعنا ١١٤ سورة، وجدنا ${surahs.length}.`);
  process.exit(1);
}

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const replaceMeta = (html, attr, key, value) => {
  const pattern = new RegExp(
    `<meta\\s+${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s+content="[^"]*"\\s*/?>`,
    "i",
  );
  if (!pattern.test(html)) {
    return html.replace("</head>", `    <meta ${attr}="${key}" content="${escapeHtml(value)}" />\n  </head>`);
  }
  return html.replace(pattern, `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`);
};

const buildMeta = (route) => {
  const path = route.path === "/" ? "/" : route.path.replace(/\/+$/, "");
  const canonical = `${SITE_URL}${path}`;
  return {
    ...route,
    path,
    canonical,
    image: SOCIAL_IMAGE,
    noindex: Boolean(route.noindex),
  };
};

const home = buildMeta(homeRoute);
const notFound = buildMeta({
  path: "/404",
  title: `الصفحة غير موجودة | ${SITE_NAME}`,
  description: "لم نجد الصفحة المطلوبة. يمكنك العودة إلى الصفحة الرئيسية أو فهرس القرآن الكريم.",
  noindex: true,
  breadcrumb: [{ name: "الصفحة غير موجودة", path: "/404" }],
});

const surahMetas = surahs.map((surah) =>
  buildMeta({
    path: `/quran/${surah.number}`,
    title: `سورة ${surah.name} — القرآن الكريم | ${SITE_NAME}`,
    description: `سورة ${surah.name} من القرآن الكريم (${surah.revelation}، ${surah.ayahCount} آية): اقرأ النص كاملًا، واستمع للتلاوة آية بآية، واحفظ ما تيسّر وتابع القراءة.`,
    breadcrumb: [
      { name: "القرآن الكريم", path: "/quran" },
      { name: `سورة ${surah.name}`, path: `/quran/${surah.number}` },
    ],
  }),
);

const staticMetas = staticRoutes.map((route) =>
  buildMeta({
    ...route,
    breadcrumb:
      route.path === "/"
        ? []
        : [{ name: route.title.split(" | ")[0].split(" — ")[0], path: route.path }],
  }),
);
const allMetas = [...staticMetas, ...surahMetas];

const buildJsonLd = (meta) => {
  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    inLanguage: "ar",
    description: "قرآن كريم وأذكار وأدعية وتسبيح ومواقيت الصلاة والرقية الشرعية.",
  };
  const page = {
    "@type": "WebPage",
    "@id": `${meta.canonical}#webpage`,
    url: meta.canonical,
    name: meta.title,
    description: meta.description,
    inLanguage: "ar",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    ...(meta.noindex ? {} : { primaryImageOfPage: { "@type": "ImageObject", url: meta.image } }),
  };
  const crumbs = meta.breadcrumb?.length
    ? [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
            ...meta.breadcrumb.map((crumb, index) => ({
              "@type": "ListItem",
              position: index + 2,
              name: crumb.name,
              item: `${SITE_URL}${crumb.path}`,
            })),
          ],
        },
      ]
    : [];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [website, page, ...crumbs] }).replace(
    /</g,
    "\\u003c",
  );
};

const renderShell = (meta) => {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  html = replaceMeta(html, "name", "description", meta.description);
  html = replaceMeta(html, "name", "robots", meta.noindex ? "noindex, nofollow" : "index, follow");
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
  );
  html = replaceMeta(html, "property", "og:title", meta.title);
  html = replaceMeta(html, "property", "og:description", meta.description);
  html = replaceMeta(html, "property", "og:url", meta.canonical);
  html = replaceMeta(html, "property", "og:image", meta.image);
  html = replaceMeta(html, "name", "twitter:title", meta.title);
  html = replaceMeta(html, "name", "twitter:description", meta.description);
  html = replaceMeta(html, "name", "twitter:image", meta.image);

  html = html.replace(
    /<script\s+type="application\/ld\+json"\s+id="sj-page-jsonld">[\s\S]*?<\/script>/i,
    `<script type="application/ld+json" id="sj-page-jsonld">${buildJsonLd(meta)}</script>`,
  );
  return html;
};

// كل مسار ثابت + كل سورة: ملف .html بامتداد مطابق لعنوان Cloudflare النظيف.
for (const meta of allMetas) {
  if (meta.path === "/") continue;
  const target = join(DIST, `${meta.path.slice(1)}.html`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, renderShell(meta), "utf8");
}

writeFileSync(join(DIST, "404.html"), renderShell(notFound), "utf8");

const indexable = allMetas.filter((meta) => !meta.noindex);
const sitemapUrls = indexable
  .map((meta) => {
    const priority = meta.path === "/" ? "1.0" : meta.path.startsWith("/quran/") ? "0.7" : "0.8";
    return `  <url>\n    <loc>${escapeHtml(meta.canonical)}</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>${meta.path === "/" ? "weekly" : "monthly"}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  })
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`;
writeFileSync(join(DIST, "sitemap.xml"), sitemap, "utf8");

const robots = `User-agent: *\nAllow: /\nDisallow: /bookmarks\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
writeFileSync(join(DIST, "robots.txt"), robots, "utf8");

console.log(`SEO: ${allMetas.length} مسارًا + 404، sitemap (${indexable.length} رابطًا)، robots.txt`);
console.log(`SEO: ${SITE_URL}`);

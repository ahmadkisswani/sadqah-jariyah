import { SURAHS } from "../data/quran/surahs";
import { SITE_NAME, SITE_URL, SOCIAL_IMAGE_URL, absoluteUrl } from "./site";
import staticRoutes from "./seo-routes.json";

export type Breadcrumb = {
  name: string;
  path: string;
};

export type RouteMeta = {
  /** عنوان الصفحة الكامل كما يظهر في تبويب المتصفح ونتائج البحث. */
  title: string;
  description: string;
  /** المسار القانوني بلا نطاق. */
  path: string;
  canonical: string;
  image: string;
  noindex: boolean;
  breadcrumb: Breadcrumb[];
};

type StaticRoute = {
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
};

const STATIC_ROUTES = new Map(
  (staticRoutes as StaticRoute[]).map((route) => [route.path, route]),
);

const NOT_FOUND_META: Omit<RouteMeta, "path" | "canonical"> = {
  title: `الصفحة غير موجودة | ${SITE_NAME}`,
  description: "لم نجد الصفحة المطلوبة. يمكنك العودة إلى الصفحة الرئيسية أو فهرس القرآن الكريم.",
  image: SOCIAL_IMAGE_URL,
  noindex: true,
  breadcrumb: [{ name: "الصفحة غير موجودة", path: "/404" }],
};

/** يوحّد المسار: يحذف الشرطة الأخيرة والاستعلام والهاش. */
export function normalizePathname(pathname: string): string {
  const clean = (pathname || "/").split(/[?#]/, 1)[0] || "/";
  if (clean.length > 1 && clean.endsWith("/")) return clean.replace(/\/+$/, "") || "/";
  return clean;
}

function withCanonical(
  meta: Omit<RouteMeta, "canonical">,
): RouteMeta {
  return {
    ...meta,
    canonical: absoluteUrl(meta.path),
  };
}

function buildSurahMeta(number: number): RouteMeta {
  const surah = SURAHS.find((item) => item.number === number);
  if (!surah) {
    return withCanonical({
      ...NOT_FOUND_META,
      path: `/quran/${number}`,
    });
  }

  return withCanonical({
    title: `سورة ${surah.name} — القرآن الكريم | ${SITE_NAME}`,
    description: `سورة ${surah.name} من القرآن الكريم (${surah.revelation}، ${surah.ayahCount} آية): اقرأ النص كاملًا، واستمع للتلاوة آية بآية، واحفظ ما تيسّر وتابع القراءة.`,
    path: `/quran/${surah.number}`,
    image: SOCIAL_IMAGE_URL,
    noindex: false,
    breadcrumb: [
      { name: "القرآن الكريم", path: "/quran" },
      { name: `سورة ${surah.name}`, path: `/quran/${surah.number}` },
    ],
  });
}

/**
 * بيانات SEO لمسار واحد. المسارات غير المعروفة تُعاد بعلامة noindex حتى لا
 * تُفهرس صفحات الأخطاء أو الروابط القديمة.
 */
export function getRouteMeta(pathname: string): RouteMeta {
  const path = normalizePathname(pathname);

  if (path === "/") {
    const route = STATIC_ROUTES.get("/");
    return withCanonical({
      title: route?.title ?? SITE_NAME,
      description: route?.description ?? "",
      path: "/",
      image: SOCIAL_IMAGE_URL,
      noindex: false,
      breadcrumb: [],
    });
  }

  const surahMatch = /^\/quran\/([^/]+)$/.exec(path);
  if (surahMatch) {
    const number = Number(surahMatch[1]);
    if (Number.isInteger(number) && number >= 1 && number <= 114) {
      return buildSurahMeta(number);
    }
    return withCanonical({
      ...NOT_FOUND_META,
      path,
    });
  }

  const staticRoute = STATIC_ROUTES.get(path);
  if (staticRoute) {
    return withCanonical({
      title: staticRoute.title,
      description: staticRoute.description,
      path,
      image: SOCIAL_IMAGE_URL,
      noindex: Boolean(staticRoute.noindex),
      breadcrumb:
        path === "/"
          ? []
          : [{ name: staticRoute.title.split(" | ")[0].split(" — ")[0], path }],
    });
  }

  return withCanonical({
    ...NOT_FOUND_META,
    path,
  });
}

/** كل المسارات الثابتة المفهرسة — يستخدمها مولّد sitemap. */
export function getIndexableStaticPaths(): string[] {
  return (staticRoutes as StaticRoute[])
    .filter((route) => !route.noindex)
    .map((route) => route.path);
}

export function getSitemapPaths(): string[] {
  const paths = getIndexableStaticPaths();
  for (let number = 1; number <= 114; number += 1) paths.push(`/quran/${number}`);
  return paths;
}

export { SITE_NAME, SITE_URL };

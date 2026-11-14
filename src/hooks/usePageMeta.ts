import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { getRouteMeta, type RouteMeta } from "../config/seo";
import { SITE_LANG, SITE_NAME, SITE_URL } from "../config/site";

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, type?: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
  if (type) element.setAttribute("type", type);
}

function buildJsonLd(meta: RouteMeta) {
  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: SITE_NAME,
    inLanguage: SITE_LANG,
    description: "قرآن كريم وأذكار وأدعية وتسبيح ومواقيت الصلاة والرقية الشرعية.",
  };

  const page = {
    "@type": "WebPage",
    "@id": `${meta.canonical}#webpage`,
    url: meta.canonical,
    name: meta.title,
    description: meta.description,
    inLanguage: SITE_LANG,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    ...(meta.noindex ? {} : { primaryImageOfPage: { "@type": "ImageObject", url: meta.image } }),
  };

  const crumbs = meta.breadcrumb.length
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

  return {
    "@context": "https://schema.org",
    "@graph": [website, page, ...crumbs],
  };
}

/**
 * يضبط عنوان الصفحة ووصفها وcanonical ووسوم المشاركة والبيانات المنظمة
 * اعتمادًا على المسار الحالي. مصدر الحقيقة واحد: src/config/seo.ts.
 */
export function usePageMeta(): RouteMeta {
  const { pathname } = useLocation();
  const meta = useMemo(() => getRouteMeta(pathname), [pathname]);

  useEffect(() => {
    document.title = meta.title;
    upsertMeta("name", "description", meta.description);
    upsertMeta("name", "robots", meta.noindex ? "noindex, nofollow" : "index, follow");
    upsertLink("canonical", meta.canonical);

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", "ar_AR");
    upsertMeta("property", "og:title", meta.title);
    upsertMeta("property", "og:description", meta.description);
    upsertMeta("property", "og:url", meta.canonical);
    upsertMeta("property", "og:image", meta.image);
    upsertMeta("property", "og:image:type", "image/png");
    upsertMeta("property", "og:image:width", "1200");
    upsertMeta("property", "og:image:height", "630");
    upsertMeta("property", "og:image:alt", `${SITE_NAME} — قرآن وأذكار وأدعية`);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", meta.title);
    upsertMeta("name", "twitter:description", meta.description);
    upsertMeta("name", "twitter:image", meta.image);
    upsertMeta("name", "twitter:image:alt", `${SITE_NAME} — قرآن وأذكار وأدعية`);

    let script = document.getElementById("sj-page-jsonld") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "sj-page-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(buildJsonLd(meta));
  }, [meta]);

  return meta;
}

/**
 * هوية الموقع وعنوانه العام.
 *
 * VITE_SITE_URL هو المصدر الوحيد للعنوان المطلق في وقت البناء. القيمة
 * الاحتياطية هي رابط النشر الحالي، حتى لا تختلف canonical/OG عن النطاق
 * الفعلي مرة أخرى. عند الانتقال إلى نطاق مخصص يكفي ضبط المتغير قبل البناء.
 */

const FALLBACK_SITE_URL = "https://sadqah-jariyah.ahmadkisswanisite.workers.dev";

function normalizeSiteUrl(value: string | undefined): string {
  const candidate = (value ?? "").trim() || FALLBACK_SITE_URL;
  return candidate.replace(/\/+$/, "");
}

export const SITE_URL = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
export const SITE_NAME = "صدقة جارية";
export const SITE_LANG = "ar";
export const SITE_DIR = "rtl";
export const SOCIAL_IMAGE_PATH = "/icons/social-preview.png";
export const SOCIAL_IMAGE_URL = `${SITE_URL}${SOCIAL_IMAGE_PATH}`;

/** يبني عنوانًا مطلقًا آمنًا لمسار داخلي. */
export function absoluteUrl(path: string): string {
  if (!path || path === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

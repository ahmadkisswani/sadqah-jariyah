import { PROJECT_NAME } from "../constants/dedication";

export type ShareResult = "shared" | "copied" | "dismissed" | "failed";

/** نص النسخ الاحتياطي عند غياب Web Share: النص + رابط الصفحة الحالية. */
export function buildCopyPayload(text: string, url?: string): string {
  return url ? `${text}\n\n${url}` : text;
}

/**
 * يحاول المشاركة عبر Web Share API، وإن لم يتوفّر ينسخ النص إلى الحافظة.
 * النص يصل جاهزًا من المستدعي (بما فيه كتلة الوقف) — لا نضيفها هنا مرة ثانية.
 */
export async function shareText(text: string): Promise<ShareResult> {
  const pageUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}${window.location.pathname}`;
  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.share) {
    try {
      await nav.share({
        text,
        title: PROJECT_NAME,
        ...(pageUrl ? { url: pageUrl } : {}),
      });
      return "shared";
    } catch (err) {
      // المستخدم أغلق لوحة المشاركة — ليس خطأ
      if (err instanceof DOMException && err.name === "AbortError") return "dismissed";
    }
  }

  return copyText(buildCopyPayload(text, pageUrl));
}

/** ينسخ نصًا إلى الحافظة مع تراجع آمن عبر textarea إن لم يعمل Clipboard API. */
export async function copyText(text: string): Promise<ShareResult> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return "copied";
    }
  } catch {
    /* نتابع إلى الطريقة البديلة */
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok ? "copied" : "failed";
  } catch {
    return "failed";
  }
}

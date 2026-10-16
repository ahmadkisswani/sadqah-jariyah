import { PROJECT_NAME, DEDICATION_BLOCK } from "../constants/dedication";

export type ShareResult = "shared" | "copied" | "dismissed" | "failed";

/**
 * يحاول المشاركة عبر Web Share API، وإن لم يتوفّر ينسخ النص إلى الحافظة.
 * يعيد الحالة لتعرضها في Snackbar.
 */
export async function shareText(text: string): Promise<ShareResult> {
  const payload = `${text}\n\n${DEDICATION_BLOCK}`;
  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.share) {
    try {
      await nav.share({ text: payload, title: PROJECT_NAME });
      return "shared";
    } catch (err) {
      // المستخدم أغلق لوحة المشاركة — ليس خطأ
      if (err instanceof DOMException && err.name === "AbortError") return "dismissed";
    }
  }

  return copyText(payload);
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

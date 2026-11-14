import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
// النطاق العربي فقط: الإنجليزية والأرقام اللاتينية تستخدم خط النظام،
// فلا نُحمّل مجموعات latin/math غير المستخدمة ولا نضخّم مخزون العمل دون اتصال.
import "@fontsource/amiri/arabic-400.css";
import "@fontsource/noto-naskh-arabic/arabic-400.css";
import "@fontsource/noto-naskh-arabic/arabic-600.css";
import "@fontsource/noto-naskh-arabic/arabic-700.css";
import "@fontsource/noto-sans-arabic/arabic-400.css";
import "@fontsource/noto-sans-arabic/arabic-500.css";
import "@fontsource/noto-sans-arabic/arabic-700.css";
import "./index.css";
import App from "./App";

/**
 * إذا فشل تحميل حزمة صفحة بعد نشر إصدار جديد (chunk قديم لم يعد موجودًا)
 * نعيد التحميل مرة واحدة بدل ترك شاشة خطأ دائمة.
 */
window.addEventListener("vite:preloadError", () => {
  const key = "sj-chunk-reload-at";
  try {
    const last = Number(window.sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 15_000) return;
    window.sessionStorage.setItem(key, String(Date.now()));
  } catch {
    /* التخزين غير متاح */
  }
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/**
 * تسجيل عامل الخدمة بعد اكتمال تحميل الصفحة وفي وقت خامل، حتى لا ينافس
 * تحميل الخطوط وأول رسم على الشبكة والمعالج. يبقى التثبيت الكامل متاحًا.
 */
type IdleCapableWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

function scheduleServiceWorker() {
  const register = () => registerSW({ immediate: true });
  const idleWindow = window as IdleCapableWindow;
  if (typeof idleWindow.requestIdleCallback === "function") {
    idleWindow.requestIdleCallback(register, { timeout: 3000 });
  } else {
    window.setTimeout(register, 1200);
  }
}

if (document.readyState === "complete") {
  scheduleServiceWorker();
} else {
  window.addEventListener("load", scheduleServiceWorker, { once: true });
}

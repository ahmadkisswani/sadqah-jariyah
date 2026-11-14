import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/** مصدر واحد للعنوان المطلق، مطابق للقيمة الاحتياطية في src/config/site.ts. */
const siteUrl = (process.env.VITE_SITE_URL || "https://sadqah-jariyah.ahmadkisswanisite.workers.dev").replace(
  /\/+$/,
  "",
);

/** يستبدل %SITE_URL% في index.html وقت البناء والتطوير. */
const siteUrlPlugin = {
  name: "site-url-plugin",
  transformIndexHtml(html: string) {
    return html.replaceAll("%SITE_URL%", siteUrl);
  },
};

export default defineConfig({
  plugins: [
    siteUrlPlugin,
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        id: "/",
        lang: "ar",
        dir: "rtl",
        name: "صدقة جارية",
        short_name: "صدقة جارية",
        description:
          "موقع إسلامي لقراءة القرآن الكريم والأذكار والأدعية والتسبيح والرقية الشرعية، صدقة جارية عن توبة عبد العزيز الجربوعه ومحمد احمد مسلم.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        background_color: "#FBF8F1",
        theme_color: "#1F5D4C",
        categories: ["lifestyle", "education"],
        shortcuts: [
          { name: "القرآن الكريم", short_name: "القرآن", url: "/quran" },
          { name: "الأذكار", short_name: "الأذكار", url: "/azkar" },
          { name: "مواقيت الصلاة", short_name: "المواقيت", url: "/prayer-times" },
        ],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // أيقونات المانيفست تُضاف تلقائيًا إلى precache؛ نستبعدها من glob فقط
        // لمنع التكرار (كان يظهر كل ملف أيقونة مرتين).
        globIgnores: ["**/icons/icon-192.png", "**/icons/icon-512.png"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        // ملاحظة مهمّة: لا نُمرّر ملفات الصوت (mp3) عبر عامل الخدمة.
        //
        // مشغّلات الوسائط — خصوصًا iOS Safari — تطلب الصوت بطلبات نطاق
        // (Range: bytes=…)، والاستجابة المخزّنة من نوع opaque لا يمكن تقطيعها،
        // فيفشل التشغيل على iPhone. ترك الطلب يمرّ للشبكة مباشرة يبقيه يعمل.
        runtimeCaching: [],
      },
    }),
  ],
  build: {
    target: "es2018",
    chunkSizeWarningLimit: 1200,
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        lang: "ar",
        dir: "rtl",
        name: "صدقة جارية",
        short_name: "صدقة جارية",
        description:
          "موقع إسلامي لقراءة القرآن الكريم والأذكار والأدعية والتسبيح والرقية الشرعية، صدقة جارية عن توبة عبد العزيز الجربوعه ومحمد احمد مسلم.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#FBF8F1",
        theme_color: "#1F5D4C",
        categories: ["lifestyle", "education"],
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
        navigateFallback: "/index.html",
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

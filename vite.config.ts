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
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.islamic\.network\/quran\/audio\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "quran-audio-cache",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: "es2018",
    chunkSizeWarningLimit: 1200,
  },
});

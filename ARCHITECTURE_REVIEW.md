# Architecture Review

## Current Architecture (retained)
- **Frontend:** React 18 SPA, Vite 6, TypeScript, MUI 6, React Router 6, lazy route chunks, local JSON/Quran text data, and browser storage for preferences/bookmarks.
- **PWA:** `vite-plugin-pwa` (generateSW), manifest, service worker precache for app shell/assets, runtime audio left uncached to avoid Range/opaque issues.
- **Data sources:** local static religious content, AlAdhan API for timings/calendar/Hijri conversion, IP/geolocation helpers for prayer location, CDN-hosted Quran audio.
- **Deployment target:** Cloudflare-compatible static assets (now with Worker wrapper for headers/routing behavior).

## Strengths
- Clear separation between UI components, hooks (`src/hooks/*`), data adapters (`src/data/*`), and utilities.
- Offline-friendly content model: Quran text, azkar, duas, ruqyah, and daily wird are local.
- Prayer logic is isolated and testable (`src/utils/prayer.ts`, `scripts/prayer-logic-test.mjs`).
- No backend/auth/analytics dependency, aligning with privacy goals.

## Architectural Improvements Made
| Area | Change | Rationale |
|---|---|---|
| SEO boundary | `src/config/site.ts`, `seo.ts`, `seo-routes.json`, `src/hooks/usePageMeta.ts`, `scripts/generate-seo.mjs` | Single source of truth for titles/descriptions/canonicals/breadcrumbs/indexability; runtime SPA updates + build-time crawler-visible shells. |
| App resilience | `src/components/AppErrorBoundary.tsx`, `src/components/OfflineBanner.tsx`, chunk-reload handler in `src/main.tsx` | Prevent blank-screen failures and make offline/update transitions understandable. |
| Performance isolation | `useNearViewport` + prayer lazy sections, `HomeBelowFold` lazy chunk, deferred SW registration, Arabic-subset fonts | Reduce first-load work/network and keep LCP content lightweight. |
| Deployment/edge | `wrangler.jsonc`, `worker/index.js`, `public/_headers`, generated `404.html` | Explicit Cloudflare asset handling, security/cache headers, and clean SPA fallback behavior without SSR. |
| Verification | `scripts/verify-build.mjs`, content/events/share tests | Build output and critical behavior are machine-checked. |

## Trade-offs / Decisions
- **No SSR/framework migration:** chosen to preserve stability and avoid broad regressions; static route shells cover primary SEO/share needs for known routes.
- **Approximate IP location retained:** useful fallback but sensitive; disclosed in privacy copy and paired with manual selection. Full opt-in redesign deferred.
- **Service worker precache size:** improved but still substantial (**~2.95 MB, 153 entries**) because offline Quran/page chunks/assets are precached. Acceptable for offline utility, but monitor install cost.
- **Duplicate worker/header config:** `worker/index.js` and `public/_headers` both encode policy for Cloudflare Workers and Pages compatibility; keep synchronized.

## Recommended Next Architecture Steps
1. **Dependency maintenance:** evaluate `react-router-dom` upgrade path in a separate change with route/smoke regression checks.
2. **Cache strategy split:** consider runtime caching strategies for rarely visited surah chunks vs eager precache to balance offline depth and install size.
3. **Prayer API resilience:** add request budgeting/aggregation if calendar/event requirements grow; current nearest-month optimization is a good baseline.
4. **Observability-free diagnostics:** keep optional local debug/export tools only; do not add analytics/trackers.
5. **Content pipeline:** formalize a reviewed source metadata file for azkar/duas/ruqyah (reference, grade/source attribution) even if UI remains simple.

# Performance Audit

## Measured Results (Lighthouse, headless preview)

| Page / mode | Baseline | Final | Key metrics (final) |
|---|---:|---:|---|
| Home mobile | Perf **47**, A11y 94, BP 100, SEO 92 | Perf **82**, A11y 100, BP 100, SEO 100 | FCP 2.2s, LCP 3.6s, TBT 290ms, CLS 0.005, SI 2.2s |
| Home desktop | Perf **97**, A11y 94, BP 100, SEO 92 | Perf **99**, A11y 100, BP 100, SEO 100 | FCP 0.5s, LCP 0.9s, TBT 50ms, CLS 0.015, SI 0.5s |
| Quran mobile | Perf **49**, A11y 98, BP 100, SEO 92 | Perf **87**, A11y 100, BP 100, SEO 100 | FCP 0.9s, LCP 3.6s, TBT 200ms, CLS 0.003, SI 1.3s |

**Performance score:** **84/100** (major improvement; mobile LCP/TBT still have headroom).

## Implemented Optimizations

| Severity | Evidence | Impact | Solution | Complexity |
|---|---|---|---|---|
| Critical | Home loaded below-fold content/icons/prayer strip in initial path; baseline mobile TBT 1310ms, LCP 6.0s. | Slow interaction and delayed hero/content paint on mobile. | Split `HomePage` into critical hero + lazy `HomeBelowFold`, deferred SW registration to idle, kept `vite:preloadError` recovery. | Medium |
| High | Prayer page fetched month calendar and events immediately; events fetched all Hijri months and sequential next-year retries. | Extra API requests and main-thread/network contention. | Added `useNearViewport` lazy loading for calendar/events and optimized `fetchUpcomingEvents` to select nearest months from current Hijri date (tested by `scripts/events-test.mjs`). | Medium |
| High | Large font payload/precache (baseline 185 entries / 3.25 MB) including non-Arabic subsets. | Install/download cost and slower first load on constrained devices. | Switched to Arabic-only font subsets and removed duplicate icon precache entries. Final: **153 entries / 2947 KiB** (`npm run build`). | Low |
| High | Footer/content loading caused layout jumps (Quran mobile CLS 0.299 baseline). | Poor perceived stability. | Reserved main height in `AppLayout`, added skeletons/empty states, and lazy-mounted deferred sections. | Low |
| Medium | Theme/bootstrap used inline executable script (CSP-hostile) and early SW registration. | Startup and security trade-offs. | Moved theme init to `/theme-init.js`, kept metadata static for crawlers, and registered SW after load/idle. | Low |

## Validation
- `npm run build` succeeds with route-aware static SEO generation.
- `npm run verify` passes artifact/precache checks.
- `node scripts/smoke-test.mjs --fast` passes **35/35**, including lazy calendar loading behavior and Quran interaction/audio flows.
- `npx tsc --noEmit` and `npm test` pass.

## Remaining Performance Opportunities
| Priority | Opportunity | Expected benefit | Complexity / risk |
|---|---|---|---|
| High | Reduce main JS execution further (code-split MUI-heavy surfaces, audit unused exports/icons, consider manual chunks). | Lower mobile TBT/LCP. | Medium |
| Medium | Tune font loading strategy (preload only critical faces, ensure `font-display` behavior via CSS where possible) to reduce text shift risk. | Better LCP/CLS stability. | Low-Medium |
| Medium | Precache strategy refinement: keep app shell + essential Quran, runtime-cache less-visited surah chunks/assets. | Smaller install/update cost. | Medium |
| Low | Use route-level prefetch hints only on intent (hover/focus) for likely next pages. | Faster navigation without startup cost. | Low |
| Residual | Mobile LCP 3.6s under Lighthouse throttling is acceptable but not excellent; real-world varies by device/network. | — | — |

# Feature Roadmap

## Prioritization Criteria
Features are ranked by **User value**, **Complexity**, **Performance impact**, **Maintenance cost**, and **Reliability/privacy risk**. Implemented items were chosen as high-value/low-risk within the existing architecture.

## Implemented (this pass)
| Feature | User value | Complexity | Performance impact | Maintenance | Reliability | Notes |
|---|---:|---:|---:|---:|---:|---|
| Route-aware SEO metadata + sitemap/robots/static shells | High | Medium | Neutral/positive (crawler/share correctness) | Low-Medium | High | Centralized config, runtime meta, 127 generated route shells. |
| Privacy page + source/privacy disclosures | High | Low | None | Low | High | `/privacy`, About/footer links, clear API/location/storage explanation. |
| Global error boundary + offline banner | High | Low | None | Low | High | Prevents blank failures; clarifies offline state. |
| Prayer performance lazy loading + events request optimization | High | Medium | Positive | Low | High | Near-viewport calendar/events, fewer Hijri month requests, tested. |
| Accessibility/UX hardening (headings, keyboard, focus, contrast tokens) | High | Medium | Neutral | Low | High | Home/prayer/Quran/controls improved; Lighthouse a11y 100. |
| PWA/build hygiene (deferred SW, font subsets, precache cleanup, verify script) | Medium-High | Low-Medium | Positive | Low | High | 175 entries / ~3.18 MB precache after Wave 1, no duplicate icon entries. |

## Phase 2 — Wave 1 (implemented)
| Feature | User value | Complexity | Performance impact | Maintenance | Reliability | Notes |
|---|---:|---:|---:|---:|---:|---|
| Nearby mosques (`/mosques`) | High | Medium | Positive (separate chunks, on-demand requests) | Medium | Medium | OSM/Overpass global-only endpoints, empty-response fallback, list-first, lazy Leaflet map, local cache, explicit search only. |
| Prayer context + local reminder | High | Medium | Low | Low-Medium | Medium | Explains calculated vs. masjid times; opt-in foreground notification via `setTimeout`; no push server. |
| Qibla (`/qibla`) | High | Low-Medium | None | Low | High | Local great-circle bearing; compass starts only on tap; no readings stored. |
| Hijri calendar (`/hijri-calendar`) | High | Low | None | Low | High | Local `Intl` Umm al-Qura conversion, ±2-day offset, converter, existing events only. |
| Privacy/About/CSP updates | High | Low | None | Low | High | OSM/Overpass/notifications disclosed; CSP limited to new hosts. |

**Post-Wave-1 fixes:** desktop nav condensed into six primary links + a `المزيد` menu; Qibla compass clipped and ornamentation made non-interactive; mosque map available before search and on zero results, with tile-failure fallback; mosque search switched to global-only Overpass endpoints, skips successful-but-empty responses (the previous regional mirror caused false “0 results”), and now runs through a same-origin Cloudflare Worker relay (`/api/mosques`) with a Photon fallback and edge caching, because public Overpass servers are blocked or throttled on some networks.

## Phase 2 — Wave 2 (planned, requires verified input)| Rank | Feature | User value | Complexity | Performance impact | Maintenance | Reliability | Rationale |
|---:|---|---:|---:|---:|---:|---:|---|
| 1 | Verified references/grades for existing religious content | Very High | Medium-High | Neutral | Medium | High | Trust and reviewability; must not be auto-generated. |
| 2 | Ramadan mode expansion | High | Medium | Low | Medium | Medium | Existing countdown works; full mode needs UX decisions and content review. |
| 3 | Zakat calculator | High | Medium-High | Low | Medium | High (if reviewed) | Needs scholarly review, nisab source, and clear non-fatwa disclaimer. |
| 4 | Quran Khatmah/progress (local-only) | Medium-High | Medium | Low | Low | High | Pairs naturally with Ramadan mode; no account needed. |
| 5 | Unified local search | Medium | Medium | Low | Medium | High | Requires a small local index and cross-section result design. |
| 6 | Knowledge center | High | High | Neutral | High | Medium | Content-heavy; deferred until sourcing/review workflow exists. |
| 7 | Personalized home (local preferences only) | Medium | Low-Medium | Neutral | Low | High | No behavioral tracking; explicit preferences only. |

## Recommended Next (priority order)

| Rank | Feature | User value | Complexity | Performance impact | Maintenance | Reliability | Rationale |
|---:|---|---:|---:|---:|---:|---:|---|
| 1 | React Router security/maintenance upgrade (isolated) | Medium | Medium | Neutral/positive | Medium | High if tested | Clears residual audit findings; requires regression validation. |
| 2 | Explicit, user-controlled location mode (manual default, opt-in precise GPS, opt-in IP fallback) | High | Medium | Neutral | Medium | High | Best privacy/trust improvement for prayer times. |
| 3 | Verified references/grades metadata for azkar, duas, and ruqyah items | Very High | Medium-High | Neutral | Medium | High (content trust) | Increases religious credibility; must be reviewed, not auto-generated. |
| 4 | Smarter offline cache management (essential shell + on-demand surah/audio ranges strategy) | High | Medium | Positive | Medium | Medium | Reduces install size while preserving core offline use. |
| 5 | Share/copy UX polish (choose copy text/link/both, consistent toasts) | Medium | Low | None | Low | High | Small usability gain; easy to test. |
| 6 | Reading progress/streaks for Quran/azkar (local-only) | Medium | Low-Medium | None | Low | High | Engagement boost without privacy cost. |
| 7 | Search improvements (Quran/azkar/duas unified local search with highlights) | Medium | Medium | Low | Medium | High | Useful as content grows; keep local/indexed. |
| 8 | Multi-language UI toggle beyond bilingual labels (if needed) | Medium | Medium-High | Low | Medium-High | Medium | Only after validated translation/content review. |
| 9 | Download manager for selected reciters/surahs (explicit user action) | Medium | Medium | Mixed | Medium | Medium | Helpful offline audio, but storage/UX complexity. |

## Explicitly Deprioritized (for now)
- **SSR/framework rewrite / backend/auth/analytics/ads:** high complexity and maintenance/privacy cost, not necessary for current goals.
- **Auto-collected personalization or tracking:** conflicts with privacy-friendly positioning.
- **Unverified religious content generation:** unacceptable reliability/trust risk. All content changes must remain source-reviewed.

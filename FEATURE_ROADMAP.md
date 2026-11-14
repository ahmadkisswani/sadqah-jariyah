# Feature Roadmap

## Prioritization Criteria
Features are ranked by **User value**, **Complexity**, **Performance impact**, **Maintenance cost**, and **Reliability/privacy risk**. Implemented items were chosen as high-value/low-risk within the existing architecture.

## Implemented (this pass)
| Feature | User value | Complexity | Performance impact | Maintenance | Reliability | Notes |
|---|---:|---:|---:|---:|---:|---|
| Route-aware SEO metadata + sitemap/robots/static shells | High | Medium | Neutral/positive (crawler/share correctness) | Low-Medium | High | Centralized config, runtime meta, 124 generated route shells. |
| Privacy page + source/privacy disclosures | High | Low | None | Low | High | `/privacy`, About/footer links, clear API/location/storage explanation. |
| Global error boundary + offline banner | High | Low | None | Low | High | Prevents blank failures; clarifies offline state. |
| Prayer performance lazy loading + events request optimization | High | Medium | Positive | Low | High | Near-viewport calendar/events, fewer Hijri month requests, tested. |
| Accessibility/UX hardening (headings, keyboard, focus, contrast tokens) | High | Medium | Neutral | Low | High | Home/prayer/Quran/controls improved; Lighthouse a11y 100. |
| PWA/build hygiene (deferred SW, font subsets, precache cleanup, verify script) | Medium-High | Low-Medium | Positive | Low | High | 153 entries / ~2.95 MB precache, no duplicate icon entries. |

## Recommended Next (priority order)

| Rank | Feature | User value | Complexity | Performance impact | Maintenance | Reliability | Rationale |
|---:|---|---:|---:|---:|---:|---:|---|
| 1 | React Router security/maintenance upgrade (isolated) | Medium | Medium | Neutral/positive | Medium | High if tested | Clears residual audit findings; requires regression validation. |
| 2 | Explicit, user-controlled location mode (manual default, opt-in precise GPS, opt-in IP fallback) | High | Medium | Neutral | Medium | High | Best privacy/trust improvement for prayer times. |
| 3 | Verified references/grades metadata for azkar, duas, and ruqyah items | Very High | Medium-High | Neutral | Medium | High (content trust) | Increases religious credibility; must be reviewed, not auto-generated. |
| 4 | Smarter offline cache management (essential shell + on-demand surah/audio ranges strategy) | High | Medium | Positive | Medium | Medium | Reduces install size while preserving core offline use. |
| 5 | Share/copy UX polish (choose copy text/link/both, consistent toasts) | Medium | Low | None | Low | High | Small usability gain; easy to test. |
| 6 | Prayer notification/reminder opt-in (local, permission-based) | Medium-High | Medium | Low | Medium | Medium | Valuable but needs careful permission UX and platform testing. |
| 7 | Reading progress/streaks for Quran/azkar (local-only) | Medium | Low-Medium | None | Low | High | Engagement boost without privacy cost. |
| 8 | Search improvements (Quran/azkar/duas unified local search with highlights) | Medium | Medium | Low | Medium | High | Useful as content grows; keep local/indexed. |
| 9 | Multi-language UI toggle beyond bilingual labels (if needed) | Medium | Medium-High | Low | Medium-High | Medium | Only after validated translation/content review. |
| 10 | Download manager for selected reciters/surahs (explicit user action) | Medium | Medium | Mixed | Medium | Medium | Helpful offline audio, but storage/UX complexity. |

## Explicitly Deprioritized (for now)
- **SSR/framework rewrite / backend/auth/analytics/ads:** high complexity and maintenance/privacy cost, not necessary for current goals.
- **Auto-collected personalization or tracking:** conflicts with privacy-friendly positioning.
- **Unverified religious content generation:** unacceptable reliability/trust risk. All content changes must remain source-reviewed.

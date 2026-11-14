# UI/UX Audit

## Scores
- **Before (evidence):** baseline Lighthouse accessibility 94 (home) / 98 (quran), visual issues observed (footer CLS, weak hierarchy/contrast risks, missing feedback states).
- **After (measured):** Lighthouse **Accessibility 100** on home mobile, home desktop, and Quran mobile; **CLS 0.005 / 0.015 / 0.003**.
- **UI/UX score:** **89/100** (strong clarity and responsiveness; some trust/content affordances can still improve).

## Key Improvements

| Severity | Evidence | Impact | Solution | Status / Complexity |
|---|---|---|---|---|
| High | `src/components/AppLayout.tsx` main area grew after async content; baseline mobile CLS 0.039 (home) / 0.299 (quran). | Jarring layout shifts, especially on Quran/prayer flows. | Reserved main content height (`minHeight` using header offset), added loading skeletons/fallbacks, lazy-mounted below-fold home/prayer sections. | Done, Medium |
| High | Home/prayer/Quran headings inconsistent (`SectionHeader`, prayer cards, page h1s). | Screen-reader/navigation confusion and weaker visual hierarchy. | Standardized page-level h1s, promoted key prayer section cards to h2, fixed About/header/footer heading semantics. | Done, Low |
| Medium | `src/components/TasbeehCounter.tsx` global key handler; Azkar/Duas category controls used tab semantics without tabpanels. | Unexpected actions and misleading accessibility semantics. | Guarded Space/Enter handling; converted category selectors to grouped toggle buttons with `aria-pressed`. | Done, Low |
| Medium | Mushaf ayah selection was click-only spans (`src/components/MushafPage.tsx`); Ruqyah iframe lacked title/permissions context. | Keyboard users and embedded-media clarity affected. | Added keyboard-operable ayah selection and iframe `title`, `allow`, `sandbox`, `referrerPolicy`. | Done, Low |
| Medium | Missing route feedback: no offline banner, no global error boundary, invalid Quran route handling was thin. | Users could get stuck or confused. | Added `OfflineBanner`, `AppErrorBoundary`, Quran invalid-surah error state, and clearer empty/loading states. | Done, Medium |
| Medium | Footer/brand gold/green text in dark mode could underperform contrast in places. | Readability/trust risk, especially at night. | Added accessible `accentText`/`primaryText` tokens, fixed key chips/icons/header/footer colors, and strengthened focus outlines/reduced-motion handling. | Done, Medium |

## UX Strengths Preserved
- Arabic-first RTL layout, calm visual language, large touch targets, bottom navigation, and dedicated pages for core worship flows.
- Prayer page keeps practical context: next prayer countdown, location/settings, month calendar, and clear service unavailability handling.
- Quran supports reading modes, audio controls, bookmarks, and last-read continuation.

## Remaining UX Opportunities
| Priority | Recommendation | User value | Complexity |
|---|---|---|---|
| Medium | Add explicit "source/reference" display affordance per dhikr/dua/ruqyah item (if verified data available). | Trust and scholarly clarity. | Low-Medium |
| Medium | Refine copy consistency between share and copy actions (copy may omit URL depending component) with a clear user-facing choice. | Predictable sharing behavior. | Low |
| Low | Provide an in-app cache/storage manager (clear prayer cache/downloaded assets info) with careful wording. | User control/offline confidence. | Medium |
| Low | Add lightweight onboarding hint for enabling precise location only when needed. | Better privacy understanding. | Low |

# Accessibility Audit

## Scores
- **Baseline:** Lighthouse Accessibility **94** (home mobile), **98** (Quran mobile), with known issues (heading order, contrast, non-semantic controls, focus/keyboard gaps).
- **After (measured):** Lighthouse Accessibility **100** (home mobile, home desktop, Quran mobile).
- **Accessibility score:** **96/100** (automated checks strong; manual screen-reader/AT verification still recommended).

## Fixes Implemented

| Severity | Evidence | Impact | Solution | Complexity |
|---|---|---|---|---|
| Critical | `src/components/TasbeehCounter.tsx` global `Space/Enter` handler incremented counter even when focus was on other controls. | Keyboard and assistive-technology users could trigger unintended state changes. | Added guards for editable/interactive elements, dialogs, modifier keys, and repeated keydown events. | Low |
| High | Quran Mushaf selection (`src/components/MushafPage.tsx`) used clickable spans only. | Ayah selection not keyboard-operable. | Added `role="button"`, `tabIndex`, `aria-label`, `aria-pressed`, and Enter/Space handling (covered by smoke test). | Low |
| High | Category selectors in Azkar/Duas behaved like tabs (`role="tablist"/"tab"`) without tabpanels. | Incorrect semantics for screen readers. | Replaced with grouped toggle buttons (`aria-pressed`, `aria-label="فئات ..."`). | Low |
| High | Dark-mode contrast issues (e.g. primary/gold text/icons on dark surfaces) and inconsistent decorative icon labeling. | Reduced readability and noisy announcements. | Introduced `primaryText`/`accentText` theme tokens, updated key components/icons/chips, marked decorative icons `aria-hidden` where appropriate. | Medium |
| Medium | Heading hierarchy issues (page/section/card levels, footer/header brand elements). | Difficult navigation by headings. | Standardized h1 per page, promoted prayer/calendar/events/settings to h2, fixed footer/header/About text components. | Low |
| Medium | Route changes lacked focus management/announcement; skip link and offline state were limited. | Disorientation for keyboard/screen-reader users. | Added main-content focus on navigation, polite route announcement, preserved skip link, and added `OfflineBanner` (`role="status"`). | Low |
| Medium | Missing/weak embedded media labels and loading/error clarity. | Ambiguous controls and states. | Added Ruqyah iframe `title` and safer attributes, skeleton/error/empty states (Quran invalid surah, calendar/messages). | Low |

## Additional Accessibility Measures
- `prefers-reduced-motion` handling and visible `:focus-visible` outlines in theme/global CSS.
- Semantic landmarks/labels retained or added (`main`, nav labels, `aria-labelledby` sections).
- Mobile/desktop responsive controls kept >= touch-friendly sizes in key flows.
- Smoke test includes keyboard selection check for Mushaf ayah.

## Remaining Recommendations
| Priority | Item | Rationale | Complexity |
|---|---|---|---|
| Medium | Manual audit with NVDA/VoiceOver/TalkBack on core flows (Quran audio, prayer dialog/calendar, tasbeeh). | Automated Lighthouse cannot catch all SR UX issues. | Low |
| Medium | Review copy/share control naming consistency ("نسخ"/"مشاركة" with/without URL) for clarity. | Predictable assistive labels/outcomes. | Low |
| Low | Consider live-region announcements for prayer countdown milestones (optional, non-intrusive). | Time-sensitive context for SR users. | Medium |
| Low | Validate color contrast against all component states in both themes (hover/selected/disabled/custom chips). | Prevent regressions beyond audited paths. | Low |

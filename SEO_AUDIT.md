# SEO Audit

## Scores
- **Baseline:** Lighthouse SEO **92** (home mobile), canonical pointed to `https://sadqah-jariyah.pages.dev/`, no `robots.txt`/`sitemap.xml`, generic SPA metadata.
- **After (measured):** Lighthouse SEO **100** (home mobile, home desktop, Quran mobile). `npm run verify` confirms canonical domain, 124-URL sitemap, route shells, and noindex handling.
- **SEO score:** **93/100** (strong technical foundation for an SPA; rich results/content authority remain limited).

## Implemented Fixes

| Severity | Evidence | Impact | Solution | Complexity |
|---|---|---|---|---|
| Critical | `index.html` canonical/OG/Twitter used old `pages.dev` domain; runtime title handling was fragmented. | Split indexing signals, wrong previews, duplicate/canonical confusion. | Centralized site URL/route metadata (`src/config/site.ts`, `src/config/seo.ts`, `src/config/seo-routes.json`), runtime `usePageMeta`, canonical/OG/Twitter aligned to `https://sadqah-jariyah.ahmadkisswanisite.workers.dev`. | Medium |
| Critical | `dist/` had no `robots.txt`, `sitemap.xml`, or per-route HTML shells. | Crawlers could miss or misinterpret deep routes; SPA-only metadata delayed. | Added `scripts/generate-seo.mjs` postbuild: `robots.txt`, `sitemap.xml` (124 URLs: 10 static + 114 surahs), per-route `.html` shells, and `404.html`. | Medium |
| High | No structured data / weak share image metadata. | Reduced eligibility for rich understanding and poorer social cards. | Added WebSite/WebPage/Breadcrumb JSON-LD (static shells + runtime), absolute social image, OG/Twitter image alt/size metadata. | Low |
| High | Indexable/error-state policy unclear (`/bookmarks`, unknown routes). | Risk of thin/private pages being indexed. | `/bookmarks` set `noindex,follow` and excluded from sitemap/robots allow path strategy (`Disallow: /bookmarks` in robots); unknown routes resolve to noindex metadata and 404 shell. | Low |
| Medium | Surah routes lacked unique metadata intent. | Missed long-tail Quran search relevance. | Generated unique title/description/canonical/breadcrumb per surah (`سورة {name} — القرآن الكريم | صدقة جارية`). | Low |

## Technical SEO Artifacts (verified)
- `dist/robots.txt`: allows crawl, points to sitemap.
- `dist/sitemap.xml`: **124 URLs**, includes `/`, major sections, and `/quran/1..114`; excludes bookmarks/404.
- `dist/*.html` shells: home, static routes, 114 surah pages, and `404.html` with route-specific meta/canonical/JSON-LD.
- `wrangler.jsonc`: `html_handling: drop-trailing-slash`, `not_found_handling: 404-page`.

## Remaining Recommendations
| Priority | Item | Why it matters | Complexity |
|---|---|---|---|
| High | Submit sitemap in Search Console/Bing after deployment and verify canonical domain ownership. | Converts technical readiness into indexing. | Low |
| Medium | Add `<lastmod>` from content/build metadata per URL if update cadence becomes important. | Better crawl prioritization. | Low |
| Medium | Create a lightweight, indexable "sources/methodology" content section (verified references only). | E-E-A-T/trust for religious content. | Medium |
| Low | Consider dedicated social preview variants per section (Quran/prayer) if sharing becomes a focus. | Higher CTR on shared links. | Medium |
| Residual | SPA runtime metadata is still JS-updated; shells cover initial crawl/share but ensure critical links are plain `<a href>` (mostly true). | Crawl efficiency and robustness. | Low |

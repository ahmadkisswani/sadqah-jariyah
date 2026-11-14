# Security & Privacy Audit

## Scores
- **Baseline:** Lighthouse Best Practices **100**, but deployment/header posture, CSP, and privacy disclosure were limited.
- **After (measured):** Lighthouse Best Practices **100** (home mobile/desktop, Quran mobile). Security headers and stricter script policy added.
- **Security/Privacy score:** **86/100** (good for a static, no-auth app; residual dependency/CSP trade-offs remain).

## Findings & Mitigations

| Severity | Evidence | Impact | Solution | Complexity |
|---|---|---|---|---|
| High | No explicit privacy disclosure; approximate IP geolocation used for prayer fallback. | Users may not understand what data leaves the device. | Added `PrivacyPage` (`/privacy`), About-page privacy/source notes, and footer link. Documented local storage, prayer APIs, geolocation/IP fallback, and audio/embed behavior. | Low |
| High | Inline theme bootstrap script in `index.html` required unsafe-inline script CSP if locked down. | Harder to enforce strict CSP. | Moved bootstrap to external `/theme-init.js`; configured CSP `script-src 'self'` in `worker/index.js` and `public/_headers`. | Low |
| Medium | No app-level security headers/caching policy defined for Cloudflare deployment. | Missing defense-in-depth (MIME sniffing, framing, referrer leakage, permissions). | Added `worker/index.js` with CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy (geolocation=(self))`, COEP-adjacent safe defaults, HSTS, and cache policies; mirrored via `public/_headers`. | Medium |
| Medium | External Ruqyah iframe embedded without explicit restriction metadata. | Unclear isolation/referrer behavior. | Added iframe `title`, `loading="lazy"`, `referrerPolicy="strict-origin-when-cross-origin"`, `allow`, and `sandbox` allowlist. | Low |
| Medium | PWA/service worker and deployment config could cache stale/duplicate assets. | Update/confusion issues and unnecessary exposure surface. | Enabled Workbox cleanup, removed precache duplicates, deferred SW registration, added chunk-reload recovery, and explicit `404`/HTML handling in Wrangler config. | Low |
| Residual (Medium) | `npm audit --omit=dev`: 2 moderate issues in `react-router` chain; fix suggests major upgrade. | Known upstream vulnerabilities may remain. | Not applied automatically. Recommend isolated upgrade + regression test (`test`, `smoke`, `build`, route checks). | Medium |
| Residual (Low) | CSP allows `'unsafe-inline'` for styles (required by MUI/Emotion runtime style injection). | Limits style-injection hardening. | Accepted trade-off for current stack; revisit only with styling architecture changes. | High |
| Residual (Low) | Static route shells include `application/ld+json` inline data scripts. | Some scanners may flag; browsers typically do not execute JSON-LD as JS. | Kept for SEO; executable JS inlined removed. Validate in production scanner context if needed. | Low |

## Privacy Posture
- **No backend/auth/analytics/ads added.** Data remains on-device except required service calls.
- **Network calls:** AlAdhan (prayer/calendar/Hijri), geolocation/IP fallback services as configured, Quran audio CDN when played, and embedded Ruqyah media host when opened/played.
- **Location:** manual city/coordinates and optional precise geolocation flow; fallback behavior disclosed. No tracking identifier introduced.
- **Permissions policy:** camera/microphone/payment/usb disabled; geolocation limited to self.

## Recommendations
1. Upgrade React Router dependencies in a controlled follow-up and rerun full validation.
2. Periodically re-run `npm audit`, Lighthouse, and header checks in deployed environment.
3. Consider self-hosting or proxying third-party embeds/audio only if reliability/privacy requirements increase (trade-off: maintenance/cost).
4. Add a simple security.txt/deployment checklist in ops docs if the project moves beyond personal/demo hosting.

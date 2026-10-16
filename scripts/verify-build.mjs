// @ts-nocheck
import { readFileSync, existsSync } from "node:fs";

const h = readFileSync("dist/index.html", "utf8");
const title = /<title>(.*?)<\/title>/s.exec(h)?.[1];
console.log("title:      ", title);
console.log("lang=ar:    ", /<html[^>]*lang="ar"/.test(h));
console.log("dir=rtl:    ", /<html[^>]*dir="rtl"/.test(h));
console.log("og:title:   ", h.includes("og:title"));
console.log("og:image:   ", h.includes("og:image"));
console.log("twitter:    ", h.includes("twitter:card"));
console.log("manifest:   ", h.includes("manifest"));
console.log("theme-color:", /name="theme-color"\s+content="([^"]+)"/.exec(h)?.[1]);

const files = [
  "dist/_redirects",
  "dist/sw.js",
  "dist/manifest.webmanifest",
  "dist/icons/icon-192.png",
  "dist/icons/icon-512.png",
  "dist/icons/social-preview.png",
  "dist/favicon.svg",
];
console.log("\n--- existing build artifacts ---");
for (const f of files) console.log(`${existsSync(f) ? "OK " : "MISS"} ${f}`);

console.log("\n--- sw.js sanity ---");
const sw = readFileSync("dist/sw.js", "utf8");
console.log("registrations/navigateFallback:", sw.includes("index.html") || sw.includes("precache"));

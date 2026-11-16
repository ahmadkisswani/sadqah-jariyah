import { build } from "esbuild";

const bundled = await build({
  entryPoints: ["src/data/mosques/api.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "neutral",
  target: "es2020",
  logLevel: "silent",
});
const code = bundled.outputFiles[0].text;
const mosques = await import(
  `data:text/javascript;base64,${Buffer.from(code, "utf8").toString("base64")}`
);

globalThis.window = {
  localStorage: {
    getItem: () => null,
    setItem: () => {},
  },
};

const AMMAN = { latitude: 31.9539, longitude: 35.9106 };
const started = Date.now();
try {
  const result = await mosques.searchMosques(AMMAN, 3, { force: true });
  console.log(`OK in ${Date.now() - started}ms — mosques=${result.mosques.length}`);
  for (const m of result.mosques.slice(0, 5)) {
    console.log(`  - ${m.name} (${m.nameEn}) ${m.distanceKm.toFixed(2)} km`);
  }
} catch (error) {
  console.log(`FAILED in ${Date.now() - started}ms — ${error.name}: ${error.message}`);
}

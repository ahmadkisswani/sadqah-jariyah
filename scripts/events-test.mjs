// @ts-nocheck
/**
 * اختبار اختيار المناسبات وعدد طلبات التقويم.
 * نستبدل وحدة api ببيانات هجرية حتمية ونراقب الطلبات، بلا شبكة.
 */
import { build } from "esbuild";

const EPOCH = Date.UTC(2025, 0, 1);
const DAY = 86_400_000;
const dateKeyFor = (hYear, hMonth, hDay) => {
  const index = (hYear - 1447) * 354 + (hMonth - 1) * 30 + (hDay - 1);
  return new Date(EPOCH + index * DAY).toISOString().slice(0, 10);
};

const stubApi = {
  name: "stub-prayer-api",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^\.\/api$/ }, () => ({ path: "stub-api", namespace: "stub" }));
    buildApi.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
      loader: "js",
      contents: `
        export async function fetchHijriMonth({ hijriYear, hijriMonth }) {
          globalThis.__EVENT_CALLS.push([hijriYear, hijriMonth]);
          const days = [];
          for (let day = 1; day <= 30; day += 1) {
            const index = (hijriYear - 1447) * 354 + (hijriMonth - 1) * 30 + (day - 1);
            const date = new Date(Date.UTC(2025, 0, 1) + index * 86400000);
            days.push({
              dateKey: date.toISOString().slice(0, 10),
              hDay: day,
              hMonth: hijriMonth,
              hYear: hijriYear,
              holidays: [],
            });
          }
          return days;
        }
        export function daysBetweenKeys(from, to) {
          return Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
        }
      `,
    }));
  },
};

const bundled = await build({
  entryPoints: ["src/data/prayer/events.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "neutral",
  target: "es2020",
  logLevel: "silent",
  plugins: [stubApi],
});

const mod = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text, "utf8").toString("base64")}`
);

const results = [];
const check = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: String(error?.message ?? error) });
    console.log(`FAIL  ${name} — ${error?.message ?? error}`);
  }
};
const eq = (actual, expected, label = "") => {
  if (actual !== expected) {
    throw new Error(`${label} المتوقّع: ${JSON.stringify(expected)} — الفعلي: ${JSON.stringify(actual)}`);
  }
};
const assert = (value, message) => {
  if (!value) throw new Error(message);
};

const run = async (options) => {
  globalThis.__EVENT_CALLS = [];
  const events = await mod.fetchUpcomingEvents(options);
  return { events, calls: globalThis.__EVENT_CALLS };
};

const base = {
  hijriYear: 1448,
  hijriMonth: 5,
  hijriDay: 1,
  latitude: 31.95,
  longitude: 35.91,
  todayKey: dateKeyFor(1448, 5, 1),
  limit: 4,
};

await check("السياق الهجري: طلبات أشهر قليلة فقط", async () => {
  const { calls } = await run(base);
  assert(calls.length <= 4, `عدد طلبات الأشهر كبير: ${calls.length}`);
  eq(new Set(calls.map(([year, month]) => `${year}:${month}`)).size, calls.length, "طلبات مكرّرة:");
});

await check("ترتيب المناسبات ومنع الماضي", async () => {
  const { events } = await run(base);
  eq(events.length, 4, "عدد المناسبات المعادة:");
  assert(events.every((event) => event.daysUntil >= 0), "ظهرت مناسبة ماضية");
  const sorted = [...events].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  eq(events.map((event) => event.key).join(","), sorted.map((event) => event.key).join(","), "الترتيب:");
  assert(events.some((event) => event.key === "ramadan"), "رمضان غير موجود في أقرب المناسبات");
});

await check("آخر السنة الهجرية: ينتقل إلى السنة التالية بلا تكرار", async () => {
  const { events, calls } = await run({
    ...base,
    hijriMonth: 11,
    hijriDay: 20,
    todayKey: dateKeyFor(1448, 11, 20),
  });
  assert(events.every((event) => event.daysUntil >= 0), "ظهرت مناسبة ماضية");
  assert(events.some((event) => event.hijriYear === 1449), "لم تُجلب مناسبة من السنة التالية");
  eq(new Set(calls.map(([year, month]) => `${year}:${month}`)).size, calls.length, "طلبات مكرّرة:");
});

await check("المسار الاحتياطي بلا سياق هجري يعمل", async () => {
  const { events } = await run({
    hijriYear: 1448,
    latitude: 31.95,
    longitude: 35.91,
    todayKey: dateKeyFor(1448, 5, 1),
    limit: 4,
  });
  eq(events.length, 4, "عدد المناسبات:");
  assert(events.every((event) => event.daysUntil >= 0), "ظهرت مناسبة ماضية في المسار الاحتياطي");
});

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} اختبارات مناسبات ناجحة`);
if (failed.length) process.exit(1);
console.log("اختيار المناسبات وتقليل الطلبات سليم ✔");

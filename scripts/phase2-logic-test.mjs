// @ts-nocheck
/**
 * اختبارات منطق الموجة الأولى من المرحلة الثانية (بلا متصفح):
 *  - حساب اتجاه القبلة والمسافة وتنعيم البوصلة.
 *  - تحويلات التقويم الهجري (أم القرى) وشبكة الشهر والإزاحة.
 *  - استعلام Overpass وتحويل نتائجه إلى مساجد مرتّبة.
 *
 * تُبنى ملفات TypeScript عبر esbuild ثم تُستورد كوحدات ESM، على غرار
 * اختبارات المواقيت الحالية.
 */

import { build } from "esbuild";

async function load(entry) {
  const bundled = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: "esm",
    platform: "neutral",
    target: "es2020",
    logLevel: "silent",
  });
  const code = bundled.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code, "utf8").toString("base64")}`);
}

const geo = await load("src/utils/geo.ts");
const hijri = await load("src/utils/hijri.ts");
const mosques = await load("src/data/mosques/api.ts");

const results = [];
const check = (name, fn) => {
  try {
    fn();
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
const near = (actual, expected, tolerance, label = "") => {
  if (!(Math.abs(actual - expected) <= tolerance)) {
    throw new Error(`${label} المتوقّع ≈ ${expected} ±${tolerance} — الفعلي: ${actual}`);
  }
};
const ok = (value, label = "") => {
  if (!value) throw new Error(label || "القيمة غير صحيحة");
};

const CAIRO = { latitude: 30.0444, longitude: 31.2357 };
const LONDON = { latitude: 51.5074, longitude: -0.1278 };
const NEW_YORK = { latitude: 40.7128, longitude: -74.006 };
const JAKARTA = { latitude: -6.2088, longitude: 106.8456 };
const AMMAN = { latitude: 31.9539, longitude: 35.9106 };

check("تطبيع الزوايا", () => {
  eq(geo.normalizeDegrees(370), 10);
  eq(geo.normalizeDegrees(-10), 350);
  eq(geo.normalizeDegrees(360), 0);
  eq(geo.normalizeDegrees(Number.NaN), 0);
});

check("المسافة الكبرى: مكة والمدينة", () => {
  const distance = geo.haversineDistanceKm(
    { latitude: 21.4225, longitude: 39.8262 },
    { latitude: 24.4672, longitude: 39.6111 },
  );
  near(distance, 339, 4, "مكة—المدينة");
  eq(geo.haversineDistanceKm(CAIRO, CAIRO), 0);
});

check("اتجاه القبلة: نقاط مرجعية", () => {
  near(geo.qiblaBearing({ latitude: 0, longitude: 39.826206 }), 0, 0.2, "جنوب الكعبة");
  near(geo.qiblaBearing({ latitude: 40, longitude: 39.826206 }), 180, 0.2, "شمال الكعبة");
  near(geo.qiblaBearing(CAIRO), 136.7, 2.5, "القاهرة");
  near(geo.qiblaBearing(LONDON), 119, 2, "لندن");
  near(geo.qiblaBearing(NEW_YORK), 58.5, 2, "نيويورك");
  near(geo.qiblaBearing(JAKARTA), 295.1, 2, "جاكرتا");
  near(geo.qiblaBearing(AMMAN), 159.5, 3, "عمّان");
});

check("تنعيم البوصلة يعبر الشمال بلا قفزة", () => {
  const smoothed = geo.smoothHeading(359, 1, 0.5);
  near(smoothed, 0, 0.01, "359 ← 1");
  eq(geo.smoothHeading(null, 725), 5);
});

check("استخراج اتجاه الجهاز", () => {
  eq(geo.headingFromOrientation({ webkitCompassHeading: 350 }), 350);
  eq(geo.headingFromOrientation({ absolute: true, alpha: 90 }), 270);
  eq(geo.headingFromOrientation({ absolute: false, alpha: 90 }), null);
  eq(geo.headingFromOrientation({ alpha: 90 }), null);
  eq(geo.headingFromOrientation({ absolute: true, webkitCompassHeading: 361 }), 1);
  eq(geo.adjustHeadingForScreen(350, 20), 10);
});

check("صياغة المسافة والاتجاه", () => {
  eq(geo.formatDistance(0.42, "ar"), "٤٢٠ م");
  eq(geo.formatDistance(2.24, "en"), "2.2 km");
  eq(geo.formatDistance(12.6, "en"), "13 km");
  eq(geo.compassDirection(0, "ar"), "شمال");
  eq(geo.compassDirection(315, "en"), "NW");
});

check("هجري: تحويل ذهاب وعودة", () => {
  const today = hijri.gregorianToHijri("2026-11-15");
  eq(today.year, 1448);
  eq(today.month, 6);
  eq(today.day, 5);
  eq(hijri.hijriToGregorian(today), "2026-11-15");
  for (const key of ["2020-01-01", "2023-03-23", "2025-06-26", "2027-02-08", "2030-12-31"]) {
    const converted = hijri.gregorianToHijri(key);
    eq(hijri.hijriToGregorian(converted), key, key);
  }
});

check("هجري: الإزاحة ±يومان", () => {
  eq(hijri.gregorianToHijri("2026-11-15", 1).day, 6);
  eq(hijri.gregorianToHijri("2026-11-15", -1).day, 4);
  eq(hijri.hijriToGregorian({ year: 1448, month: 6, day: 6 }, 1), "2026-11-15");
  eq(hijri.hijriToGregorian({ year: 1448, month: 6, day: 5 }, -1), "2026-11-16");
});

check("هجري: طول الشهر وشبكة الشهر", () => {
  eq(hijri.hijriMonthLength(1448, 6), 29);
  const grid = hijri.buildHijriMonthGrid(1448, 6, 0, "2026-11-15");
  eq(grid.length, 29);
  eq(grid.leadingBlanks, 3);
  eq(grid.startKey, "2026-11-11");
  eq(grid.endKey, "2026-12-09");
  eq(grid.cells[0].hijriDate.day, 1);
  eq(grid.cells[grid.cells.length - 1].hijriDate.day, 29);
  eq(grid.cells.filter((cell) => cell.isToday).length, 1);
  eq(grid.cells.find((cell) => cell.isToday).gregorianKey, "2026-11-15");
});

check("هجري: المناسبات وأسماء الأشهر", () => {
  const ramadan = hijri.buildHijriMonthGrid(1448, 9, 0, "2026-11-15");
  ok(ramadan.cells[0].events.some((event) => event.key === "ramadan"));
  ok(ramadan.cells[26].events.some((event) => event.key === "laylat-al-qadr"));
  eq(hijri.hijriMonthName(9, "ar"), "رَمَضان");
  eq(hijri.hijriMonthName(9, "en"), "Ramadan");
  ok(hijri.formatHijriDate({ year: 1448, month: 6, day: 5 }).includes("١٤٤٨"));
});

check("Overpass: استعلام آمن ومحدود", () => {
  const query = mosques.buildOverpassQuery(AMMAN, 3);
  ok(query.includes("around:3000,31.9539,35.9106"));
  ok(query.includes('["amenity"="place_of_worship"]'));
  ok(query.includes('["building"="mosque"]'));
  ok(query.includes("out center 80;"));
  const huge = mosques.buildOverpassQuery(AMMAN, 999);
  ok(huge.includes("around:15000,"), "سقف نصف القطر");
  const tiny = mosques.buildOverpassQuery(AMMAN, 0);
  ok(tiny.includes("around:500,"), "حد أدنى لنصف القطر");
});

check("Overpass: تحويل النتائج وترتيبها وتنقيتها", () => {
  const payload = {
    elements: [
      {
        type: "node",
        id: 1,
        lat: 31.96,
        lon: 35.92,
        tags: {
          amenity: "place_of_worship",
          religion: "muslim",
          "name:ar": "مسجد النور",
          phone: "+962 7 9000 0000",
          website: "https://example.org/mosque",
          "addr:street": "شارع الملك",
          "addr:city": "عمّان",
        },
      },
      {
        type: "way",
        id: 2,
        center: { lat: 31.97, lon: 35.93 },
        tags: { building: "mosque", name: "Mosque B", "addr:street": "Second Street" },
      },
      {
        type: "node",
        id: 3,
        lat: 31.96,
        lon: 35.92,
        tags: {
          amenity: "place_of_worship",
          religion: "muslim",
          "name:ar": "مسجد النور",
        },
      },
      {
        type: "node",
        id: 4,
        lat: 31.95,
        lon: 35.9,
        tags: { amenity: "place_of_worship", religion: "christian", name: "Church" },
      },
      { type: "node", id: 5, lat: 999, lon: 35.9, tags: { building: "mosque", name: "Invalid" } },
      {
        type: "node",
        id: 6,
        lat: null,
        lon: null,
        tags: { building: "mosque", name: "Null coordinates" },
      },
    ],
  };
  const list = mosques.parseOverpassPayload(payload, AMMAN);
  eq(list.length, 2, "عدد المساجد بعد إزالة التكرار");
  eq(list[0].name, "مسجد النور");
  eq(list[0].address, "شارع الملك، عمّان");
  eq(list[0].website, "https://example.org/mosque");
  ok(list[0].distanceKm <= list[1].distanceKm, "الترتيب بالمسافة");
  eq(list[1].kind, "mosque");
  eq(list[1].nameEn, "Mosque B");
  ok(mosques.directionsLink(AMMAN, list[0]).includes("openstreetmap.org/directions"));
  ok(mosques.osmMapLink(AMMAN).includes("#map=15/31.95390/35.91060"));
  eq(mosques.mosqueCacheKey(AMMAN, 3), "m:31.954:35.911:3");
});

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} اختبارات موجة أولى ناجحة`);
if (failed.length) {
  console.error("فشلت اختبارات الموجة الأولى ✘");
  process.exit(1);
}
console.log("منطق القبلة والهجري والمساجد سليم ✔");

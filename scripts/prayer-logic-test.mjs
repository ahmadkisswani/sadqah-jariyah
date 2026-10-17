// اختبار منطق المواقيت (بلا متصفح) — يبني src/utils/prayer.ts مباشرة عبر esbuild
// ثم يتحقّق من حالات يصعب توليدها في اختبار الواجهة: ما قبل الفجر، أثناء نافذة
// صلاة، بعد العشاء، عبور منتصف الليل، والتوقيت الصيفي، ونوافذ رمضان.
//
// الاستخدام:  node scripts/prayer-logic-test.mjs

import { build } from "esbuild";

const bundled = await build({
  entryPoints: ["src/utils/prayer.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "neutral",
  target: "es2020",
  logLevel: "silent",
});

const code = bundled.outputFiles[0].text;
const mod = await import(
  `data:text/javascript;base64,${Buffer.from(code, "utf8").toString("base64")}`
);

const {
  areCoordinatesValid,
  buildPrayerRows,
  daysBetweenKeys,
  findCurrentAndNext,
  formatClock,
  formatCountdown,
  formatCountdownShort,
  formatCountdownWords,
  formatHijri,
  ramadanWindows,
  relativeDays,
  shiftDateKey,
  todayKeyIn,
} = mod;

const results = [];
const check = (name, fn) => {
  try {
    fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error: String(error?.message ?? error) });
    console.log(`FAIL  ${name}  — ${error?.message ?? error}`);
  }
};

const eq = (actual, expected, label = "") => {
  if (actual !== expected) {
    throw new Error(`${label} المتوقّع: ${JSON.stringify(expected)} — الفعلي: ${JSON.stringify(actual)}`);
  }
};

/* --------------------------- أيام اختبارية --------------------------- */

const TIMES = {
  imsak: "04:35",
  fajr: "05:20",
  sunrise: "06:43",
  dhuhr: "12:19",
  asr: "15:37",
  sunset: "17:55",
  maghrib: "17:55",
  isha: "19:14",
  midnight: "00:37",
  lastthird: "03:42",
};

function makeDay(dateKey, offset, times = TIMES) {
  const iso = {};
  const clock = {};
  for (const [key, value] of Object.entries(times)) {
    iso[key] = `${dateKey}T${value}:00${offset}`;
    clock[key] = value;
  }
  return {
    dateKey,
    timezone: "Asia/Amman",
    iso,
    clock,
    hijri: { day: 1, month: 5, year: 1448, monthNameAr: "جُمادى الأولى", monthNameEn: "Jumada al-awwal", holidays: [] },
    gregorian: { day: 1, month: 10, year: 2026 },
    method: { id: 23, name: "Jordanian Ministry of Awqaf" },
    school: "STANDARD",
  };
}

const AMMAN = "+03:00";
const day16 = makeDay("2026-10-16", AMMAN);
const day17 = makeDay("2026-10-17", AMMAN);
const day18 = makeDay("2026-10-18", AMMAN);
const threeDays = [day16, day17, day18];

const at = (iso) => Date.parse(iso);

/* --------------------------- حالات الصلاة --------------------------- */

check("قبل الفجر: الصلاة الجارية عشاء الأمس والقادمة فجر اليوم", () => {
  const now = at("2026-10-17T04:00:00+03:00");
  const { current, next } = findCurrentAndNext(threeDays, now);
  eq(current.key, "isha", "الجارية:");
  eq(current.dateKey, "2026-10-16", "يوم الجارية:");
  eq(next.key, "fajr", "القادمة:");
  eq(next.dateKey, "2026-10-17", "يوم القادمة:");

  const rows = buildPrayerRows(day17, current, next, now);
  eq(rows.length, 5, "عدد الصفوف:");
  eq(rows.every((row) => row.state === "upcoming"), true, "كل الصلوات قادمة:");
  eq(rows.find((row) => row.key === "fajr").isNext, true, "الفجر هو التالي:");
  eq(rows.find((row) => row.key === "fajr").deltaMs, 80 * 60 * 1000, "متبقٍ للفجر:");
});

check("بين الظهر والعصر: الظهر جارية والعصر قادمة", () => {
  const now = at("2026-10-17T13:00:00+03:00");
  const { current, next } = findCurrentAndNext(threeDays, now);
  eq(current.key, "dhuhr", "الجارية:");
  eq(next.key, "asr", "القادمة:");

  const rows = buildPrayerRows(day17, current, next, now);
  const state = Object.fromEntries(rows.map((row) => [row.key, row.state]));
  eq(state.fajr, "completed", "الفجر:");
  eq(state.dhuhr, "current", "الظهر:");
  eq(state.asr, "upcoming", "العصر:");
  eq(rows.find((row) => row.key === "dhuhr").deltaMs, 41 * 60 * 1000, "مضى من الظهر:");
});

check("لحظة دخول الوقت تمامًا تُحتسب الصلاة جارية", () => {
  const now = at("2026-10-17T17:55:00+03:00");
  const { current, next } = findCurrentAndNext(threeDays, now);
  eq(current.key, "maghrib", "الجارية:");
  eq(next.key, "isha", "القادمة:");
  const rows = buildPrayerRows(day17, current, next, now);
  eq(rows.find((row) => row.key === "maghrib").state, "current", "حالة المغرب:");
  eq(rows.find((row) => row.key === "isha").isNext, true, "العشاء التالي:");
});

check("بعد العشاء: القادمة فجر الغد من الأيام المتاحة", () => {
  const now = at("2026-10-17T21:00:00+03:00");
  const { current, next } = findCurrentAndNext(threeDays, now);
  eq(current.key, "isha", "الجارية:");
  eq(next.key, "fajr", "القادمة:");
  eq(next.dateKey, "2026-10-18", "يوم القادمة:");
  const rows = buildPrayerRows(day17, current, next, now);
  const state = Object.fromEntries(rows.map((row) => [row.key, row.state]));
  eq(state.fajr, "completed", "الفجر:");
  eq(state.dhuhr, "completed", "الظهر:");
  eq(state.asr, "completed", "العصر:");
  eq(state.maghrib, "completed", "المغرب:");
  // نافذة العشاء هي الجارية حتى فجر الغد
  eq(state.isha, "current", "العشاء:");
});

check("عبور منتصف الليل: لا انقطاع في العدّ (عشاء أمس ← فجر اليوم)", () => {
  const beforeMidnight = at("2026-10-17T23:59:00+03:00");
  const afterMidnight = at("2026-10-18T00:01:00+03:00");
  const first = findCurrentAndNext(threeDays, beforeMidnight);
  const second = findCurrentAndNext(threeDays, afterMidnight);
  eq(first.current.key, "isha", "قبل منتصف الليل — الجارية:");
  eq(first.next.key, "fajr", "قبل منتصف الليل — القادمة:");
  eq(second.current.key, "isha", "بعد منتصف الليل — الجارية:");
  eq(second.current.dateKey, "2026-10-17", "بعد منتصف الليل — يوم الجارية:");
  eq(second.next.dateKey, "2026-10-18", "بعد منتصف الليل — يوم القادمة:");
  // العدّ يستمر بالنقصان بلا قفزة سالبة
  const before = first.next.at - beforeMidnight;
  const after = second.next.at - afterMidnight;
  eq(before - after, 2 * 60 * 1000, "فرق دقيقتين بين العدّين:");
});

check("يوم واحد فقط (بطاقة الرئيسية): بلا صلاة قادمة بعد العشاء", () => {
  const now = at("2026-10-17T21:00:00+03:00");
  const { current, next } = findCurrentAndNext([day17], now);
  eq(current.key, "isha", "الجارية:");
  eq(next, null, "القادمة:");
});

/* --------------------------- التوقيت الصيفي --------------------------- */

check("التوقيت الصيفي: الحساب بلحظات مطلقة لا بفروق ثابتة", () => {
  const before = makeDay("2026-03-28", "+00:00", { ...TIMES, fajr: "05:00", isha: "20:00" });
  const after = makeDay("2026-03-29", "+01:00", { ...TIMES, fajr: "05:00", isha: "20:00" });
  // فجر ٢٨ مارس ٠٥:٠٠ UTC ← فجر ٢٩ مارس ٠٤:٠٠ UTC (بسبب تقدّم الساعة ساعة)
  eq(at(after.iso.fajr) - at(before.iso.fajr), 23 * 60 * 60 * 1000, "فرق الفجرين:");

  const now = at("2026-03-29T03:00:00Z");
  const { current, next } = findCurrentAndNext([before, after], now);
  eq(current.key, "isha", "الجارية:");
  eq(next.key, "fajr", "القادمة:");
  eq(next.at - now, 60 * 60 * 1000, "متبقٍ للفجر (ساعة واحدة):");
});

check("مفتاح اليوم يُحسب بمنطقة الموقع الزمنية", () => {
  eq(todayKeyIn("Asia/Amman", at("2026-10-17T22:00:00Z")), "2026-10-18", "عمّان:");
  eq(todayKeyIn("Europe/London", at("2026-10-17T22:00:00Z")), "2026-10-17", "لندن:");
});

/* --------------------------- التواريخ --------------------------- */

check("تنقّل التواريخ عبر نهايات الأشهر والسنوات", () => {
  eq(shiftDateKey("2026-12-31", 1), "2027-01-01", "نهاية السنة:");
  eq(shiftDateKey("2026-03-01", -1), "2026-02-28", "نهاية فبراير:");
  eq(daysBetweenKeys("2026-10-31", "2026-11-01"), 1, "أكتوبر ← نوفمبر:");
  eq(daysBetweenKeys("2026-10-17", "2026-12-25"), 69, "٦٩ يومًا:");
});

check("صيغ العرض: العدّاد والأوقات والتواريخ", () => {
  eq(formatCountdown(3_661_000, "ar"), "٠١:٠١:٠١", "عدّ عربي:");
  eq(formatCountdown(-5_000, "ar"), "٠٠:٠٠:٠٠", "عدّ سالب:");
  eq(formatCountdownShort(2 * 3_600_000 + 47 * 60_000, "en"), "02:47", "عدّ مختصر:");
  eq(formatCountdownWords(2 * 3_600_000 + 12 * 60_000, "ar"), "متبقٍ ساعتان و١٢ دقيقة", "صيغة منطوقة:");
  eq(formatCountdownWords(45 * 60_000, "ar"), "متبقٍ ٤٥ دقيقة", "صيغة منطوقة (٤٥):");
  eq(formatClock("05:20", "12", "ar"), "٥:٢٠ ص", "١٢ ساعة:");
  eq(formatClock("17:55", "24", "ar"), "١٧:٥٥", "٢٤ ساعة:");
  eq(formatClock("12:05", "12", "en"), "12:05 PM", "ظهر بالإنجليزية:");
  eq(formatClock("00:37", "12", "ar"), "١٢:٣٧ ص", "منتصف الليل:");
  eq(formatHijri(6, "جُمادى الأولى", 1448, "ar"), "٦ جُمادى الأولى ١٤٤٨ هـ", "تاريخ هجري:");
  eq(relativeDays(0, "ar"), "اليوم", "اليوم:");
  eq(relativeDays(1, "ar"), "غدًا", "غدًا:");
  eq(relativeDays(2, "ar"), "بعد يومين", "بعد يومين:");
  eq(relativeDays(5, "ar"), "بعد ٥ أيام", "بعد ٥:");
  eq(relativeDays(15, "ar"), "بعد ١٥ يومًا", "بعد ١٥:");
});

check("التحقّق من صحة الإحداثيات", () => {
  eq(areCoordinatesValid(31.95, 35.91), true, "عمّان:");
  eq(areCoordinatesValid(91, 0), false, "خط عرض ٩١:");
  eq(areCoordinatesValid(0, 181), false, "خط طول ١٨١:");
  eq(areCoordinatesValid(Number.NaN, 0), false, "قيمة غير رقمية:");
});

/* --------------------------- رمضان --------------------------- */

check("نوافذ رمضان: قبل الفجر (سحور اليوم) وبعد الإفطار (إفطار الغد)", () => {
  const beforeFajr = ramadanWindows(threeDays, at("2026-10-17T04:00:00+03:00"));
  eq(beforeFajr.suhoor.key, "fajr", "السحور:");
  eq(beforeFajr.suhoor.dateKey, "2026-10-17", "يوم السحور:");
  eq(beforeFajr.iftar.key, "maghrib", "الإفطار:");
  eq(beforeFajr.iftar.dateKey, "2026-10-17", "يوم الإفطار:");
  eq(beforeFajr.iftarMs, at("2026-10-17T17:55:00+03:00") - at("2026-10-17T04:00:00+03:00"), "متبقٍ للإفطار:");

  const midDay = ramadanWindows(threeDays, at("2026-10-17T13:00:00+03:00"));
  eq(midDay.suhoor.dateKey, "2026-10-18", "السحور بعد الظهر = فجر الغد:");
  eq(midDay.iftar.dateKey, "2026-10-17", "الإفطار بعد الظهر = مغرب اليوم:");

  const afterIftar = ramadanWindows(threeDays, at("2026-10-17T20:00:00+03:00"));
  eq(afterIftar.iftar.dateKey, "2026-10-18", "بعد الإفطار = مغرب الغد:");
  eq(afterIftar.suhoor.dateKey, "2026-10-18", "وبعده السحور فجر الغد:");
});

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} اختبارات منطق ناجحة`);
if (failed.length > 0) {
  for (const item of failed) console.log(`  - ${item.name}: ${item.error}`);
  process.exit(1);
}
console.log("منطق المواقيت سليم ✔");

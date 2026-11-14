// @ts-nocheck
/**
 * فحص سلامة المحتوى والبيانات (بلا متصفح):
 *  - ١١٤ سورة، ٦٢٣٦ آية، وتطابق عدد الآيات مع فهرس السور
 *  - نصوص غير فارغة وخالية من HTML/رموز الاستبدال
 *  - سلامة أقسام الأذكار والأدعية والرقية من حيث البنية فقط
 *
 * لا يتحقق من صحة النص الشرعي نفسه؛ هذا يحتاج مراجعة بشرية موثّقة.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

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

const source = readFileSync("src/data/quran/surahs.ts", "utf8");
const surahRe =
  /\{\s*number:\s*(\d+),\s*name:\s*"([^"]+)",\s*englishName:\s*"[^"]+",\s*ayahCount:\s*(\d+),\s*revelation:\s*"([^"]+)"\s*\}/g;
const surahs = [...source.matchAll(surahRe)].map((m) => ({
  number: Number(m[1]),
  name: m[2],
  ayahCount: Number(m[3]),
  revelation: m[4],
}));

const textDir = "src/data/quran/text";
const textFiles = readdirSync(textDir).filter((file) => file.endsWith(".json"));
const quran = new Map();
for (const file of textFiles) {
  const number = Number(file.replace(".json", ""));
  quran.set(number, JSON.parse(readFileSync(join(textDir, file), "utf8")));
}

check("فهرس السور: ١١٤ سورة بأرقام متسلسلة", () => {
  eq(surahs.length, 114, "عدد السور:");
  surahs.forEach((surah, index) => {
    eq(surah.number, index + 1, `رقم السورة ${index + 1}:`);
    if (!surah.name.trim()) throw new Error(`اسم السورة ${surah.number} فارغ`);
    if (!["مكية", "مدنية"].includes(surah.revelation)) {
      throw new Error(`نوع نزول غير معروف للسورة ${surah.number}`);
    }
  });
});

check("ملفات النص: ١١٤ ملفًا و٦٢٣٦ آية", () => {
  eq(textFiles.length, 114, "عدد الملفات:");
  eq([...quran.values()].reduce((sum, ayahs) => sum + ayahs.length, 0), 6236, "عدد الآيات:");
});

check("تطابق عدد الآيات مع الفهرس وخلوّها من الفراغ/HTML", () => {
  let checked = 0;
  for (const surah of surahs) {
    const ayahs = quran.get(surah.number);
    if (!ayahs) throw new Error(`نص السورة ${surah.number} مفقود`);
    eq(ayahs.length, surah.ayahCount, `عدد آيات سورة ${surah.name}:`);
    for (const ayah of ayahs) {
      if (!ayah.text?.trim()) throw new Error(`آية فارغة في سورة ${surah.number}`);
      if (/<[^>]+>/.test(ayah.text)) throw new Error(`وسم HTML في سورة ${surah.number}`);
      if (ayah.text.includes("\uFFFD")) throw new Error(`رمز استبدال في سورة ${surah.number}`);
      checked += 1;
    }
  }
  eq(checked, 6236, "الآيات المفحوصة:");
});

check("أرقام الآيات متصلة داخل كل سورة", () => {
  for (const surah of surahs) {
    const ayahs = quran.get(surah.number);
    ayahs.forEach((ayah, index) => {
      eq(ayah.numberInSurah, index + 1, `ترقيم سورة ${surah.name}:`);
    });
  }
});

check("الأذكار: فئات ونصوص غير فارغة", () => {
  const azkar = readFileSync("src/data/azkar/index.ts", "utf8");
  const categories = (azkar.match(/id:\s*"[^"]+"/g) ?? []).length;
  if (categories < 4) throw new Error(`عدد فئات الأذكار غير متوقع: ${categories}`);
  if (!azkar.includes("count:")) throw new Error("لا توجد عدّادات أذكار");
});

check("الأدعية والرقية: نصوص غير فارغة", () => {
  const duas = readFileSync("src/data/duas/index.ts", "utf8");
  const ruqyah = readFileSync("src/data/ruqyah/index.ts", "utf8");
  if ((duas.match(/text:\s*"/g) ?? []).length < 30) throw new Error("عدد الأدعية قليل جدًا");
  if ((ruqyah.match(/lines:\s*\[/g) ?? []).length < 5) throw new Error("أقسام الرقية قليلة جدًا");
});

console.log(`\n${results.filter((r) => r.ok).length}/${results.length} فحوص محتوى ناجحة`);
const failed = results.filter((r) => !r.ok);
if (failed.length) process.exit(1);
console.log("سلامة بيانات المحتوى سليمة ✔");

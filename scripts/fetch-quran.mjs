// @ts-nocheck
/**
 * يجلب نص القرآن الكريم (رواية حفص عن عاصم — المصحف العثماني) لجميع السور
 * ويخزّنه محليًا كملفات JSON منفصلة، ليعمل الموقع دون اتصال ودون أي واجهة خارجية.
 *
 * التشغيل:  node scripts/fetch-quran.mjs
 *
 * ملاحظات منهجية:
 *  - المصدر: alquran.cloud (نص المصحف الإلكتروني المتوارث عن مشروع Tanzil).
 *  - لا يُعدَّل النص إطلاقًا؛ العملية الوحيدة هي فصل البسملة عن الآية الأولى
 *    للسور (عدا الفاتحة والتوبة) لعرضها في سطر مستقلّ، وهو ما يوافق المصاحف المطبوعة.
 */
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "src", "data", "quran", "text");
const API = "https://api.alquran.cloud/v1/surah";
const EDITION = "quran-uthmani";
const TOTAL_AYAHS = 6236;

const BOM = /^\uFEFF/;
const norm = (s) => s.replace(BOM, "").replace(/\s+/g, " ").trim();

// الحركات والعلامات القرآنية — تُستخدم لمقارنة متسامحة عند فصل البسملة
const MARKS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
const stripMarks = (s) => s.replace(MARKS, "");

/** يفصل البسملة عن بداية الآية الأولى إن وُجدت، بمقارنة تتجاهل اختلاف الحركات. */
function detachBismillah(raw, bismillah) {
  if (raw.startsWith(bismillah)) return raw.slice(bismillah.length).trim();
  const target = stripMarks(bismillah);
  let acc = "";
  for (let i = 0; i < raw.length; i++) {
    acc += stripMarks(raw[i]);
    if (acc === target) {
      // نتجاوز أي حركات لاحقة ثم المسافات
      return raw
        .slice(i + 1)
        .replace(/^[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]+/, "")
        .trim();
    }
  }
  return null;
}

async function fetchSurah(n) {
  const res = await fetch(`${API}/${n}/${EDITION}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== "OK" || !json.data?.ayahs?.length) throw new Error("bad payload");
  return json.data;
}

async function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  // نستخرج البسملة من الآية الأولى لسورة الفاتحة لضمان مطابقتها حرفيًا للنص المصدر
  const fatiha = await fetchSurah(1);
  const BISMILLAH = fatiha.ayahs[0].text.replace(BOM, "").trim();
  if (!norm(BISMILLAH)) {
    console.error("تعذّر استخراج البسملة من سورة الفاتحة");
    process.exit(1);
  }

  let total = 0;
  let stripped = 0;
  const failures = [];

  for (let n = 1; n <= 114; n++) {
    let data;
    try {
      data = n === 1 ? fatiha : await fetchSurah(n);
    } catch (err) {
      failures.push({ n, err: String(err) });
      continue;
    }

    const isFatiha = n === 1;
    const isTawbah = n === 9;

    const ayahs = data.ayahs.map((a) => {
      let text = a.text.replace(BOM, "").trim();
      if (a.numberInSurah === 1 && !isFatiha && !isTawbah) {
        const detached = detachBismillah(text, BISMILLAH);
        if (detached != null) {
          text = detached;
          stripped++;
        } else {
          console.warn(`⚠ السورة ${n}: لم يتم التعرف على البسملة في الآية الأولى`);
        }
      }
      return {
        number: a.number,
        numberInSurah: a.numberInSurah,
        text,
        page: a.page,
        juz: a.juz,
      };
    });

    total += ayahs.length;
    writeFileSync(resolve(OUT_DIR, `${n}.json`), JSON.stringify(ayahs), "utf8");
    process.stdout.write(`\r✓ ${n}/114 (البسملة مفصولة: ${stripped})`);
  }

  process.stdout.write("\n");

  if (failures.length) {
    console.error("فشل جلب السور:", failures);
    process.exit(1);
  }
  if (total !== TOTAL_AYAHS) {
    console.error(`مجموع الآيات ${total} ≠ ${TOTAL_AYAHS} المتوقّع`);
    process.exit(1);
  }
  console.log(`تم بنجاح: 114 سورة، ${total} آية، في ${OUT_DIR}`);
}

main();

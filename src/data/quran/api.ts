import type { Ayah } from "./types";

/**
 * طبقة الوصول إلى نص القرآن الكريم.
 *
 * كل السور مُضمَّنة محليًا كملفات JSON منفصلة (114 ملفًا)، وتُحمَّل عند الطلب
 * عبر `import.meta.glob`، فتُقسَّم تلقائيًا إلى حِزم صغيرة لكل سورة.
 *
 * النتيجة: لا يوجد أي اعتماد على الشبكة لقراءة القرآن، ويعمل الموقع دون اتصال
 * بالكامل بعد الزيارة الأولى (وحتى دونها عند تفعيل عامل الخدمة).
 *
 * النص هو رواية حفص عن عاصم (المصحف العثماني)، منقول كما هو بلا تعديل.
 */
const modules = import.meta.glob<Ayah[]>("./text/*.json", { import: "default" });

export type SurahPayload = {
  number: number;
  ayahs: Ayah[];
};

/** يجلب آيات سورة كاملة من الحزمة المحلية. */
export async function fetchSurah(number: number): Promise<SurahPayload> {
  const key = `./text/${number}.json`;
  const loader = modules[key];
  if (!loader) throw new Error(`تعذّر العثور على السورة ${number}`);
  const ayahs = await loader();
  return { number, ayahs };
}

/** كل السور متوفّرة محليًا، فلا حاجة لجلب من الشبكة. */
export function isSurahBundled(number: number): boolean {
  return `./text/${number}.json` in modules;
}

export type MushafPageData = {
  /** رقم الصفحة في مصحف المدينة */
  page: number;
  /** رقم الجزء */
  juz: number;
  ayahs: Ayah[];
};

/**
 * يجمع الآيات في صفحات مصحف حقيقية اعتمادًا على حقل `page` المضمَّن في النص،
 * فتُعرض السورة كما في المصحف: صفحة تلو صفحة بنفس فواصل مصحف المدينة.
 */
export function groupByPage(ayahs: Ayah[]): MushafPageData[] {
  const pages: MushafPageData[] = [];
  for (const ayah of ayahs) {
    const last = pages[pages.length - 1];
    if (last && last.page === ayah.page) {
      last.ayahs.push(ayah);
    } else {
      pages.push({ page: ayah.page, juz: ayah.juz ?? last?.juz ?? 1, ayahs: [ayah] });
    }
  }
  return pages;
}

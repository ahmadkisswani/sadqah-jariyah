/**
 * طرق حساب مواقيت الصلاة المعتمدة في AlAdhan API.
 *
 * الأرقام هي معرّفات AlAdhan نفسها (`method`) وتُرسَل كما هي، والأسماء للعرض
 * فقط. القرار هنا لا يُحسب يدويًا — كل الحساب يجري في الخدمة.
 */

export type CalculationMethod = { id: number; ar: string; en: string };

/** الطرق الشائعة المستخدمة في الموقع (مرتّبة: الأكثر استخدامًا أولًا). */
export const CALCULATION_METHODS: CalculationMethod[] = [
  { id: 23, ar: "وزارة الأوقاف والشؤون والمقدسات الإسلامية — الأردن", en: "Ministry of Awqaf, Jordan" },
  { id: 3, ar: "رابطة العالم الإسلامي", en: "Muslim World League" },
  { id: 4, ar: "جامعة أم القرى — مكة المكرمة", en: "Umm Al-Qura University, Makkah" },
  { id: 5, ar: "الهيئة المصرية العامة للمساحة — مصر", en: "Egyptian General Authority of Survey" },
  { id: 2, ar: "الجمعية الإسلامية لأمريكا الشمالية (ISNA)", en: "Islamic Society of North America (ISNA)" },
  { id: 1, ar: "جامعة العلوم الإسلامية — كراتشي", en: "University of Islamic Sciences, Karachi" },
  { id: 8, ar: "دول الخليج", en: "Gulf Region" },
  { id: 9, ar: "الكويت", en: "Kuwait" },
  { id: 10, ar: "قطر", en: "Qatar" },
  { id: 13, ar: "رئاسة الشؤون الدينية التركية (ديانت)", en: "Diyanet İşleri Başkanlığı, Turkey" },
  { id: 15, ar: "لجنة رؤية الهلال العالمية", en: "Moonsighting Committee Worldwide" },
  { id: 17, ar: "قسم تنمية الإسلام الماليزي (JAKIM)", en: "JAKIM, Malaysia" },
  { id: 20, ar: "وزارة الشؤون الدينية — إندونيسيا", en: "KEMENAG, Indonesia" },
  { id: 11, ar: "مجلس أوغاما الإسلامي — سنغافورة", en: "MUIS, Singapore" },
  { id: 21, ar: "وزارة الأوقاف والشؤون الإسلامية — المغرب", en: "Ministry of Habous, Morocco" },
  { id: 19, ar: "وزارة الشؤون الدينية والأوقاف — الجزائر", en: "Ministry of Religious Affairs, Algeria" },
  { id: 18, ar: "وزارة الشؤون الدينية — تونس", en: "Ministry of Religious Affairs, Tunisia" },
  { id: 12, ar: "اتحاد المنظمات الإسلامية في فرنسا", en: "UOIF, France" },
  { id: 14, ar: "الإدارة الدينية لمسلمي روسيا", en: "Spiritual Administration of Muslims of Russia" },
  { id: 16, ar: "دبي", en: "Dubai" },
  { id: 22, ar: "الجالية الإسلامية في لشبونة", en: "Comunidade Islâmica de Lisboa" },
  { id: 7, ar: "معهد الجيوفيزياء — جامعة طهران", en: "Institute of Geophysics, University of Tehran" },
  { id: 0, ar: "الشيعة الاثنا عشرية — معهد ليفا، قم", en: "Shia Ithna-Ashari, Leva Institute, Qum" },
];

/**
 * الطريقة المقترحة تلقائيًا حسب الدولة (رمز ISO).
 * المستخدم يستطيع تغييرها في أي وقت من الإعدادات، والواجهة تُظهر دائمًا
 * الطريقة المستخدمة فعليًا كما يعيدها الخادم.
 */
const COUNTRY_METHODS: Record<string, number> = {
  // الشرق الأوسط
  JO: 23, SA: 4, AE: 8, KW: 9, QA: 10, BH: 8, OM: 8, YE: 4,
  EG: 5, SD: 5, LY: 5, TN: 18, DZ: 19, MA: 21, MR: 3, SO: 3, DJ: 3,
  IQ: 3, SY: 3, LB: 3, PS: 3,
  // أفريقيا
  ET: 3, KE: 3, TZ: 3, NG: 2, GH: 3, SN: 3, ML: 3, CM: 3, UG: 3, RW: 3,
  ZA: 3, MZ: 3, ZM: 3, ZW: 3, BW: 3, NA: 3, MW: 3,
  // آسيا
  TR: 13, PK: 1, IN: 1, BD: 1, AF: 1, LK: 1, MV: 3, NP: 1,
  ID: 20, MY: 17, SG: 11, BN: 17, TH: 3, PH: 3, CN: 3, JP: 3, KR: 3,
  KZ: 3, UZ: 3, AZ: 3, KG: 3, TJ: 3, TM: 3, GE: 3,
  // أوروبا
  GB: 15, IE: 15, FR: 12, DE: 3, NL: 3, BE: 3, ES: 3, IT: 3, PT: 22,
  SE: 3, NO: 3, DK: 3, FI: 3, CH: 3, AT: 3, PL: 3, GR: 3, AL: 3, BA: 3,
  MK: 3, XK: 3, BG: 3, RO: 3, HU: 3, CZ: 3, UA: 3, RU: 14,
  // الأمريكتان
  US: 2, CA: 2, MX: 2, BR: 3, AR: 3, CO: 3, CL: 3, PE: 3, VE: 3,
  // أوقيانوسيا
  AU: 3, NZ: 3,
};

/** الطريقة الافتراضية لدولة معيّنة (رابطة العالم الإسلامي عند عدم المعرفة). */
export function defaultMethodFor(countryCode?: string | null): number {
  if (!countryCode) return 3;
  return COUNTRY_METHODS[countryCode.toUpperCase()] ?? 3;
}

/** اسم مقروء لطريقة الحساب برقمها (مع بديل إن كان الرقم غير معروف). */
export function methodName(id: number, lang: "ar" | "en" = "ar"): string {
  const method = CALCULATION_METHODS.find((item) => item.id === id);
  if (method) return method[lang];
  return lang === "ar" ? `طريقة مخصّصة (${id})` : `Custom method (${id})`;
}

/**
 * قواعد خطوط العرض العالية (Fajr/Isha في الليالي الطويلة).
 * "auto" = اتركها لطريقة الحساب نفسها (بعض الطرق تعرّف قاعدتها داخليًا).
 */
export type HighLatitudeSetting = "auto" | 1 | 2 | 3;

export const HIGH_LATITUDE_OPTIONS: { value: HighLatitudeSetting; ar: string; en: string }[] = [
  { value: "auto", ar: "افتراضي (حسب طريقة الحساب)", en: "Default (per calculation method)" },
  { value: 1, ar: "منتصف الليل", en: "Middle of the night" },
  { value: 2, ar: "سُبُع الليل", en: "One seventh of the night" },
  { value: 3, ar: "زاوية الشمس", en: "Angle-based" },
];

/** هل يُستحسن تفعيل قاعدة خطوط العرض العالية لهذا الموقع؟ */
export function suggestsHighLatitudeRule(latitude: number): boolean {
  return Math.abs(latitude) >= 48;
}

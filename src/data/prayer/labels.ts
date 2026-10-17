/**
 * نصوص قسم مواقيت الصلاة بالعربية والإنجليزية.
 *
 * الموقع عربي أولًا، فالوضع الافتراضي يعرض العربية كبيرة وبجانبها الإنجليزية
 * الصغيرة. ويمكن للمستخدم في الإعدادات جعل الإنجليزية هي الأساسية (English)
 * لمن يفضّلها، مع بقاء العربية ظاهرة دائمًا.
 */

export type Lang = "ar" | "en";
export type Bilingual = { ar: string; en: string };

/** اختصار لبناء نص ثنائي اللغة. */
export const L = (ar: string, en: string): Bilingual => ({ ar, en });

/** النص الأساسي حسب اللغة المختارة. */
export const primary = (text: Bilingual, lang: Lang): string => text[lang];

/** النص الثانوي (اللغة الأخرى) — يظهر بخط أصغر. */
export const secondary = (text: Bilingual, lang: Lang): string => (lang === "ar" ? text.en : text.ar);

/* ------------------------------- الصلوات ------------------------------- */

export type PrayerKey = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";
export type ExtraTimingKey = "imsak" | "sunset" | "midnight" | "lastthird";

export const PRAYER_LABELS: { key: PrayerKey; ar: string; en: string }[] = [
  { key: "fajr", ar: "الفجر", en: "Fajr" },
  { key: "sunrise", ar: "الشروق", en: "Sunrise" },
  { key: "dhuhr", ar: "الظهر", en: "Dhuhr" },
  { key: "asr", ar: "العصر", en: "Asr" },
  { key: "maghrib", ar: "المغرب", en: "Maghrib" },
  { key: "isha", ar: "العشاء", en: "Isha" },
];

/** الصلوات الخمس المفروضة (بدون الشروق — ليس صلاة). */
export type ObligatoryPrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export const OBLIGATORY_PRAYERS: ObligatoryPrayerKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];

export const EXTRA_TIMINGS: { key: ExtraTimingKey; ar: string; en: string }[] = [
  { key: "imsak", ar: "الإمساك", en: "Imsak" },
  { key: "sunset", ar: "الغروب", en: "Sunset" },
  { key: "midnight", ar: "منتصف الليل", en: "Midnight" },
  { key: "lastthird", ar: "الثلث الأخير", en: "Last third" },
];

export function prayerLabel(key: PrayerKey): Bilingual {
  const item = PRAYER_LABELS.find((prayer) => prayer.key === key);
  return { ar: item?.ar ?? key, en: item?.en ?? key };
}

/* ---------------------------- أحداث إسلامية ---------------------------- */

export type EventDefinition = { key: string; day: number; month: number; ar: string; en: string };

/**
 * الأحداث المهمّة التي نبحث عنها في تقويم AlAdhan.
 * التواريخ هجرية (شهر/يوم) وتُحوَّل إلى ميلادية عبر الخدمة نفسها — لا نحسبها يدويًا.
 */
export const ISLAMIC_EVENTS: EventDefinition[] = [
  { key: "ramadan", day: 1, month: 9, ar: "أوّل أيام رمضان", en: "First day of Ramadan" },
  { key: "laylat-al-qadr", day: 27, month: 9, ar: "ليلة القدر (الليلة ٢٧)", en: "Laylat al-Qadr (27th night)" },
  { key: "eid-fitr", day: 1, month: 10, ar: "عيد الفطر", en: "Eid al-Fitr" },
  { key: "arafah", day: 9, month: 12, ar: "يوم عرفة", en: "Day of Arafah" },
  { key: "eid-adha", day: 10, month: 12, ar: "عيد الأضحى", en: "Eid al-Adha" },
  { key: "new-year", day: 1, month: 1, ar: "رأس السنة الهجرية", en: "Islamic New Year" },
  { key: "ashura", day: 10, month: 1, ar: "يوم عاشوراء", en: "Day of Ashura" },
  { key: "mawlid", day: 12, month: 3, ar: "المولد النبوي", en: "Prophet's Birthday" },
];

/**
 * ترجمة أسماء المناسبات كما تعيدها الخدمة (بالإنجليزية) إلى العربية.
 * غير موجود في القاموس يظهر كما ورد من الخدمة دون تحريف.
 */
const HOLIDAY_TRANSLATIONS: Record<string, string> = {
  Ramadan: "رمضان",
  "1st Day of Ramadan": "أوّل أيام رمضان",
  "Beginning of Ramadan": "بداية رمضان",
  "Ramadan begins": "بداية رمضان",
  "Last 10 Days of Ramadan": "العشر الأواخر من رمضان",
  "Laylat al-Qadr": "ليلة القدر",
  "Eid al-Fitr": "عيد الفطر",
  "First Day of Eid al-Fitr": "أوّل أيام عيد الفطر",
  "Eid al-Fitr Holiday": "عيد الفطر (إجازة)",
  Hajj: "الحج",
  "Hajj begins": "بداية أشهر الحج",
  "Arafat Day": "يوم عرفة",
  "Day of Arafah": "يوم عرفة",
  "Eid al-Adha": "عيد الأضحى",
  "First Day of Eid al-Adha": "أوّل أيام عيد الأضحى",
  "Eid al-Adha Holiday": "عيد الأضحى (إجازة)",
  "Islamic New Year": "رأس السنة الهجرية",
  "Beginning of Muharram": "بداية شهر المحرم",
  Ashura: "يوم عاشوراء",
  "Day of Ashura": "يوم عاشوراء",
  "Prophet's Birthday": "المولد النبوي",
  "The Prophet's Birthday": "المولد النبوي",
  Mawlid: "المولد النبوي",
  "Isra and Mi'raj": "الإسراء والمعراج",
  "Isra' and Mi'raj": "الإسراء والمعراج",
  "Mid-Sha'ban": "ليلة النصف من شعبان",
};

/** ترجمة مناسبة قادمة من الخدمة (تُترك بالإنجليزية إن لم تُعرف). */
export function translateHoliday(name: string, lang: Lang): string {
  if (lang === "en") return name;
  return HOLIDAY_TRANSLATIONS[name] ?? name;
}

/* ------------------------------- الإعدادات ------------------------------- */

export const STRINGS = {
  pageTitle: L("مواقيت الصلاة", "Prayer Times"),
  pageSubtitle: L(
    "مواقيت دقيقة حسب موقعك، مع عدّ تنازلي للصلاة القادمة والتقويم الهجري.",
    "Accurate prayer times for your location, with a live countdown and Hijri calendar.",
  ),
  nextPrayer: L("الصلاة القادمة", "Next prayer"),
  timeRemaining: L("الوقت المتبقّي حتى الأذان", "Time remaining until the call to prayer"),
  now: L("الآن", "Now"),
  windowNow: L("الوقت الحالي", "Current window"),
  passed: L("مضى وقتها", "Passed"),
  upcoming: L("لم يحن بعد", "Upcoming"),
  inTime: L("بعد", "in"),
  today: L("اليوم", "Today"),
  tomorrow: L("غدًا", "Tomorrow"),
  location: L("الموقع", "Location"),
  changeLocation: L("تغيير الموقع", "Change location"),
  useMyLocation: L("استخدم موقعي الدقيق", "Use my precise location"),
  useApproximate: L("موقع تقريبي حسب الشبكة", "Approximate (network) location"),
  chooseManually: L("اختيار المدينة يدويًا", "Choose a city manually"),
  approximate: L("تقريبي", "Approximate"),
  exactGps: L("حسب موقعك", "From your device"),
  localTime: L("الوقت المحلي", "Local time"),
  timezone: L("المنطقة الزمنية", "Timezone"),
  calculationMethod: L("طريقة الحساب", "Calculation method"),
  autoMethod: L("تلقائي حسب الدولة", "Automatic by country"),
  effectiveMethod: L("الطريقة المستخدمة فعليًا", "Effective method"),
  madhhab: L("مذهب حساب العصر", "Asr calculation (madhhab)"),
  standard: L("الشافعي / المعتمد", "Standard (Shafi'i)"),
  hanafi: L("الحنفي", "Hanafi"),
  timeFormat: L("صيغة الوقت", "Time format"),
  twelveHour: L("١٢ ساعة", "12-hour"),
  twentyFourHour: L("٢٤ ساعة", "24-hour"),
  language: L("لغة العرض", "Display language"),
  arabic: L("العربية", "Arabic"),
  english: L("English", "English"),
  highLatitude: L("قاعدة خطوط العرض العالية", "High-latitude rule"),
  highLatitudeHint: L(
    "يُستحسن ضبط هذه القاعدة في المدن البعيدة عن خط الاستواء (٤٨° فأكثر) حيث لا يغيب الشفق.",
    "Recommended for locations far from the equator (48°+) where twilight may not disappear.",
  ),
  adjustments: L("تعديلات يدوية (دقائق)", "Manual adjustments (minutes)"),
  adjustmentsHint: L(
    "لتقريب المواقيت من مسجدك المحلي إذا لاحظت فرقًا ثابتًا.",
    "Use to match your local mosque if you notice a constant difference.",
  ),
  reset: L("استعادة الافتراضي", "Reset to defaults"),
  settings: L("إعدادات المواقيت", "Prayer settings"),
  times: L("المواقيت", "Times"),
  calendar: L("التقويم الهجري", "Hijri calendar"),
  events: L("مناسبات إسلامية قادمة", "Upcoming Islamic events"),
  ramadan: L("رمضان", "Ramadan"),
  ramadanMubarak: L("رمضان مبارك", "Ramadan Mubarak"),
  ramadanDay: L("اليوم", "Day"),
  ramadanOf: L("من رمضان", "of Ramadan"),
  iftar: L("الإفطار (المغرب)", "Iftar (Maghrib)"),
  suhoor: L("السحور (حتى الفجر)", "Suhoor (until Fajr)"),
  imsak: L("الإمساك", "Imsak"),
  iftarIn: L("الوقت المتبقّي حتى الإفطار", "Time remaining until Iftar"),
  suhoorIn: L("الوقت المتبقّي حتى الإمساك", "Time remaining until Suhoor"),
  daysUntilRamadan: L("يومًا يفصلنا عن رمضان", "days until Ramadan"),
  ramadanFirstDay: L("أوّل أيام رمضان", "First day of Ramadan"),
  eidFitr: L("عيد الفطر", "Eid al-Fitr"),
  eidAdha: L("عيد الأضحى", "Eid al-Adha"),
  eidFitrIn: L("الوقت المتبقّي حتى عيد الفطر", "Time until Eid al-Fitr"),
  eidAdhaIn: L("الوقت المتبقّي حتى عيد الأضحى", "Time until Eid al-Adha"),
  extraTimings: L("أوقات مساعدة", "Supporting times"),
  extraNote: L("ليست من الصلوات الخمس المفروضة", "Not one of the five obligatory prayers"),
  monthlyCalendar: L("التقويم الشهري", "Monthly calendar"),
  previousMonth: L("الشهر السابق", "Previous month"),
  nextMonth: L("الشهر التالي", "Next month"),
  thisMonth: L("هذا الشهر", "This month"),
  gregorian: L("ميلادي", "Gregorian"),
  hijri: L("هجري", "Hijri"),
  dayDetails: L("تفاصيل اليوم", "Day details"),
  close: L("إغلاق", "Close"),
  retry: L("إعادة المحاولة", "Try again"),
  loading: L("جارٍ التحميل…", "Loading…"),
  timesUnavailable: L(
    "مواقيت الصلاة غير متاحة مؤقتًا. حاول مرة أخرى.",
    "Prayer times are temporarily unavailable. Please try again.",
  ),
  offlineUsingCache: L(
    "تعذّر تحديث المواقيت — تُعرض آخر بيانات محفوظة.",
    "Could not refresh — showing the last saved data.",
  ),
  locationDenied: L(
    "الوصول إلى الموقع متوقّف. اختر موقعك لحساب مواقيت دقيقة.",
    "Location access is disabled. Choose your location to calculate accurate prayer times.",
  ),
  locationUnavailable: L(
    "تعذّر تحديد موقعك تلقائيًا. اختر موقعك يدويًا.",
    "We could not detect your location automatically. Please choose it manually.",
  ),
  locatingNow: L("جارٍ تحديد موقعك…", "Detecting your location…"),
  locationDeniedIos: L(
    "الوصول إلى الموقع متوقّف على هذا الجهاز. على iPhone: الإعدادات ← الخصوصية والأمان ← خدمة الموقع ← المواقع في Safari ← «أثناء استخدام التطبيق»، ثم أعد المحاولة أو اختر مدينتك يدويًا.",
    "Location access is disabled on this device. On iPhone: Settings → Privacy & Security → Location Services → Safari Websites → While Using, then try again or pick your city manually.",
  ),
  locationInsecure: L(
    "تحديد الموقع الدقيق يحتاج اتصالًا آمنًا (https) — ولهذا لا يعمل مع فتح الموقع من عنوان شبكة محلية. افتح الموقع من رابطه الأساسي، أو اختر مدينتك يدويًا الآن.",
    "Precise location needs a secure (https) connection — it will not work when the site is opened from a local network address. Open the main site address, or pick your city manually.",
  ),
  accuracyNote: L(
    "المواقيت محسوبة بالطريقة المختارة وقد تختلف قليلًا عن مسجدك — لكل مسجد اجتهاده في المعايير والتعديلات.",
    "Times are calculated with the selected method and may differ slightly from your local mosque.",
  ),
  hijriNote: L(
    "قد تختلف التواريخ الهجرية حسب الدولة والجهات المعتمدة ورؤية الهلال.",
    "Islamic dates may vary by country and local moon-sighting authorities.",
  ),
  country: L("الدولة", "Country"),
  city: L("المدينة", "City"),
  coordinates: L("إحداثيات يدوية", "Manual coordinates"),
  latitude: L("خط العرض", "Latitude"),
  longitude: L("خط الطول", "Longitude"),
  apply: L("تطبيق", "Apply"),
  invalidCoordinates: L(
    "الإحداثيات غير صحيحة — خط العرض بين -٩٠ و٩٠ وخط الطول بين -١٨٠ و١٨٠.",
    "Invalid coordinates — latitude must be between -90 and 90 and longitude between -180 and 180.",
  ),
  saved: L("تم حفظ الموقع", "Location saved"),
  useGpsExplain: L(
    "نستخدم موقعك لحساب المواقيت بدقّة، ويُحفظ في هذا الجهاز فقط.",
    "Your location is used to calculate accurate times and is stored on this device only.",
  ),
  openTimes: L("عرض المواقيت", "View prayer times"),
  entryTitle: L("مواقيت الصلاة", "Prayer Times"),
  entrySubtitle: L(
    "مواقيت اليوم والصلاة القادمة حسب موقعك، مع التقويم الهجري.",
    "Today's times and the next prayer for your location, with the Hijri calendar.",
  ),
  entryCta: L("اعرض مواقيت اليوم", "View today's prayer times"),
  todaySchedule: L("جدول اليوم", "Today's schedule"),
  sunLabel: L("الشمس", "Sun"),
  aboutTimes: L("عن هذه المواقيت", "About these times"),
} as const;

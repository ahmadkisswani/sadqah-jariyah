/**
 * قائمة القرّاء المتاحين من شبكة islamic.network (cdn.islamic.network).
 *
 * لكل قارئ معدّل بتّ مختلف متاح على الشبكة (64/128/192)، وقد تحقّقنا من أن
 * الملفات تُقدَّم بدعم طلبات النطاق (206 Partial Content) وهو ما تحتاجه
 * متصفحات الجوال — خصوصًا iOS Safari — لتشغيل التلاوة.
 */
export type Reciter = {
  /** معرّف القارئ كما في رابط الشبكة */
  id: string;
  /** الاسم المعروض بالعربية */
  name: string;
  /** معدّل البتّ المتوفّر لهذا القارئ */
  bitrate: 64 | 128 | 192;
};

export const RECITERS: Reciter[] = [
  { id: "ar.alafasy", name: "مشاري راشد العفاسي", bitrate: 128 },
  { id: "ar.husary", name: "محمود خليل الحصري", bitrate: 128 },
  { id: "ar.mahermuaiqly", name: "ماهر المعيقلي", bitrate: 128 },
  { id: "ar.minshawi", name: "محمد صديق المنشاوي", bitrate: 128 },
  { id: "ar.hudhaify", name: "علي بن عبد الرحمن الحذيفي", bitrate: 128 },
  { id: "ar.abdurrahmaansudais", name: "عبد الرحمن السديس", bitrate: 192 },
  { id: "ar.shaatree", name: "أبو بكر الشاطري", bitrate: 128 },
  { id: "ar.ahmedajamy", name: "أحمد بن علي العجمي", bitrate: 128 },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد (مرتّل)", bitrate: 64 },
  { id: "ar.husarymujawwad", name: "محمود خليل الحصري (مجوّد)", bitrate: 128 },
];

export const DEFAULT_RECITER_ID = RECITERS[0].id;

const AUDIO_CDN = "https://cdn.islamic.network/quran";

/** يعيد القارئ المطابق للمعرّف، أو القارئ الافتراضي إن لم يوجد. */
export function getReciter(id: string): Reciter {
  return RECITERS.find((reciter) => reciter.id === id) ?? RECITERS[0];
}

/** رابط تلاوة آية واحدة — بالرقم العام للآية في المصحف. */
export function ayahAudioUrl(reciter: Reciter, globalAyahNumber: number): string {
  return `${AUDIO_CDN}/audio/${reciter.bitrate}/${reciter.id}/${globalAyahNumber}.mp3`;
}

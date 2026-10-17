/**
 * المناسبات الإسلامية القادمة (رمضان، العيدان، عرفة، عاشوراء، المولد…).
 *
 * التواريخ كلها من خدمة التقويم الهجري نفسها (hijriCalendar): نأخذ الشهر الهجري
 * كما تعيده الخدمة، ونبحث فيه عن يوم المناسبة، ثم نحسب ما تبقّى بالأيام.
 * لا يوجد أي تاريخ مكتوب يدويًا ولا تحويل هجري محلي.
 */

import { daysBetweenKeys, fetchHijriMonth, type HijriDay, type IslamicEvent } from "./api";
import { ISLAMIC_EVENTS } from "./labels";

export type UpcomingEventsOptions = {
  /** السنة الهجرية الحالية (من ردّ خدمة المواقيت). */
  hijriYear: number;
  latitude: number;
  longitude: number;
  /** تاريخ اليوم في منطقة الموقع (YYYY-MM-DD). */
  todayKey: string;
  /** كم حدثًا قادمًا نريد (افتراضيًا كل ما توفّر). */
  limit?: number;
};

/**
 * أقرب نسخة قادمة من كل مناسبة (تُجلب السنة الهجرية التالية عند الحاجة).
 * تُعاد مرتّبة زمنيًا، ويمكن أن تكون بعض العناصر بلا نتيجة إذا فشل جزء من
 * الطلبات — هذا مقصود لكي لا يتوقف القسم كله عند فشل شهر واحد.
 */
export async function fetchUpcomingEvents(
  options: UpcomingEventsOptions,
): Promise<IslamicEvent[]> {
  const { hijriYear, latitude, longitude, todayKey, limit } = options;
  const months = [...new Set(ISLAMIC_EVENTS.map((event) => event.month))];

  const requests = await Promise.allSettled(
    months.map((month) => fetchHijriMonth({ hijriYear, hijriMonth: month, latitude, longitude })),
  );

  const byMonth = new Map<number, HijriDay[]>();
  requests.forEach((result, index) => {
    if (result.status === "fulfilled") byMonth.set(months[index], result.value);
  });

  const events: IslamicEvent[] = [];

  for (const definition of ISLAMIC_EVENTS) {
    const monthDays = byMonth.get(definition.month);
    if (!monthDays || monthDays.length === 0) continue;
    const match = monthDays.find((day) => day.hDay === definition.day);
    if (!match) continue;

    let dateKey = match.dateKey;
    let daysUntil = daysBetweenKeys(todayKey, dateKey);
    let hijriYearUsed = match.hYear;

    if (daysUntil < 0) {
      // مضت هذه النسخة من المناسبة لهذه السنة الهجرية — نطلب السنة القادمة.
      try {
        const nextYearDays = await fetchHijriMonth({
          hijriYear: hijriYear + 1,
          hijriMonth: definition.month,
          latitude,
          longitude,
        });
        const nextMatch = nextYearDays.find((day) => day.hDay === definition.day);
        if (nextMatch) {
          dateKey = nextMatch.dateKey;
          daysUntil = daysBetweenKeys(todayKey, dateKey);
          hijriYearUsed = nextMatch.hYear;
        }
      } catch {
        /* نُبقي النسخة الماضية ثم نستبعدها أدناه */
      }
    }

    if (daysUntil < 0) continue;

    events.push({
      key: definition.key,
      ar: definition.ar,
      en: definition.en,
      dateKey,
      hijriDay: definition.day,
      hijriMonth: definition.month,
      hijriYear: hijriYearUsed,
      daysUntil,
      holidays: match.holidays,
    });
  }

  const sorted = events.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return limit ? sorted.slice(0, limit) : sorted;
}

/** المناسبات الأساسية (العيدان ورمضان) من القائمة الجاهزة. */
export function pickEvent(
  events: IslamicEvent[],
  key: string,
): IslamicEvent | undefined {
  return events.find((event) => event.key === key);
}

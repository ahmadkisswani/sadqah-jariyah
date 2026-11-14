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
  /** الشهر واليوم الهجريان الحاليان — لاختيار أقرب المناسبات فقط. */
  hijriMonth?: number;
  hijriDay?: number;
  latitude: number;
  longitude: number;
  /** تاريخ اليوم في منطقة الموقع (YYYY-MM-DD). */
  todayKey: string;
  /** كم حدثًا قادمًا نريد (افتراضيًا كل ما توفّر). */
  limit?: number;
};

type EventTarget = {
  definition: (typeof ISLAMIC_EVENTS)[number];
  hijriYear: number;
  approxDistance: number;
};

type EventCandidate = {
  definition: (typeof ISLAMIC_EVENTS)[number];
  monthDays: HijriDay[];
  hijriYear: number;
};

function buildEvent(
  candidate: EventCandidate,
  todayKey: string,
): IslamicEvent | null {
  const { definition, monthDays } = candidate;
  const match = monthDays.find((day) => day.hDay === definition.day);
  if (!match) return null;
  const daysUntil = daysBetweenKeys(todayKey, match.dateKey);
  if (daysUntil < 0) return null;

  return {
    key: definition.key,
    ar: definition.ar,
    en: definition.en,
    dateKey: match.dateKey,
    hijriDay: definition.day,
    hijriMonth: definition.month,
    hijriYear: match.hYear,
    daysUntil,
    holidays: match.holidays,
  };
}

/**
 * أقرب النسخ القادمة من المناسبات.
 *
 * عند توفر الشهر/اليوم الهجريين نجلب فقط أشهر أقرب المناسبات (وغالبًا ٣–٤
 * أشهر) بدل جلب كل الأشهر ثم إعادة طلب السنة التالية لكل مناسبة مضت.
 * وإذا لم يتوفر السياق الهجري نرجع إلى المسار الكامل، لكن مع توازي طلبات
 * السنة التالية بدل تسلسلها.
 */
export async function fetchUpcomingEvents(
  options: UpcomingEventsOptions,
): Promise<IslamicEvent[]> {
  const { hijriYear, hijriMonth, hijriDay, latitude, longitude, todayKey, limit } = options;
  const hasCurrentHijri =
    Number.isInteger(hijriMonth) &&
    Number.isInteger(hijriDay) &&
    (hijriMonth ?? 0) >= 1 &&
    (hijriMonth ?? 0) <= 12;

  if (hasCurrentHijri) {
    const currentMonth = hijriMonth as number;
    const currentDay = hijriDay as number;
    const keepCount = limit ? Math.max(limit + 1, 5) : ISLAMIC_EVENTS.length;

    const targets: EventTarget[] = ISLAMIC_EVENTS.map((definition) => {
      const passedThisYear =
        definition.month < currentMonth ||
        (definition.month === currentMonth && definition.day < currentDay);
      const year = hijriYear + (passedThisYear ? 1 : 0);
      const approxDistance =
        (passedThisYear ? 354 : 0) +
        (definition.month - currentMonth) * 30 +
        (definition.day - currentDay);
      return { definition, hijriYear: year, approxDistance };
    })
      .sort((a, b) => a.approxDistance - b.approxDistance)
      .slice(0, keepCount);

    const requestKeys = [
      ...new Set(targets.map((target) => `${target.hijriYear}:${target.definition.month}`)),
    ];
    const requests = await Promise.allSettled(
      requestKeys.map((key) => {
        const [year, month] = key.split(":").map(Number);
        return fetchHijriMonth({
          hijriYear: year,
          hijriMonth: month,
          latitude,
          longitude,
        });
      }),
    );

    const byKey = new Map<string, HijriDay[]>();
    requests.forEach((result, index) => {
      if (result.status === "fulfilled") byKey.set(requestKeys[index], result.value);
    });

    const events = targets
      .map((target) => {
        const monthDays = byKey.get(`${target.hijriYear}:${target.definition.month}`);
        if (!monthDays) return null;
        return buildEvent(
          { definition: target.definition, monthDays, hijriYear: target.hijriYear },
          todayKey,
        );
      })
      .filter((event): event is IslamicEvent => event !== null)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    return limit ? events.slice(0, limit) : events;
  }

  // مسار احتياطي للاستدعاءات القديمة التي لا تمرر السياق الهجري.
  const months = [...new Set(ISLAMIC_EVENTS.map((event) => event.month))];
  const requests = await Promise.allSettled(
    months.map((month) => fetchHijriMonth({ hijriYear, hijriMonth: month, latitude, longitude })),
  );
  const byMonth = new Map<number, HijriDay[]>();
  requests.forEach((result, index) => {
    if (result.status === "fulfilled") byMonth.set(months[index], result.value);
  });

  const candidates: EventCandidate[] = [];
  const nextYearMonths = new Set<number>();
  for (const definition of ISLAMIC_EVENTS) {
    const monthDays = byMonth.get(definition.month);
    if (!monthDays || monthDays.length === 0) continue;
    const match = monthDays.find((day) => day.hDay === definition.day);
    if (!match) continue;
    if (daysBetweenKeys(todayKey, match.dateKey) < 0) {
      nextYearMonths.add(definition.month);
    } else {
      candidates.push({ definition, monthDays, hijriYear });
    }
  }

  if (nextYearMonths.size > 0) {
    const nextRequests = await Promise.allSettled(
      [...nextYearMonths].map((month) =>
        fetchHijriMonth({ hijriYear: hijriYear + 1, hijriMonth: month, latitude, longitude }),
      ),
    );
    nextRequests.forEach((result, index) => {
      if (result.status !== "fulfilled") return;
      const month = [...nextYearMonths][index];
      const monthDays = result.value;
      for (const definition of ISLAMIC_EVENTS) {
        if (definition.month !== month) continue;
        if (!monthDays.some((day) => day.hDay === definition.day)) continue;
        candidates.push({ definition, monthDays, hijriYear: hijriYear + 1 });
      }
    });
  }

  const events = candidates
    .map((candidate) => buildEvent(candidate, todayKey))
    .filter((event): event is IslamicEvent => event !== null)
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  return limit ? events.slice(0, limit) : events;
}

/** المناسبات الأساسية (العيدان ورمضان) من القائمة الجاهزة. */
export function pickEvent(
  events: IslamicEvent[],
  key: string,
): IslamicEvent | undefined {
  return events.find((event) => event.key === key);
}

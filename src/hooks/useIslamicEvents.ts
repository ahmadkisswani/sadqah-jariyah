import { useEffect, useState } from "react";
import type { IslamicEvent } from "../data/prayer/api";
import { fetchUpcomingEvents } from "../data/prayer/events";
import type { ResolvedLocation } from "../data/prayer/location";

/**
 * المناسبات الإسلامية القادمة من تقويم الخدمة (رمضان، العيدان، عرفة…).
 *
 * تُحمَّل بعد ظهور المواقيت (تحسين تدريجي) وبلا إظهار أخطاء: إن فشلت تختفي
 * البطاقة بهدوء ولا يتعطّل شيء من الصفحة.
 */

type Options = {
  location: ResolvedLocation | null;
  /** السنة الهجرية الحالية من رد المواقيت — لا نحسبها محليًا. */
  hijriYear: number | null;
  todayKey: string;
  enabled?: boolean;
};

export function useIslamicEvents({ location, hijriYear, todayKey, enabled = true }: Options) {
  const [events, setEvents] = useState<IslamicEvent[] | null>(null);
  const [loading, setLoading] = useState(false);

  const latitude = location?.latitude ?? null;
  const longitude = location?.longitude ?? null;

  useEffect(() => {
    if (!enabled || latitude === null || longitude === null || hijriYear === null) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const list = await fetchUpcomingEvents({
          hijriYear,
          latitude,
          longitude,
          todayKey,
        });
        if (!cancelled) setEvents(list);
      } catch {
        if (!cancelled) setEvents(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, latitude, longitude, hijriYear, todayKey]);

  return { events, loading };
}

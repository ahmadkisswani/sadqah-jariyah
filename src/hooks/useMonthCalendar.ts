import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PrayerApiError, fetchMonthCalendar, readAnyCache, type MonthCalendar } from "../data/prayer/api";
import type { ResolvedLocation } from "../data/prayer/location";

/**
 * تقويم شهر ميلادي كامل (مع ما يقابله هجريًا ومناسباته).
 *
 * يُحمَّل الشهر المعروض فقط ويُخزَّن أسبوعًا، وإذا فشل التحديث نُبقي الشهر
 * السابق معروضًا إن كان لنفس الشهر المعروض (بلا بيانات ملفّقة).
 */

type Options = {
  location: ResolvedLocation | null;
  viewYear: number;
  viewMonth: number;
  enabled?: boolean;
};

export function monthCalendarCacheKey(year: number, month: number, location: ResolvedLocation | null): string {
  return `cal:${year}-${month}:${(location?.latitude ?? 0).toFixed(2)}:${(location?.longitude ?? 0).toFixed(2)}`;
}

export function useMonthCalendar({ location, viewYear, viewMonth, enabled = true }: Options) {
  const [calendar, setCalendar] = useState<MonthCalendar | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PrayerApiError | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const forceNextRef = useRef(false);

  const latitude = location?.latitude ?? null;
  const longitude = location?.longitude ?? null;

  useEffect(() => {
    if (!enabled || latitude === null || longitude === null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const force = forceNextRef.current;
      forceNextRef.current = false;
      try {
        const data = await fetchMonthCalendar(
          {
            year: viewYear,
            month: viewMonth,
            latitude,
            longitude,
          },
          { force },
        );
        if (cancelled) return;
        setCalendar(data);
        setError(null);
      } catch (cause) {
        if (cancelled) return;
        const key = monthCalendarCacheKey(viewYear, viewMonth, location);
        const cached = readAnyCache<MonthCalendar>(key);
        setError(cause instanceof PrayerApiError ? cause : new PrayerApiError("network"));
        if (cached) setCalendar(cached);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, latitude, longitude, location, viewYear, viewMonth, refreshToken]);

  const retry = useCallback(() => {
    forceNextRef.current = true;
    setRefreshToken((token) => token + 1);
  }, []);

  /** هل البيانات المعروضة تخص الشهر المطلوب فعلًا؟ */
  const isCurrent = useMemo(
    () => Boolean(calendar && calendar.year === viewYear && calendar.month === viewMonth),
    [calendar, viewYear, viewMonth],
  );

  return { calendar, loading, error, retry, isCurrent };
}

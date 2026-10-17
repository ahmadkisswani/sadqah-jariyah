import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PrayerApiError,
  dayTimingsCacheKey,
  fetchDayTimings,
  readAnyCache,
  shiftDateKey,
  type DayTimings,
  type DayTimingsParams,
  type TuneMap,
} from "../data/prayer/api";
import type { ResolvedLocation } from "../data/prayer/location";
import type { HighLatitudeSetting } from "../data/prayer/methods";
import type { PrayerSettings } from "./usePrayerSettings";

/**
 * مواقيت ثلاثة أيام: أمس واليوم وغدًا.
 *
 * لماذا ثلاثة؟
 * - "اليوم" للجدول والعدّ التنازلي.
 * - "غدًا" لفجر ما بعد العشاء.
 * - "أمس" لمعرفة أننا داخل نافذة العشاء قبل فجر اليوم.
 *
 * الطلب لا يتكرر إلا عند تغيّر يوم/موقع/طريقة/مذهب/تعديلات، وما يتغيّر كل ثانية
 * (العدّ التنازلي) يجري في الواجهة بلا أي طلب شبكة.
 */

export type DayTimingsOptions = {
  location: ResolvedLocation | null;
  methodId: number;
  school: 0 | 1;
  highLatitude: HighLatitudeSetting;
  tune: TuneMap;
  /** مفتاح اليوم في منطقة الموقع (YYYY-MM-DD). */
  todayKey: string;
  enabled?: boolean;
};

export type PrayerTimesState = {
  /** الأيام المتوفّرة حاليًا (بين يوم وأمس وثلاثة أيام). */
  days: DayTimings[];
  yesterday: DayTimings | null;
  today: DayTimings | null;
  tomorrow: DayTimings | null;
  loading: boolean;
  error: PrayerApiError | null;
  /** تُعرض بيانات محفوظة قديمة لأن التحديث فشل. */
  stale: boolean;
  retry: () => void;
  /** مواقيت يوم معيّن عند الطلب (لنافذة تفاصيل اليوم في التقويم). */
  loadDay: (dateKey: string) => Promise<DayTimings>;
};

function toApiError(reason: unknown): PrayerApiError {
  return reason instanceof PrayerApiError ? reason : new PrayerApiError("network");
}

export function usePrayerTimes(options: DayTimingsOptions): PrayerTimesState {
  const { location, methodId, school, highLatitude, tune, todayKey, enabled = true } = options;
  const [days, setDays] = useState<DayTimings[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PrayerApiError | null>(null);
  const [stale, setStale] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const forceNextRef = useRef(false);

  const tuneKey = useMemo(
    () => [tune.fajr, tune.dhuhr, tune.asr, tune.maghrib, tune.isha].map((v) => v ?? 0).join("."),
    [tune],
  );
  const latitude = location?.latitude ?? null;
  const longitude = location?.longitude ?? null;

  const paramsFor = useCallback(
    (dateKey: string): DayTimingsParams | null => {
      if (latitude === null || longitude === null) return null;
      return { latitude, longitude, dateKey, methodId, school, highLatitude, tune };
    },
    // tune يتغيّر مرجعيًا؛ نعتمد على tuneKey لتفادي إعادة الإنشاء بلا داعٍ
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [latitude, longitude, methodId, school, highLatitude, tuneKey],
  );

  useEffect(() => {
    if (!enabled || latitude === null || longitude === null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const keys = [shiftDateKey(todayKey, -1), todayKey, shiftDateKey(todayKey, 1)];
    const params = keys
      .map((key) => paramsFor(key))
      .filter((value): value is DayTimingsParams => value !== null);

    (async () => {
      const force = forceNextRef.current;
      forceNextRef.current = false;
      const results = await Promise.allSettled(
        params.map((item) => fetchDayTimings(item, { force })),
      );
      if (cancelled) return;

      const loaded: DayTimings[] = [];
      results.forEach((result) => {
        if (result.status === "fulfilled") loaded.push(result.value);
      });

      const hasToday = loaded.some((day) => day.dateKey === todayKey);
      if (hasToday) {
        // نكمّل الأيام الناقصة من التخزين القديم إن وُجد (بلا ادّعاء حداثة).
        for (const item of params) {
          if (loaded.some((day) => day.dateKey === item.dateKey)) continue;
          const cached = readAnyCache<DayTimings>(dayTimingsCacheKey(item));
          if (cached) loaded.push(cached);
        }
        setDays(loaded);
        setLoading(false);
        setStale(results.some((result) => result.status === "rejected"));
        return;
      }

      // فشل "اليوم" نفسه — نعرض ما حُفظ سابقًا إن وُجد.
      const fallbacks = params
        .map((item) => readAnyCache<DayTimings>(dayTimingsCacheKey(item)))
        .filter((value): value is DayTimings => value !== null);
      if (fallbacks.some((day) => day.dateKey === todayKey)) {
        setDays(fallbacks);
        setLoading(false);
        setStale(true);
        return;
      }

      setDays([]);
      setLoading(false);
      setError(toApiError(results[1]?.status === "rejected" ? results[1].reason : undefined));
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, latitude, longitude, paramsFor, todayKey, refreshToken]);

  const retry = useCallback(() => {
    forceNextRef.current = true;
    setRefreshToken((token) => token + 1);
  }, []);

  const loadDay = useCallback(
    (dateKey: string) => {
      const item = paramsFor(dateKey);
      if (!item) return Promise.reject(new PrayerApiError("invalid"));
      return fetchDayTimings(item);
    },
    [paramsFor],
  );

  const byKey = useMemo(() => new Map(days.map((day) => [day.dateKey, day])), [days]);
  const yesterday = byKey.get(shiftDateKey(todayKey, -1)) ?? null;
  const today = byKey.get(todayKey) ?? null;
  const tomorrow = byKey.get(shiftDateKey(todayKey, 1)) ?? null;

  return { days, yesterday, today, tomorrow, loading, error, stale, retry, loadDay };
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  describeMosqueError,
  searchMosques,
  type MosqueSearchResult,
} from "../data/mosques/api";
import type { Coordinates } from "../utils/geo";

/**
 * حالة البحث عن المساجد القريبة.
 * لا يبدأ أي طلب تلقائيًا؛ البحث لا يحدث إلا باستدعاء `search` من زر صريح.
 */
export function useMosques(
  location: Coordinates | null,
  radiusKm: number,
) {
  const [result, setResult] = useState<MosqueSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const latitude = location?.latitude ?? null;
  const longitude = location?.longitude ?? null;

  // تغيير الموقع أو نصف القطر يجعل النتائج السابقة غير مطابقة — نمسحها.
  useEffect(() => {
    requestRef.current += 1;
    setResult(null);
    setError(null);
    setLoading(false);
  }, [latitude, longitude, radiusKm]);

  const search = useCallback(
    async (options: { force?: boolean } = {}) => {
      if (!location) {
        setError("لم يُحدَّد موقع بعد.");
        return;
      }
      const token = ++requestRef.current;
      setLoading(true);
      setError(null);
      try {
        const next = await searchMosques(location, radiusKm, options);
        if (token !== requestRef.current) return;
        setResult(next);
      } catch (cause) {
        if (token !== requestRef.current) return;
        setResult(null);
        setError(describeMosqueError(cause));
      } finally {
        if (token === requestRef.current) setLoading(false);
      }
    },
    [location, radiusKm],
  );

  return { result, loading, error, search };
}

import { useEffect, useState } from "react";

/**
 * ساعة حيّة تُعيد الوقت الحالي كل فترة (افتراضيًا كل ثانية).
 *
 * تتوقّف عن العمل عند إخفاء التبويب وتُزامن نفسها فور العودة — لتوفير البطارية
 * دون أن يظهر عدّاد متأخر عن الوقت الحقيقي.
 */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;

    let timer: number | null = null;
    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    const start = () => {
      stop();
      timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    };
    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        setNow(Date.now());
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, enabled]);

  return now;
}

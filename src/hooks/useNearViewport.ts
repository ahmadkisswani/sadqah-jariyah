import { useCallback, useEffect, useState } from "react";

/**
 * يرصد اقتراب عنصر من إطار العرض (بهامش اختياري) لتحميل الأقسام الثقيلة
 * عند الحاجة فقط. يبقى true بعد أول ظهور حتى لا نعيد الطلب عند التمرير.
 *
 * نستخدم callback ref لا useRef: القسم قد يُركَّب بعد اكتمال تحميل الموقع،
 * وبالتالي يجب إعادة تشغيل المراقب عند تغيّر العنصر نفسه.
 */
export function useNearViewport<T extends HTMLElement>(rootMargin = "280px") {
  const [element, setElement] = useState<T | null>(null);
  const [near, setNear] = useState(false);
  const ref = useCallback((node: T | null) => setElement(node), []);

  useEffect(() => {
    if (near || !element) return;

    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [element, near, rootMargin]);

  return { ref, near };
}

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GeolocationError,
  approximateLocationFromIp,
  coordinatesText,
  geolocationEnvironment,
  getGeolocationPermission,
  isAppleMobile,
  requestPrecisePosition,
  resolveLocationNames,
  type LocationNames,
  type ResolvedLocation,
} from "../data/prayer/location";
import type { ManualCity } from "../data/prayer/locations";
import { STRINGS } from "../data/prayer/labels";
import { areCoordinatesValid } from "../utils/prayer";
import type { PrayerSettings } from "./usePrayerSettings";

/**
 * تحديد موقع المستخدم بأولويات واضحة:
 *   GPS (إن سُمح) ← موقع محفوظ ← موقع تقريبي حسب الشبكة ← اختيار يدوي.
 *
 * لا نُفاجئ الزائر بنافذة إذن فور فتح الصفحة: إن كان الإذن ممنوحًا مسبقًا
 * نأخذه مباشرة، وإلا نعرض له بطاقة ودّية فيها زر "استخدم موقعي الدقيق" مع
 * عرض مواقيت تقريبية حتى يقرّر — أو اختيار مدينته يدويًا.
 */

export type LocationStatus = "resolving" | "ready" | "approximate" | "denied" | "missing";
export type GeolocationPermission = "granted" | "denied" | "prompt" | "unknown";

/** نص رفض الإذن — على iPhone نضيف مسار تمكينه من إعدادات النظام. */
function deniedNotice(): string {
  return isAppleMobile() ? STRINGS.locationDeniedIos.ar : STRINGS.locationDenied.ar;
}

type Options = {
  location: ResolvedLocation | null;
  onChange: (patch: Partial<PrayerSettings>) => void;
};

export function useLocationResolver({ location, onChange }: Options) {
  const [status, setStatus] = useState<LocationStatus>(location ? "ready" : "resolving");
  const [permission, setPermission] = useState<GeolocationPermission>("unknown");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** رمز كل محاولة — أي محاولة أحدث تُلغي ما قبلها (نتفادى تحديثات قديمة). */
  const tokenRef = useRef(0);
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  /** يحاول الموقع الدقيق. يفشل بصمت (إلا إن طلبنا إظهار الخطأ) ويُعيد النجاح/الفشل. */
  const resolveGps = useCallback(
    async (showErrors: boolean, token: number): Promise<boolean> => {
      try {
        const coords = await requestPrecisePosition();
        let names: LocationNames | null = null;
        try {
          names = await resolveLocationNames(coords.latitude, coords.longitude);
        } catch {
          names = null;
        }
        if (token !== tokenRef.current) return true;

        onChange({
          location: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            city: names?.city ?? coordinatesText(coords.latitude, coords.longitude),
            cityEn: names?.cityEn ?? coordinatesText(coords.latitude, coords.longitude),
            country: names?.country ?? "",
            countryEn: names?.countryEn ?? "",
            countryCode: names?.countryCode ?? "",
            source: "gps",
            savedAt: Date.now(),
          },
        });
        setStatus("ready");
        setNotice(null);
        setPermission("granted");
        return true;
      } catch (error) {
        if (token !== tokenRef.current) return false;
        if (error instanceof GeolocationError && error.kind === "denied") {
          setPermission("denied");
          if (showErrors) setNotice(deniedNotice());
        } else if (error instanceof GeolocationError && error.kind === "insecure") {
          if (showErrors) setNotice(STRINGS.locationInsecure.ar);
        } else if (showErrors) {
          setNotice(STRINGS.locationUnavailable.ar);
        }
        return false;
      }
    },
    [onChange],
  );

  /** الدورة الكاملة: محفوظ ← GPS ← تقريبي ← يحتاج اختيارًا يدويًا. */
  const bootstrap = useCallback(async () => {
    const token = ++tokenRef.current;
    const saved = locationRef.current;

    const currentPermission = await getGeolocationPermission();
    if (token !== tokenRef.current) return;
    setPermission(currentPermission);

    // اختيار يدوي سابق: نحترمه ولا نتجاوزه بالـ GPS.
    if (saved?.source === "manual") {
      setStatus("ready");
      setNotice(null);
      return;
    }

    if (currentPermission === "granted") {
      const ok = await resolveGps(false, token);
      if (ok || token !== tokenRef.current) return;
    }

    if (!saved) {
      const approximate = await approximateLocationFromIp();
      if (token !== tokenRef.current) return;
      if (approximate) {
        onChange({ location: approximate });
        setStatus("approximate");
        setNotice(currentPermission === "denied" ? deniedNotice() : null);
        return;
      }
    }

    if (saved) {
      setStatus(saved.source === "ip" ? "approximate" : "ready");
      setNotice(saved.source === "ip" && currentPermission === "denied" ? deniedNotice() : null);
      return;
    }

    if (currentPermission === "denied") {
      setStatus("denied");
      setNotice(deniedNotice());
    } else {
      setStatus("missing");
      setNotice(STRINGS.locationUnavailable.ar);
    }
  }, [onChange, resolveGps]);

  useEffect(() => {
    void bootstrap();
    // الرمز يضمن أن المحاولة الأقدم (مثل تشغيل مزدوج في وضع التطوير) لا تؤثر.
  }, [bootstrap]);

  /** زر "استخدم موقعي الدقيق" — بضغطة صريحة من المستخدم. */
  const requestPrecise = useCallback(async () => {
    setBusy(true);
    setStatus("resolving");
    // رسالة تقدّم واضحة: قد تستغرق أول محاولة على الجوال ثوانٍ حتى تُظهر النافذة/الإصلاح
    setNotice(STRINGS.locatingNow.ar);
    const token = ++tokenRef.current;
    const ok = await resolveGps(true, token);
    setBusy(false);
    if (ok) return;

    const saved = locationRef.current;
    if (saved) {
      setStatus(saved.source === "ip" ? "approximate" : "ready");
      return;
    }
    const currentPermission = await getGeolocationPermission();
    setPermission(currentPermission);
    if (currentPermission === "denied") {
      setStatus("denied");
      setNotice(deniedNotice());
    } else {
      setStatus("missing");
      setNotice(STRINGS.locationUnavailable.ar);
    }
  }, [resolveGps]);

  /** اختيار مدينة من القائمة الجاهزة. */
  const useManualCity = useCallback(
    (city: ManualCity) => {
      tokenRef.current += 1;
      onChange({
        location: {
          latitude: city.latitude,
          longitude: city.longitude,
          city: city.city,
          cityEn: city.cityEn,
          country: city.country,
          countryEn: city.countryEn,
          countryCode: city.countryCode,
          source: "manual",
          savedAt: Date.now(),
        },
      });
      setStatus("ready");
      setNotice(null);
    },
    [onChange],
  );

  /** إحداثيات يدوية (تُتحقَّق قبل الحفظ، ثم تُترجم إلى مدينة إن أمكن). */
  const useCoordinates = useCallback(
    async (latitude: number, longitude: number): Promise<boolean> => {
      if (!areCoordinatesValid(latitude, longitude)) return false;
      setBusy(true);
      let names: LocationNames | null = null;
      try {
        names = await resolveLocationNames(latitude, longitude);
      } catch {
        names = null;
      }
      setBusy(false);
      onChange({
        location: {
          latitude,
          longitude,
          city: names?.city ?? coordinatesText(latitude, longitude),
          cityEn: names?.cityEn ?? coordinatesText(latitude, longitude),
          country: names?.country ?? "",
          countryEn: names?.countryEn ?? "",
          countryCode: names?.countryCode ?? "",
          source: "manual",
          savedAt: Date.now(),
        },
      });
      setStatus("ready");
      setNotice(null);
      return true;
    },
    [onChange],
  );

  return {
    status,
    permission,
    notice,
    busy,
    requestPrecise,
    useManualCity,
    useCoordinates,
    retry: bootstrap,
  };
}

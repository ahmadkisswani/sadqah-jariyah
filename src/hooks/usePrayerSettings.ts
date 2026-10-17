import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { HighLatitudeSetting } from "../data/prayer/methods";
import type { ResolvedLocation } from "../data/prayer/location";
import type { Lang, ObligatoryPrayerKey } from "../data/prayer/labels";
import type { TimeFormat } from "../utils/prayer";

/**
 * إعدادات قسم المواقيت — محفوظة في هذا الجهاز فقط (لا خادم ولا حساب).
 *
 * تتغيّر بها: الموقع، طريقة الحساب (أو "تلقائي حسب الدولة")، مذهب العصر، قاعدة
 * خطوط العرض العالية، صيغة الوقت، اللغة، وتعديلات الدقائق الاختيارية.
 */

export type PrayerTune = Record<ObligatoryPrayerKey, number>;

export type PrayerSettings = {
  location: ResolvedLocation | null;
  /** null = تلقائي حسب دولة الموقع. */
  methodId: number | null;
  /** 0 = الشافعي/المعتمد، 1 = الحنفي. */
  school: 0 | 1;
  highLatitude: HighLatitudeSetting;
  timeFormat: TimeFormat;
  lang: Lang;
  /** تعديلات يدوية بالدقائق لكل صلاة (اختيارية، -٣٠..٣٠). */
  tune: PrayerTune;
};

export const DEFAULT_PRAYER_SETTINGS: PrayerSettings = {
  location: null,
  methodId: null,
  school: 0,
  highLatitude: "auto",
  timeFormat: "12",
  lang: "ar",
  tune: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
};

const STORAGE_KEY = "sj-prayer-settings";
const TUNE_LIMIT = 30;

/** تطبيع الإعدادات المحفوظة (حماية من قيم قديمة أو معدّلة يدويًا). */
function normalizeSettings(stored: PrayerSettings): PrayerSettings {
  const tune = stored?.tune ?? DEFAULT_PRAYER_SETTINGS.tune;
  const clamp = (value: unknown) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(-TUNE_LIMIT, Math.min(TUNE_LIMIT, Math.round(number)));
  };
  return {
    location: stored?.location ?? null,
    methodId:
      typeof stored?.methodId === "number" && Number.isFinite(stored.methodId)
        ? stored.methodId
        : null,
    school: stored?.school === 1 ? 1 : 0,
    highLatitude: [1, 2, 3].includes(Number(stored?.highLatitude))
      ? (Number(stored.highLatitude) as 1 | 2 | 3)
      : "auto",
    timeFormat: stored?.timeFormat === "24" ? "24" : "12",
    lang: stored?.lang === "en" ? "en" : "ar",
    tune: {
      fajr: clamp(tune.fajr),
      dhuhr: clamp(tune.dhuhr),
      asr: clamp(tune.asr),
      maghrib: clamp(tune.maghrib),
      isha: clamp(tune.isha),
    },
  };
}

export function usePrayerSettings() {
  const [stored, setStored] = useLocalStorage<PrayerSettings>(
    STORAGE_KEY,
    DEFAULT_PRAYER_SETTINGS,
  );

  const settings = useMemo(() => normalizeSettings(stored), [stored]);

  const update = useCallback(
    (patch: Partial<PrayerSettings>) => {
      setStored((previous) => normalizeSettings({ ...previous, ...patch } as PrayerSettings));
    },
    [setStored],
  );

  const reset = useCallback(() => {
    setStored(DEFAULT_PRAYER_SETTINGS);
  }, [setStored]);

  return { settings, update, reset };
}

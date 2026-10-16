import { useMemo } from "react";
import { pickDaily, formatArabicDate } from "../utils/arabic";
import { dailyAyahs, type DailyAyah } from "../data/daily/ayats";
import { dailyAdhkar, type DailyDhikr } from "../data/daily/adhkar";
import { dailyDuas, type DailyDua } from "../data/daily/duas";
import { dailyReminders } from "../data/daily/reminders";

export type DailyContent = {
  dateLabel: string;
  ayah: DailyAyah;
  dhikr: DailyDhikr;
  dua: DailyDua;
  reminder: string;
  /** لتمييز "اكتمل الورد" محليًا عن غيره من الأيام */
  dayKey: string;
};

/**
 * محرك المحتوى اليومي الثابت: نفس المحتوى للجميع في نفس اليوم، بلا خادم،
 * ويعمل دون اتصال. يعتمد فهرسة اليوم في السنة على قوائم المحتوى.
 */
export function useDailyContent(): DailyContent {
  return useMemo(() => {
    const now = new Date();
    return {
      dateLabel: formatArabicDate(now),
      ayah: pickDaily(dailyAyahs, now),
      dhikr: pickDaily(dailyAdhkar, now),
      dua: pickDaily(dailyDuas, now),
      reminder: pickDaily(dailyReminders, now),
      dayKey: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
    };
  }, []);
}

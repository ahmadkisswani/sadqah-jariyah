const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

/** يحوّل الأرقام إلى أرقام عربية هندية (٠١٢…). */
export function toArabicNumber(value: number | string): string {
  return String(value)
    .split("")
    .map((ch) => (/\d/.test(ch) ? AR_DIGITS[Number(ch)] : ch))
    .join("");
}

/** رقم اليوم في السنة الميلادية (1..366) — أساس محرك المحتوى اليومي الثابت. */
export function dayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/** تُعيد عنصرًا ثابتًا لنفس اليوم، للجميع حسب التواريخ المحلية. */
export function pickDaily<T>(items: T[], date: Date = new Date()): T {
  if (items.length === 0) throw new Error("pickDaily: empty list");
  return items[dayOfYear(date) % items.length];
}

/** تاريخ اليوم بصيغة عربية للعرض في ورد اليوم. */
export function formatArabicDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

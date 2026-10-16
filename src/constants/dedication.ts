/**
 * الأسماء المكرَّس لها هذا العمل — المصدر الوحيد لهذه الثوابت في كامل المشروع.
 * يجب أن يظهر الاسمان في: الرئيسية، التذييل، المشاركة، وصفحات الأقسام، وبيانات الموقع.
 */
export const DEDICATED_PEOPLE = ["توبة عبد العزيز الجربوعه", "محمد احمد مسلم"] as const;

export const DEDICATION_NOTE = "اهداء من: أسماء محمد مسلم وولدها";

export const PROJECT_NAME = "صدقة جارية";

export const DEDICATION_BLOCK = `صدقة جارية عن\n${DEDICATED_PEOPLE[0]}\n${DEDICATED_PEOPLE[1]}\n\n${DEDICATION_NOTE}`;

/** يضيف كتلة الوقف إلى أي نص مشاركة. */
export function withDedication(text: string): string {
  return `${text}\n\n${DEDICATION_BLOCK}`;
}

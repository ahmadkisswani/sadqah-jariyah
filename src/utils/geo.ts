/**
 * أدوات جغرافية بحتة (بلا شبكة ولا حالة React):
 * المسافات، اتجاه القبلة، وتنعيم اتجاه البوصلة.
 *
 * اتجاه القبلة يُحسب بالمعادلة الكروية المعروفة (initial great-circle bearing)
 * من إحداثيات المستخدم إلى إحداثيات الكعبة. النتيجة بالدرجات من الشمال الحقيقي
 * (0° = شمال، 90° = شرق، 180° = جنوب، 270° = غرب).
 */

import { toArabicNumber } from "./arabic";

export type Coordinates = { latitude: number; longitude: number };

/** إحداثيات الكعبة (المسجد الحرام) — تُستخدم لحساب القبلة فقط. */
export const KAABA: Coordinates = { latitude: 21.422487, longitude: 39.826206 };

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const EARTH_RADIUS_KM = 6371.0088;

const toRad = (degrees: number) => degrees * DEG_TO_RAD;
const toDeg = (radians: number) => radians * RAD_TO_DEG;

/** تطبيع زاوية إلى المدى [0, 360). */
export function normalizeDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) return 0;
  return ((degrees % 360) + 360) % 360;
}

/** المسافة الكبرى بين نقطتين بالكيلومترات (haversine). */
export function haversineDistanceKm(from: Coordinates, to: Coordinates): number {
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLat = lat2 - lat1;
  const dLon = toRad(to.longitude) - toRad(from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** الاتجاه الابتدائي من نقطة إلى أخرى بالدرجات من الشمال. */
export function initialBearing(from: Coordinates, to: Coordinates): number {
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return normalizeDegrees(toDeg(Math.atan2(y, x)));
}

/** اتجاه القبلة من موقع المستخدم. */
export function qiblaBearing(from: Coordinates): number {
  return initialBearing(from, KAABA);
}

/** المسافة إلى الكعبة بالكيلومترات. */
export function distanceToKaaba(from: Coordinates): number {
  return haversineDistanceKm(from, KAABA);
}

/**
 * تنعيم اتجاه البوصلة لتقليل الاهتزاز، مع احترام عبور الشمال (359° ← 1°).
 * factor بين 0 و1: الأعلى أسرع استجابة والأدنى أنعم.
 */
export function smoothHeading(
  previous: number | null,
  next: number,
  factor = 0.18,
): number {
  if (previous === null || !Number.isFinite(previous)) return normalizeDegrees(next);
  const safeFactor = Math.min(1, Math.max(0.01, factor));
  const delta = ((next - previous + 540) % 360) - 180;
  return normalizeDegrees(previous + delta * safeFactor);
}

type OrientationLike = {
  alpha?: number | null;
  absolute?: boolean | null;
  webkitCompassHeading?: number | null;
};

/**
 * استخراج اتجاه الجهاز من حدث DeviceOrientation.
 *
 * - iOS يوفّر webkitCompassHeading (اتجاه مطلق جاهز).
 * - أندرويد يوفّر alpha؛ ولا يصلح إلا إذا كان الحدث مطلقًا (absolute).
 * - الاتجاه النسبي غير المطلق لا يكفي لقول "الشمال" — نعيد null بدل التخمين.
 */
export function headingFromOrientation(event: OrientationLike): number | null {
  const webkit = event.webkitCompassHeading;
  if (typeof webkit === "number" && Number.isFinite(webkit) && webkit >= 0) {
    return normalizeDegrees(webkit);
  }
  if (event.absolute !== true) return null;
  const alpha = event.alpha;
  if (typeof alpha !== "number" || !Number.isFinite(alpha)) return null;
  return normalizeDegrees(360 - alpha);
}

/** تعديل اتجاه الجهاز حسب دوران الشاشة (وضع أفقي مثلًا). */
export function adjustHeadingForScreen(heading: number, screenAngle: number): number {
  return normalizeDegrees(heading + screenAngle);
}

/** وصف تقريبي للاتجاه (شمال، شمال شرق...) — للعرض المساعد فقط. */
export function compassDirection(degrees: number, lang: "ar" | "en" = "ar"): string {
  const names =
    lang === "ar"
      ? ["شمال", "شمال شرق", "شرق", "جنوب شرق", "جنوب", "جنوب غرب", "غرب", "شمال غرب"]
      : ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(normalizeDegrees(degrees) / 45) % 8;
  return names[index];
}

/** صياغة المسافة للعرض: أقل من كيلومتر بالأمتار، وإلا بمنزلة عشرية واحدة. */
export function formatDistance(km: number, lang: "ar" | "en" = "ar"): string {
  if (!Number.isFinite(km) || km < 0) return "";
  if (km < 1) {
    const meters = Math.max(10, Math.round((km * 1000) / 10) * 10);
    return lang === "ar" ? `${toArabicNumber(meters)} م` : `${meters} m`;
  }
  const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
  return lang === "ar" ? `${toArabicNumber(rounded)} كم` : `${rounded} km`;
}

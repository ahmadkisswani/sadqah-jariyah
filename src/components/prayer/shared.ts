import type { SvgIconComponent } from "@mui/icons-material";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import NightlightRoundIcon from "@mui/icons-material/NightlightRound";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import WbCloudyIcon from "@mui/icons-material/WbCloudy";
import WbTwilightIcon from "@mui/icons-material/WbTwilight";
import type { ObligatoryPrayerKey } from "../../data/prayer/labels";

/** عناصر مشتركة صغيرة لقسم المواقيت (لا مكوّن مستقل لها). */

/**
 * إخفاء بصري مع إتاحة القارئ الشاشي.
 *
 * القيم مكتوبة بوحدات صريحة ("1px" لا 1) لأن MUI يحوّل الأرقام: `width: 1`
 * تصبح 100%، و`margin: -1` تصبح -8px (من theme.spacing) — وهو ما يجعل الصندوق
 * يمتدّ على كامل عرض الصفحة ويسبّب تمريرًا أفقيًا.
 */
export const srOnly = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

/** أيقونة لكل صلاة (أشكال متمايزة حتى مع ضعف التمييز اللوني). */
export const PRAYER_ICONS: Record<ObligatoryPrayerKey, SvgIconComponent> = {
  fajr: NightsStayIcon,
  dhuhr: WbSunnyIcon,
  asr: WbCloudyIcon,
  maghrib: WbTwilightIcon,
  isha: NightlightRoundIcon,
};

/** أرقام ثابتة العرض حتى لا \"ترتجف\" الواجهة مع كل ثانية. */
export const TABULAR_NUMBERS = { fontVariantNumeric: "tabular-nums" } as const;

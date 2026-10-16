import HomeIcon from "@mui/icons-material/Home";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AdjustIcon from "@mui/icons-material/Adjust";
import HealingIcon from "@mui/icons-material/Healing";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

export type NavItem = {
  label: string;
  to: string;
  icon: SvgIconComponent;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "الرئيسية", to: "/", icon: HomeIcon },
  { label: "القرآن الكريم", to: "/quran", icon: MenuBookIcon },
  { label: "الأذكار", to: "/azkar", icon: AutoStoriesIcon },
  { label: "الأدعية", to: "/duas", icon: FavoriteIcon },
  { label: "التسبيح", to: "/tasbeeh", icon: AdjustIcon },
  { label: "الرقية الشرعية", to: "/ruqyah", icon: HealingIcon },
  { label: "ورد اليوم", to: "/daily", icon: WbSunnyOutlinedIcon },
  { label: "عن الموقع", to: "/about", icon: InfoOutlinedIcon },
];

/** عناصر شريط التنقل السفلي (الجوال) — الأقسام الأكثر استخدامًا + المزيد. */
export const BOTTOM_NAV_ITEMS: NavItem[] = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[4],
];

export const BOOKMARKS_ITEM: NavItem = { label: "المحفوظات", to: "/bookmarks", icon: BookmarksIcon };

/** البحث عن عنصر تنقّل مطابق للمسار الحالي. */
export function isActivePath(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

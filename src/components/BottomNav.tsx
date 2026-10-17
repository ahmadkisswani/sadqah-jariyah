import { useState } from "react";
import { BottomNavigation, BottomNavigationAction, Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Paper, useMediaQuery, useTheme } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { BOTTOM_NAV_ITEMS, NAV_ITEMS, BOOKMARKS_ITEM, isActivePath } from "./navItems";

/**
 * شريط تنقّل سفلي بأسلوب Material للجوال — الأقسام الأساسية + "المزيد".
 * يظهر فقط تحت عرض lg حتى لا يزاحم سطح المكتب.
 */
export function BottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!isMobile) return null;

  const moreItems = NAV_ITEMS.filter(
    (i) => !BOTTOM_NAV_ITEMS.some((b) => b.to === i.to),
  );

  // نحدد القيمة المحددة؛ "المزيد" محدد إن كان المسار ضمن عناصر المزيد أو المحفوظات
  const moreActive =
    moreItems.some((i) => isActivePath(pathname, i.to)) ||
    isActivePath(pathname, BOOKMARKS_ITEM.to);
  const selected = moreActive ? 4 : BOTTOM_NAV_ITEMS.findIndex((i) => isActivePath(pathname, i.to));

  return (
    <>
      <Paper
        component="nav"
        aria-label="التنقل السريع"
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxWidth: "100vw",
          overflowX: "hidden",
          zIndex: (t) => t.zIndex.appBar,
          borderTop: "1px solid",
          borderColor: "divider",
          borderRadius: 0,
          pb: "env(safe-area-inset-bottom)",
        }}
      >
        <BottomNavigation
          showLabels
          value={selected < 0 ? 0 : selected}
          onChange={(_e, value: number) => {
            if (value === 4) setMoreOpen(true);
            else navigate(BOTTOM_NAV_ITEMS[value].to);
          }}
          sx={{
            height: 62,
            // نسمح للأزرار بالانضغاط على الجوالات الضيّقة فلا يزيد الشريط عن عرض الشاشة
            "& .MuiBottomNavigationAction-root": { minWidth: 0, px: 0.25, overflow: "hidden" },
            "& .MuiBottomNavigationAction-label": {
              whiteSpace: "nowrap",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          }}
        >
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return <BottomNavigationAction key={item.to} label={item.label} icon={<Icon />} />;
          })}
          <BottomNavigationAction label="المزيد" icon={<MoreHorizIcon />} />
        </BottomNavigation>
      </Paper>

      <Drawer
        anchor="right"
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        PaperProps={{ sx: { width: 300, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 } }}
      >
        <List sx={{ px: 1.5, pt: 2 }}>
          {[...moreItems, BOOKMARKS_ITEM].map((item) => {
            const Icon = item.icon;
            return (
              <ListItemButton
                key={item.to}
                component={RouterLink}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                sx={{ borderRadius: 2, mb: 0.5, minHeight: 52 }}
              >
                <ListItemIcon sx={{ minWidth: 42, color: "text.secondary" }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            );
          })}
        </List>
        <Box sx={{ height: "env(safe-area-inset-bottom)" }} />
      </Drawer>
    </>
  );
}

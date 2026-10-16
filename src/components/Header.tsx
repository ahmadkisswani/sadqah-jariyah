import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { NAV_ITEMS, BOOKMARKS_ITEM, isActivePath } from "./navItems";
import { IslamicPattern } from "./IslamicPattern";
import { PROJECT_NAME, DEDICATED_PEOPLE } from "../constants/dedication";

type Props = { mode: "light" | "dark"; onToggleMode: () => void };

export function Header({ mode, onToggleMode }: Props) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const ModeIcon = mode === "dark" ? LightModeIcon : DarkModeIcon;
  const modeLabel = mode === "dark" ? "الوضع الفاتح" : "الوضع الداكن";

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: { xs: 60, md: 70 } }}>
          {/* زر القائمة للجوال */}
          {!isDesktop && (
            <IconButton
              edge="start"
              aria-label="فتح قائمة التنقل"
              onClick={() => setDrawerOpen(true)}
              size="large"
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* الشعار */}
          <Box
            component={RouterLink}
            to="/"
            aria-label={`${PROJECT_NAME} — الصفحة الرئيسية`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              textDecoration: "none",
              color: "inherit",
              flexGrow: isDesktop ? 0 : 1,
              ml: 1,
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 38,
                height: 38,
                borderRadius: "12px",
                bgcolor: "primary.main",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <LogoMark />
            </Box>
            <Box sx={{ lineHeight: 1.15, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 800, color: "primary.main", whiteSpace: "nowrap" }}
              >
                {PROJECT_NAME}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: { xs: "none", sm: "block" }, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 260 }}
              >
                عن {DEDICATED_PEOPLE[0]} و{DEDICATED_PEOPLE[1]}
              </Typography>
            </Box>
          </Box>

          {/* تنقّل سطح المكتب */}
          {isDesktop && (
            <Box component="nav" aria-label="التنقل الرئيسي" sx={{ flexGrow: 1, display: "flex", gap: 0.5, justifyContent: "center", flexWrap: "wrap" }}>
              {NAV_ITEMS.map((item) => {
                const active = isActivePath(pathname, item.to);
                return (
                  <Button
                    key={item.to}
                    component={RouterLink}
                    to={item.to}
                    color="inherit"
                    aria-current={active ? "page" : undefined}
                    sx={{
                      py: 1,
                      px: 1.5,
                      fontWeight: active ? 800 : 600,
                      color: active ? "primary.main" : "text.secondary",
                      position: "relative",
                      "&::after": active
                        ? {
                            content: '""',
                            position: "absolute",
                            bottom: 2,
                            right: "50%",
                            transform: "translateX(50%)",
                            width: "46%",
                            height: 3,
                            borderRadius: 2,
                            bgcolor: "secondary.main",
                          }
                        : {},
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}

          <Box sx={{ flexGrow: isDesktop ? 0 : 1 }} />

          <Tooltip title={modeLabel}>
            <IconButton onClick={onToggleMode} aria-label={modeLabel} color="primary" size="large">
              <ModeIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* درج الجوال */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 300, borderLeft: "1px solid", borderColor: "divider" } }}
      >
        <Box sx={{ position: "relative", overflow: "hidden" }}>
          <IslamicPattern opacity={0.05} />
          <Toolbar sx={{ justifyContent: "space-between" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
              {PROJECT_NAME}
            </Typography>
            <IconButton aria-label="إغلاق القائمة" onClick={() => setDrawerOpen(false)} size="large">
              <CloseIcon />
            </IconButton>
          </Toolbar>

          <List sx={{ px: 1.5 }}>
            {[...NAV_ITEMS, BOOKMARKS_ITEM].map((item) => {
              const active = isActivePath(pathname, item.to);
              const Icon = item.icon;
              return (
                <ListItemButton
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  selected={active}
                  onClick={() => setDrawerOpen(false)}
                  aria-current={active ? "page" : undefined}
                  sx={{ borderRadius: 2, mb: 0.5, minHeight: 52 }}
                >
                  <ListItemIcon sx={{ minWidth: 42, color: active ? "primary.main" : "text.secondary" }}>
                    <Icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: active ? 800 : 600 }}
                  />
                </ListItemButton>
              );
            })}
          </List>

          <Box sx={{ px: 3, pb: 3, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              عن روح {DEDICATED_PEOPLE[0]} و{DEDICATED_PEOPLE[1]}
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}

/** علامة الشعار: سداسي مبسّط بداخله قوس/هلال — مرسوم محليًا. */
function LogoMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        d="M12 2.5 L19 6.2 V13.8 L12 17.5 L5 13.8 V6.2 Z"
        fill="none"
        stroke="#C9A24B"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.4 10.6a2.9 2.9 0 1 0 3.4 3.2 3.6 3.6 0 1 1-3.4-3.2Z"
        fill="#FBF8F1"
      />
    </svg>
  );
}

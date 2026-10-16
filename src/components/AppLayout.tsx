import { Suspense, useEffect } from "react";
import { Box, CircularProgress, Container } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";

type Props = { mode: "light" | "dark"; onToggleMode: () => void };

/** الهيكل العام: هيدر، محتوى، تذييل، وشريط سفلي للجوال. */
export function AppLayout({ mode, onToggleMode }: Props) {
  const { pathname } = useLocation();

  // إرجاع التمرير لأعلى الصفحة عند تغيّر المسار (سلوك أشبه بتطبيق حقيقي)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <a href="#main-content" className="skip-link">
        تخطَّ إلى المحتوى
      </a>
      <Header mode={mode} onToggleMode={onToggleMode} />
      <Box component="main" id="main-content" sx={{ flexGrow: 1, pt: { xs: 3, md: 4 } }}>
        <Container maxWidth="lg" sx={{ pb: { xs: 4, md: 6 } }}>
          <Suspense
            fallback={
              <Box sx={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
                <CircularProgress aria-label="جارٍ التحميل" />
              </Box>
            }
          >
            <Outlet />
          </Suspense>
        </Container>
      </Box>
      <Footer />
      <BottomNav />
    </Box>
  );
}

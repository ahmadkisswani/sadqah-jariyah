import { Suspense, useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Container } from "@mui/material";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { usePageMeta } from "../hooks/usePageMeta";

type Props = { mode: "light" | "dark"; onToggleMode: () => void };

/** الهيكل العام: هيدر، محتوى، تذييل، وشريط سفلي للجوال. */
export function AppLayout({ mode, onToggleMode }: Props) {
  const { pathname } = useLocation();
  const meta = usePageMeta();
  const mainRef = useRef<HTMLElement | null>(null);
  const previousPath = useRef(pathname);
  const [announcement, setAnnouncement] = useState("");

  // إرجاع التمرير لأعلى الصفحة عند تغيّر المسار (سلوك أشبه بتطبيق حقيقي)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  // نقل التركيز إلى المحتوى الرئيسي والإعلان عن الصفحة الجديدة لقارئات الشاشة.
  useEffect(() => {
    const changed = previousPath.current !== pathname;
    previousPath.current = pathname;
    if (!changed) return;

    const frame = window.requestAnimationFrame(() => {
      mainRef.current?.focus({ preventScroll: true });
      setAnnouncement(meta.title);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [meta.title, pathname]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <a href="#main-content" className="skip-link">
        تخطَّ إلى المحتوى
      </a>
      <Header mode={mode} onToggleMode={onToggleMode} />
      <Box
        ref={mainRef}
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          pt: { xs: 3, md: 4 },
          // يُبقي التذييل أسفل الشاشة أثناء تحميل المحتوى غير المتزامن،
          // فيمنع قفزة تخطيط كبيرة عند وصول البيانات (CLS).
          minHeight: { xs: "calc(100dvh - 60px)", md: "calc(100dvh - 70px)" },
          outline: "none",
        }}
      >
        <Container maxWidth="lg" sx={{ pb: { xs: 4, md: 6 } }}>
          <Box className="sr-only" aria-live="polite" aria-atomic="true">
            {announcement}
          </Box>
          <OfflineBanner />
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

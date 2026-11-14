import { lazy, Suspense } from "react";
import { Box, Skeleton, Stack } from "@mui/material";
import { HeroSection } from "../components/HeroSection";

// المحتوى تحت الهيرو لا يدخل في رسم أول شاشة؛ تحميله في حزمة منفصلة يقلّل
// JavaScript/Layout الأولي، ويترك LCP للهيرو. الهيرو يبقى ثابتًا بلا قفزة.
const HomeBelowFold = lazy(() => import("./HomeBelowFold"));

function BelowFoldFallback() {
  return (
    <Box aria-busy="true" aria-label="جارٍ تحميل بقية الصفحة" sx={{ minHeight: "70vh" }}>
      <Stack spacing={2} sx={{ maxWidth: 860, mx: "auto", width: "100%" }}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={64} />
        <Skeleton variant="rounded" height={180} />
      </Stack>
    </Box>
  );
}

/** الصفحة الرئيسية: الهيرو أولًا ثم بقية الأقسام عند جهوز حزمتها. */
export default function HomePage() {
  return (
    <Stack spacing={{ xs: 5, md: 7 }}>
      <HeroSection />
      <Suspense fallback={<BelowFoldFallback />}>
        <HomeBelowFold />
      </Suspense>
    </Stack>
  );
}

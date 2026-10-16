import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  align?: "center" | "start";
};

/** عنوان قسم متسامق — نص + سطر ذهبي رفيع + عنوان فرعي اختياري. */
export function SectionHeader({ title, subtitle, action, align = "center" }: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        gap: 1,
        mb: { xs: 3, md: 4 },
        textAlign: align,
        width: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", width: "100%" }}>
        <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {action}
      </Box>
      <Box
        aria-hidden
        sx={{
          width: 56,
          height: 3,
          borderRadius: 2,
          bgcolor: "secondary.main",
          opacity: 0.85,
        }}
      />
      {subtitle && (
        <Typography color="text.secondary" sx={{ maxWidth: 640 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

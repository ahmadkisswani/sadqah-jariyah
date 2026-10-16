import type { ReactNode } from "react";
import { Card, CardActionArea, CardContent, Box, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link as RouterLink } from "react-router-dom";
import type { SvgIconComponent } from "@mui/icons-material";

type Props = {
  icon: SvgIconComponent;
  title: string;
  description: string;
  to: string;
  accent?: "primary" | "secondary";
};

/** بطاقة خدمة قابلة للنقر مع أيقونة Material وتفاعل hover هادئ. */
export function ServiceCard({ icon: Icon, title, description, to, accent = "primary" }: Props) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardActionArea component={RouterLink} to={to} sx={{ height: "100%", p: 0.5 }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, height: "100%", minHeight: 200 }}>
          <Box
            aria-hidden
            sx={{
              width: 52,
              height: 52,
              borderRadius: "16px",
              bgcolor: accent === "primary" ? "rgba(31,93,76,0.10)" : "rgba(201,162,75,0.16)",
              color: accent === "primary" ? "primary.main" : "secondary.dark",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Icon fontSize="medium" />
          </Box>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ flexGrow: 1 }}>
            {description}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "primary.main", fontWeight: 700 }}>
            <Typography variant="button">دخول</Typography>
            <ArrowBackIcon fontSize="small" />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

/** بطاقة محتوى عامة موحّدة (للآيات، الأذكار، الأدعية...). */
export function IslamicCard({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Card sx={sx}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>{children}</CardContent>
    </Card>
  );
}

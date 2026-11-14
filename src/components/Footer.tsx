import { Box, Container, Divider, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { DEDICATED_PEOPLE, PROJECT_NAME } from "../constants/dedication";

/** تذييل مهادَن — لا يثقل الصفحة ويكرّر الوقف. */
export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        py: { xs: 4, md: 5 },
        pb: { xs: "calc(64px + env(safe-area-inset-bottom) + 16px)", md: 5 },
      }}
    >
      <Container maxWidth="md">
        <Divider sx={{ mb: 3 }} />
        <Box sx={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="subtitle1" component="p" sx={{ fontWeight: 800, color: "text.primary" }}>
            {PROJECT_NAME}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            عن روح
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, mb: 1 }}>
            {DEDICATED_PEOPLE.map((name) => (
              <Typography key={name} sx={{ fontWeight: 700 }}>
                {name}
              </Typography>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, mx: "auto" }}>
            اللهم تقبّل هذا العمل واجعله في ميزان حسناتهما.
          </Typography>
          <Stack
            component="nav"
            aria-label="روابط معلوماتية"
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 0.5 }}
          >
            <Link component={RouterLink} to="/about" color="text.secondary" underline="hover" variant="body2">
              عن الموقع والمصادر
            </Link>
            <Link component={RouterLink} to="/privacy" color="text.secondary" underline="hover" variant="body2">
              الخصوصية
            </Link>
            <Link component={RouterLink} to="/bookmarks" color="text.secondary" underline="hover" variant="body2">
              المحفوظات
            </Link>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            © 2026 {PROJECT_NAME}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

import { Box, Container, Divider, Typography } from "@mui/material";
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
          <Typography variant="h6" sx={{ fontWeight: 800, color: "primary.main" }}>
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
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            © 2026 {PROJECT_NAME}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

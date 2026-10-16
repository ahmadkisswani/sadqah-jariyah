import { Box, Chip, Container, Stack, Typography } from "@mui/material";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import { IslamicPattern } from "./IslamicPattern";
import { DEDICATED_PEOPLE } from "../constants/dedication";

/** قسم الهيرو الرئيسي — يوضّح الغرض والأسماء خلال ثوانٍ. */
export function HeroSection() {
  return (
    <Box
      component="section"
      aria-labelledby="hero-title"
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: { xs: 0, md: 4 },
        mx: { xs: -2, sm: -3, md: 0 },
        mb: { xs: 4, md: 6 },
        background: (t) =>
          t.palette.mode === "dark"
            ? "linear-gradient(160deg, #16302A 0%, #0F1F1A 100%)"
            : "linear-gradient(160deg, #EAF3EE 0%, #FBF8F1 60%)",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <IslamicPattern opacity={0.07} />
      <Container maxWidth="md" sx={{ position: "relative", py: { xs: 5, md: 8 }, textAlign: "center" }}>
        <Chip
          icon={<VolunteerActivismIcon />}
          label="صدقة جارية"
          color="primary"
          variant="outlined"
          sx={{ mb: 3, fontWeight: 700, bgcolor: "background.paper" }}
        />

        <Typography
          id="hero-title"
          variant="h2"
          component="h1"
          sx={{ fontWeight: 800, mb: 2, fontSize: { xs: "2rem", sm: "2.6rem", md: "3rem" } }}
        >
          صدقة جارية
        </Typography>

        <Typography variant="h5" component="p" color="text.secondary" sx={{ mb: 3 }}>
          عن روح
        </Typography>

        <Stack
          spacing={1}
          alignItems="center"
          sx={{ mb: 4 }}
          role="list"
          aria-label="الأسماء المكرَّس لها هذا العمل"
        >
          {DEDICATED_PEOPLE.map((name) => (
            <Box
              key={name}
              role="listitem"
              sx={{
                px: { xs: 2, sm: 3 },
                py: 1,
                borderRadius: 3,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: (t) =>
                  t.palette.mode === "dark" ? "none" : "0 2px 10px rgba(31,93,76,0.06)",
              }}
            >
              <Typography variant="h5" component="p" sx={{ fontWeight: 800 }}>
                {name}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Typography
          variant="body2"
          sx={{ mt: 2, color: "text.secondary", fontStyle: "italic" }}
        >
          إهداء من: أسماء محمد مسلم وولدها
        </Typography>
      </Container>
    </Box>
  );
}

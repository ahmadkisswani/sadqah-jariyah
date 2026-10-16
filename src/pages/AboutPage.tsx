import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import { SectionHeader } from "../components/SectionHeader";
import { IslamicPattern } from "../components/IslamicPattern";
import { ShareButton } from "../components/ShareButton";
import { usePageTitle } from "../hooks/usePageTitle";
import { fonts } from "../theme";
import { DEDICATED_PEOPLE, PROJECT_NAME, withDedication } from "../constants/dedication";

const SECTIONS = [
  {
    title: "ما هو هذا الموقع؟",
    body: "موقع إسلامي بسيط يجمع القرآن الكريم والأذكار والأدعية والتسبيح والرقية الشرعية، صُمّم ليكون نافعًا وسهلًا، ويعمل بلا حساب ولا خادم.",
  },
  {
    title: "لمن هذا العمل؟",
    body: "هذا العمل صدقة جارية مكرَّسة لروح توبة عبد العزيز الجربوعه ومحمد احمد مسلم، نسأل الله أن يجعله في ميزان حسناتهما.",
  },
  {
    title: "كيف تستفيد منه؟",
    body: "اقرأ ما تيسّر من القرآن، واذكر الله، وادعُ لهما، وسبّح، ثم شارك الأجر مع غيرك؛ فالدال على الخير كفاعله.",
  },
];

export default function AboutPage() {
  usePageTitle("عن الموقع");

  return (
    <Stack spacing={4} sx={{ maxWidth: 820, mx: "auto" }}>
      <SectionHeader title="عن هذا العمل" />

      <Paper sx={{ position: "relative", overflow: "hidden", p: { xs: 3, md: 4 }, border: "1px solid", borderColor: "divider" }}>
        <IslamicPattern opacity={0.05} />
        <Box sx={{ position: "relative", textAlign: "center" }}>
          <VolunteerActivismIcon sx={{ fontSize: 44, color: "secondary.main", mb: 1 }} aria-hidden />
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
            {PROJECT_NAME}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            عملٌ يسير، يُرجى به وجه الله، ونفعٌ مستمرٌّ لكل من قرأ أو ذكر أو دعا.
          </Typography>
          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            مكرَّس لروح
          </Typography>
          <Stack spacing={0.5} sx={{ mb: 3 }}>
            {DEDICATED_PEOPLE.map((name) => (
              <Typography key={name} variant="h6" sx={{ fontFamily: fonts.naskh, fontWeight: 800 }}>
                {name}
              </Typography>
            ))}
          </Stack>
          <Typography
            sx={{ fontFamily: fonts.naskh, lineHeight: 2.2, maxWidth: 560, mx: "auto" }}
          >
            نسأل الله أن يتقبّل هذا العمل، وأن يجعله نفعًا مستمرًّا لكل من استخدمه، وأن يجعله في ميزان
            حسناتهما.
          </Typography>
        </Box>
      </Paper>

      <Stack spacing={2.5}>
        {SECTIONS.map((s) => (
          <Paper key={s.title} sx={{ p: { xs: 2.5, sm: 3 }, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {s.title}
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 2 }}>
              {s.body}
            </Typography>
          </Paper>
        ))}
      </Stack>

      <Box>
        <ShareButton
          text={withDedication("صدقة جارية: قرآن وأذكار وأدعية وتسبيح ورقية شرعية ")}
          label="شارك الموقع مع من تحب"
        />
      </Box>
    </Stack>
  );
}

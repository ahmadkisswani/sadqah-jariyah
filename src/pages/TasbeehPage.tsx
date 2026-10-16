import { Stack, Typography } from "@mui/material";
import { TasbeehCounter } from "../components/TasbeehCounter";
import { SectionHeader } from "../components/SectionHeader";
import { usePageTitle } from "../hooks/usePageTitle";
import { fonts } from "../theme";

export default function TasbeehPage() {
  usePageTitle("التسبيح");

  return (
    <Stack spacing={4} alignItems="center">
      <SectionHeader
        title="التسبيح"
        subtitle="عدّاد تسبيح بأهداف قابلة للضبط، يُحفظ تقدّمك تلقائيًا."
      />
      <TasbeehCounter />
      <Typography
        sx={{ fontFamily: fonts.naskh, textAlign: "center", color: "text.secondary", maxWidth: 520, lineHeight: 2 }}
      >
        اللهم اجعل ثواب هذا الذكر صدقةً جارية عن توبة عبد العزيز الجربوعه ومحمد احمد مسلم.
      </Typography>
    </Stack>
  );
}

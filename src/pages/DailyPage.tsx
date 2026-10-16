import { Stack, Typography } from "@mui/material";
import { DailyWirdCard } from "../components/DailyWirdCard";
import { SectionHeader } from "../components/SectionHeader";
import { ShareButton } from "../components/ShareButton";
import { useDailyContent } from "../hooks/useDailyContent";
import { usePageTitle } from "../hooks/usePageTitle";
import { withDedication } from "../constants/dedication";
import { toArabicNumber } from "../utils/arabic";

export default function DailyPage() {
  usePageTitle("ورد اليوم");
  const daily = useDailyContent();

  const shareAll = withDedication(
    `ورد اليوم\n\n﴿ ${daily.ayah.text} ﴾\nسورة ${daily.ayah.surah} — آية ${toArabicNumber(
      daily.ayah.ayah,
    )}\n\nذكر اليوم: ${daily.dhikr.text}\n\nدعاء اليوم: ${daily.dua.text}`,
  );

  return (
    <Stack spacing={4}>
      <SectionHeader
        title="ورد اليوم"
        subtitle="وردٌ يومي متكامل يتجدّد كل يوم، ويعمل دون اتصال."
      />
      <DailyWirdCard content={daily} />
      <Stack spacing={1} alignItems="flex-start">
        <Typography color="text.secondary" variant="body2">
          شارك ورد اليوم مع من تحب.
        </Typography>
        <ShareButton text={shareAll} label="مشاركة ورد اليوم" />
      </Stack>
    </Stack>
  );
}

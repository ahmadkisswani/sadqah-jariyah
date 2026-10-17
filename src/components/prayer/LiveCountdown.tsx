import { Box, Typography, type SxProps, type Theme } from "@mui/material";
import type { Lang } from "../../data/prayer/labels";
import { formatCountdown, formatCountdownWords } from "../../utils/prayer";
import { TABULAR_NUMBERS, srOnly } from "./shared";

type Props = {
  /** الوقت المتبقّي بالمللي ثانية (يعيد الحساب الأب كل ثانية). */
  msRemaining: number;
  lang: Lang;
  /** وصف العدّاد لقارئ الشاشي: \"الوقت المتبقّي حتى العصر\". */
  label: string;
  variant?: "h3" | "h4" | "h6";
  sx?: SxProps<Theme>;
};

/**
 * عدّ تنازلي رقمي يتحدّث مع كل دورة رسم (لا مؤقّت مستقل هنا).
 *
 * لقارئ الشاشي: الرقم التنازلي نفسه (role=timer) لا يُنادى كل ثانية — وهناك نص
 * منطوق (ساعات ودقائق) في عنصر مخفي بصريًا بـ aria-live=polite يتغيّر كل دقيقة.
 */
export function LiveCountdown({ msRemaining, lang, label, variant = "h3", sx }: Props) {
  const human = formatCountdownWords(msRemaining, lang);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, ...sx }}>
      <Typography
        role="timer"
        variant={variant}
        dir="ltr"
        aria-label={`${label}: ${human}`}
        sx={{
          ...TABULAR_NUMBERS,
          fontWeight: 800,
          letterSpacing: 1,
          lineHeight: 1.1,
          color: "primary.main",
        }}
      >
        {formatCountdown(msRemaining, lang)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box sx={srOnly} aria-live="polite">
        {human}
      </Box>
    </Box>
  );
}

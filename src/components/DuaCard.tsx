import { Box, Chip, Paper, Typography } from "@mui/material";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import { ShareButton, CopyButton } from "./ShareButton";
import { fonts } from "../theme";
import { toArabicNumber } from "../utils/arabic";
import { withDedication } from "../constants/dedication";
import type { Dua } from "../data/duas";

type Props = { dua: Dua; index: number };

/** بطاقة دعاء واحدة مع نسخ ومشاركة. */
export function DuaCard({ dua, index }: Props) {
  const shareable = withDedication(`﴿ ${dua.text} ﴾`);

  return (
    <Paper
      component="article"
      sx={{
        p: { xs: 2.5, sm: 3 },
        mb: 2,
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        gap: 2,
      }}
    >
      <Chip
        label={toArabicNumber(index + 1)}
        size="small"
        color="primary"
        variant="outlined"
        sx={{ fontWeight: 700, flexShrink: 0, mt: 0.5 }}
      />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: fonts.naskh,
            fontSize: { xs: "1.15rem", sm: "1.3rem" },
            lineHeight: 2.1,
            mb: 1.5,
          }}
        >
          {dua.text}
        </Typography>
        {dua.reference && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary", mb: 1.5 }}>
            <FormatQuoteIcon sx={{ fontSize: 16 }} />
            <Typography variant="caption">{dua.reference}</Typography>
          </Box>
        )}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <CopyButton text={dua.text} label="نسخ" size="small" />
          <ShareButton text={shareable} label="مشاركة" size="small" />
        </Box>
      </Box>
    </Paper>
  );
}

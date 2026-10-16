import { Box, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { ShareButton, CopyButton } from "./ShareButton";
import { fonts } from "../theme";
import { toArabicNumber } from "../utils/arabic";
import { withDedication } from "../constants/dedication";

type Props = {
  text: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  fontSize: number;
  bookmarked: boolean;
  onToggleBookmark: () => void;
};

/** بطاقة آية واحدة بتباعد مريح للقراءة — بلا جداول. */
export function AyahCard({
  text,
  surahName,
  ayahNumber,
  fontSize,
  bookmarked,
  onToggleBookmark,
}: Props) {
  const shareable = withDedication(`﴿ ${text} ﴾\n\nسورة ${surahName} — آية ${toArabicNumber(ayahNumber)}`);

  return (
    <Paper
      component="article"
      aria-label={`الآية ${ayahNumber} من سورة ${surahName}`}
      sx={{
        p: { xs: 2.5, sm: 3 },
        mb: 2,
        border: "1px solid",
        borderColor: "divider",
        scrollMarginTop: 90,
        transition: "border-color .2s ease",
        "&:hover": { borderColor: "primary.light" },
      }}
    >
      <Typography
        sx={{
          fontFamily: fonts.quran,
          fontSize: { xs: `${fontSize}px`, md: `${fontSize + 2}px` },
          lineHeight: 2.4,
          textAlign: "right",
          mb: 2,
        }}
      >
        {text}
        <Box
          component="span"
          aria-hidden
          sx={{
            display: "inline-grid",
            placeItems: "center",
            minWidth: 30,
            height: 30,
            mx: 0.75,
            borderRadius: "50%",
            border: "1.5px solid",
            borderColor: "secondary.main",
            color: "secondary.dark",
            fontSize: 13,
            fontFamily: fonts.sans,
            verticalAlign: "middle",
          }}
        >
          {toArabicNumber(ayahNumber)}
        </Box>
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <ShareButton text={shareable} variant="icon" label="مشاركة الآية" />
        <CopyButton text={shareable} variant="icon" label="نسخ الآية" />
        <Tooltip title={bookmarked ? "إزالة من المحفوظات" : "حفظ الآية"}>
          <IconButton
            onClick={onToggleBookmark}
            aria-label={bookmarked ? "إزالة من المحفوظات" : "حفظ الآية"}
            aria-pressed={bookmarked}
            color={bookmarked ? "secondary" : "default"}
          >
            {bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
}

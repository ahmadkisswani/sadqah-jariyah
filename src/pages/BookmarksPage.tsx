import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { Link as RouterLink } from "react-router-dom";
import { SectionHeader } from "../components/SectionHeader";
import { EmptyState } from "../components/EmptyState";
import { ShareButton, CopyButton } from "../components/ShareButton";
import { useBookmarks } from "../hooks/useBookmarks";
import { usePageTitle } from "../hooks/usePageTitle";
import { fonts } from "../theme";
import { toArabicNumber } from "../utils/arabic";
import { withDedication } from "../constants/dedication";

export default function BookmarksPage() {
  usePageTitle("المحفوظات");
  const { bookmarks, remove, clear } = useBookmarks();

  return (
    <Stack spacing={4}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <SectionHeader title="الآيات المحفوظة" align="start" />
        {bookmarks.length > 0 && (
          <Button onClick={clear} color="error" variant="outlined" startIcon={<DeleteOutlineIcon />}>
            حذف الكل
          </Button>
        )}
      </Stack>

      {bookmarks.length === 0 ? (
        <EmptyState
          kind="bookmarks"
          description="يمكنك حفظ أي آية من صفحة القرآن الكريم بالضغط على أيقونة الحفظ."
          actionLabel="الذهاب إلى القرآن الكريم"
          actionTo="/quran"
        />
      ) : (
        <Stack spacing={2}>
          {bookmarks.map((b) => (
            <Paper
              key={`${b.surah}-${b.ayah}`}
              component="article"
              sx={{ p: { xs: 2.5, sm: 3 }, border: "1px solid", borderColor: "divider" }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <MenuBookIcon fontSize="small" color="primary" aria-hidden />
                <Typography variant="body2" color="text.secondary">
                  سورة {b.surahName} — الآية {toArabicNumber(b.ayah)}
                </Typography>
              </Stack>

              <Typography sx={{ fontFamily: fonts.quran, fontSize: { xs: "1.2rem", sm: "1.35rem" }, lineHeight: 2.2, mb: 2 }}>
                {b.text}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <CopyButton text={withDedication(`﴿ ${b.text} ﴾`)} label="نسخ" size="small" />
                <ShareButton text={withDedication(`﴿ ${b.text} ﴾`)} label="مشاركة" size="small" />
                <Button
                  component={RouterLink}
                  to={`/quran/${b.surah}`}
                  size="small"
                  variant="text"
                >
                  فتح في السورة
                </Button>
                <Button
                  onClick={() => remove(b.surah, b.ayah)}
                  size="small"
                  color="error"
                  variant="text"
                  startIcon={<DeleteOutlineIcon />}
                >
                  حذف
                </Button>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

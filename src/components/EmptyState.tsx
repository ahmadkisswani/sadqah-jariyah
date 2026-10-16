import { Box, Button, Paper, Typography } from "@mui/material";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import { useNavigate } from "react-router-dom";

type Kind = "empty" | "search" | "error" | "bookmarks";

const PRESETS: Record<Kind, { icon: typeof SearchOffIcon; title: string }> = {
  empty: { icon: SentimentSatisfiedAltIcon, title: "لا يوجد محتوى هنا بعد" },
  search: { icon: SearchOffIcon, title: "لم نجد ما تبحث عنه" },
  error: { icon: ErrorOutlineIcon, title: "حدث خطأ في تحميل المحتوى" },
  bookmarks: { icon: BookmarksIcon, title: "لا توجد عناصر محفوظة بعد" },
};

type Props = {
  kind?: Kind;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
};

/** حالة فارغة/خطأ أنيقة مع إجراء تعافي واضح. */
export function EmptyState({ kind = "empty", title, description, actionLabel, actionTo }: Props) {
  const navigate = useNavigate();
  const preset = PRESETS[kind];
  const Icon = preset.icon;

  return (
    <Paper
      role={kind === "error" ? "alert" : "status"}
      sx={{
        p: { xs: 4, md: 6 },
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
        border: "1px dashed",
        borderColor: "divider",
        boxShadow: "none",
      }}
    >
      <Icon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.7 }} />
      <Typography variant="h6" component="p">
        {title ?? preset.title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ maxWidth: 460 }}>
          {description}
        </Typography>
      )}
      {actionLabel && actionTo && (
        <Box sx={{ mt: 1 }}>
          <Button variant="contained" onClick={() => navigate(actionTo)}>
            {actionLabel}
          </Button>
        </Box>
      )}
    </Paper>
  );
}

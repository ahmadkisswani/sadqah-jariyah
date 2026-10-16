import { Button, Stack } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("الصفحة غير موجودة");
  const navigate = useNavigate();

  return (
    <Stack spacing={2} sx={{ py: 6 }}>
      <EmptyState
        kind="error"
        title="لم نجد هذه الصفحة"
        description="قد يكون الرابط قديمًا أو غير صحيح. يمكنك العودة إلى الصفحة الرئيسية."
      />
      <Stack direction="row" justifyContent="center">
        <Button variant="contained" startIcon={<HomeIcon />} onClick={() => navigate("/")}>
          العودة إلى الرئيسية
        </Button>
      </Stack>
    </Stack>
  );
}

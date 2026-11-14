import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import HomeIcon from "@mui/icons-material/Home";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * حاجز أخطاء على مستوى التطبيق: يمنع الشاشة البيضاء إذا فشل تحميل صفحة
 * كسولة أو حدث خطأ غير متوقع في العرض، ويعطي المستخدم طريقًا واضحًا للتعافي.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // لا نرسل أي بيانات لطرف ثالث؛ نُبقي الأثر في الطرفية للمطوّر فقط.
    if (import.meta.env.DEV) {
      console.error("AppErrorBoundary", error, info.componentStack);
    }
  }

  private goHome = () => {
    window.location.assign("/");
  };

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", p: 2 }}>
        <Paper
          role="alert"
          sx={{
            maxWidth: 520,
            width: "100%",
            p: { xs: 3, sm: 5 },
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack spacing={2.5} alignItems="center">
            <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
              تعذّر عرض الصفحة
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 2 }}>
              حدث خطأ غير متوقع. قد يكون السبب تحديثًا جديدًا للموقع أو انقطاعًا مؤقتًا في الاتصال.
              جرّب إعادة التحميل، وإن استمرت المشكلة فعُد إلى الصفحة الرئيسية.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ width: "100%" }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={this.reload}
                sx={{ flex: 1 }}
              >
                إعادة المحاولة
              </Button>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={this.goHome}
                sx={{ flex: 1 }}
              >
                الصفحة الرئيسية
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  }
}

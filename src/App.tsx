import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { useThemeMode } from "./theme/useThemeMode";
import { SnackProvider } from "./hooks/useSnack";
import { AppLayout } from "./components/AppLayout";
import HomePage from "./pages/HomePage";

// تحميل كسول للصفحات الأكبر — الرئيسية تُحمّل مباشرة لسرعة أول رسم
const QuranPage = lazy(() => import("./pages/QuranPage"));
const AzkarPage = lazy(() => import("./pages/AzkarPage"));
const DuasPage = lazy(() => import("./pages/DuasPage"));
const TasbeehPage = lazy(() => import("./pages/TasbeehPage"));
const RuqyahPage = lazy(() => import("./pages/RuqyahPage"));
const DailyPage = lazy(() => import("./pages/DailyPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const BookmarksPage = lazy(() => import("./pages/BookmarksPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

export default function App() {
  const { mode, toggleMode, theme } = useThemeMode();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackProvider>
        <BrowserRouter>
          <Routes>
            <Route
              element={<AppLayout mode={mode} onToggleMode={toggleMode} />}
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/quran" element={<QuranPage />} />
              <Route path="/quran/:surahNumber" element={<QuranPage />} />
              <Route path="/azkar" element={<AzkarPage />} />
              <Route path="/duas" element={<DuasPage />} />
              <Route path="/tasbeeh" element={<TasbeehPage />} />
              <Route path="/ruqyah" element={<RuqyahPage />} />
              <Route path="/daily" element={<DailyPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/bookmarks" element={<BookmarksPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SnackProvider>
    </ThemeProvider>
  );
}

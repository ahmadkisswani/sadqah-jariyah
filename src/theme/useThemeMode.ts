import { useCallback, useEffect, useState } from "react";
import type { PaletteMode } from "@mui/material";
import buildTheme from "./index";

const STORAGE_KEY = "sj-theme-mode";

function getInitialMode(): PaletteMode {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useThemeMode() {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* storage unavailable */
    }
    document.documentElement.style.colorScheme = mode;
    const themeColor = mode === "dark" ? "#0F1F1A" : "#1F5D4C";
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute("content", themeColor);
    });
  }, [mode]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const theme = buildTheme(mode);

  return { mode, toggleMode, theme };
}

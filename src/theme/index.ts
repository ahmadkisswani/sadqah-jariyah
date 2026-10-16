import { createTheme, type PaletteMode, type Theme } from "@mui/material/styles";

export const palette = {
  primary: { main: "#1F5D4C", light: "#2E7D68", dark: "#153F34", contrast: "#FFFFFF" },
  secondary: { main: "#C9A24B", light: "#E3C77E", dark: "#A9853A", contrast: "#1A1A1A" },
  ivory: "#FBF8F1",
  charcoal: "#23272A",
} as const;

const fontFamily = {
  sans: '"Noto Sans Arabic", "Segoe UI", system-ui, sans-serif',
  naskh: '"Noto Naskh Arabic", "Noto Sans Arabic", serif',
  quran: '"Amiri", "Noto Naskh Arabic", serif',
};

function buildTheme(mode: PaletteMode): Theme {
  const isDark = mode === "dark";

  return createTheme({
    direction: "rtl",
    palette: {
      mode,
      primary: { ...palette.primary, contrastText: palette.primary.contrast },
      secondary: { ...palette.secondary, contrastText: palette.secondary.contrast },
      background: {
        default: isDark ? "#0F1F1A" : palette.ivory,
        paper: isDark ? "#16302A" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#E7EEE9" : palette.charcoal,
        secondary: isDark ? "#A8BDB4" : "#5C6B64",
      },
      divider: isDark ? "rgba(255,255,255,0.10)" : "rgba(31,93,76,0.12)",
      action: {
        hover: isDark ? "rgba(255,255,255,0.06)" : "rgba(31,93,76,0.05)",
        selected: isDark ? "rgba(201,162,75,0.16)" : "rgba(201,162,75,0.14)",
      },
    },
    typography: {
      fontFamily: fontFamily.sans,
      h1: { fontFamily: fontFamily.naskh, fontWeight: 700, lineHeight: 1.3 },
      h2: { fontFamily: fontFamily.naskh, fontWeight: 700, lineHeight: 1.35 },
      h3: { fontFamily: fontFamily.naskh, fontWeight: 700, lineHeight: 1.4 },
      h4: { fontFamily: fontFamily.naskh, fontWeight: 700, lineHeight: 1.4 },
      h5: { fontFamily: fontFamily.naskh, fontWeight: 600, lineHeight: 1.5 },
      h6: { fontFamily: fontFamily.naskh, fontWeight: 600, lineHeight: 1.5 },
      subtitle1: { lineHeight: 1.9 },
      body1: { lineHeight: 2 },
      body2: { lineHeight: 1.9 },
      button: { fontFamily: fontFamily.sans, fontWeight: 600 },
    },
    shape: { borderRadius: 14 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { scrollBehavior: "smooth" },
          body: {
            backgroundColor: isDark ? "#0F1F1A" : palette.ivory,
            textRendering: "optimizeLegibility",
          },
          "::selection": {
            backgroundColor: isDark ? "rgba(201,162,75,0.35)" : "rgba(31,93,76,0.18)",
          },
          "*:focus-visible": {
            outline: `3px solid ${palette.secondary.main}`,
            outlineOffset: 2,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 12, textTransform: "none", paddingInline: 20, paddingBlock: 8 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(31,93,76,0.09)"}`,
            boxShadow: isDark
              ? "0 2px 14px rgba(0,0,0,0.35)"
              : "0 2px 14px rgba(31,93,76,0.06)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 10, fontWeight: 600 },
        },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontFamily: fontFamily.naskh, fontWeight: 700 } },
      },
    },
  });
}

export const fonts = fontFamily;
export default buildTheme;

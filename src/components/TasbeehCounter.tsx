import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";
import RemoveIcon from "@mui/icons-material/Remove";
import VibrationIcon from "@mui/icons-material/Vibration";
import { fonts } from "../theme";
import { toArabicNumber } from "../utils/arabic";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useSnack } from "../hooks/useSnack";

const PRESET_DHIKR = [
  "سبحان الله",
  "الحمد لله",
  "الله أكبر",
  "لا إله إلا الله",
  "أستغفر الله",
  "سبحان الله وبحمده",
  "سبحان الله العظيم",
  "اللهم صل وسلم على نبينا محمد",
];

const TARGETS = [33, 100, 300, 1000, 0];

type State = { dhikr: string; target: number; count: number; total: number };

const INITIAL: State = { dhikr: "سبحان الله", target: 100, count: 0, total: 0 };

/** عدّاد تسبيح رقمي كبير، بلمسة نقر واسعة وحلقة تقدّم، وحفظ محلي. */
export function TasbeehCounter() {
  const theme = useTheme();
  const snack = useSnack();
  const [state, setState] = useLocalStorage<State>("sj-tasbeeh", INITIAL);
  const [customMode, setCustomMode] = useState(false);
  const [customDhikr, setCustomDhikr] = useState("");
  const [customTarget, setCustomTarget] = useState("");
  const ringRef = useRef<HTMLButtonElement | null>(null);

  const { dhikr, target, count, total } = state;
  const reached = target > 0 && count >= target;

  const size = 240;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(1, count / target) : 0;

  const buzz = (finished: boolean) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(finished ? [40, 40, 80] : 25);
      } catch {
        /* مدعوم جزئيًا */
      }
    }
  };

  const increment = useCallback(() => {
    if (reached) return;
    const nextCount = count + 1;
    const justFinished = target > 0 && nextCount === target;
    setState({ ...state, count: nextCount, total: total + 1 });
    buzz(justFinished);
    if (justFinished) snack("أتممت العدد المحدد، تقبّل الله منك.", "success");
  }, [reached, count, target, total, state, setState, snack]);

  const decrement = () => {
    setState((prev) => ({
      ...prev,
      count: Math.max(0, prev.count - 1),
      total: Math.max(0, prev.total - 1),
    }));
  };

  const reset = () => setState((prev) => ({ ...prev, count: 0 }));

  const changeDhikr = (value: string) => {
    setState((prev) => ({ ...prev, dhikr: value, count: 0 }));
  };

  const changeTarget = (value: number) => {
    setState((prev) => ({ ...prev, target: value, count: 0 }));
  };

  // دعم لوحة المفاتيح: مفتاح المسافة أو Enter للتسبيح
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement;
      if (typing) return;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        increment();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [increment]);

  const dhikrOptions = useMemo(
    () => (dhikr && !PRESET_DHIKR.includes(dhikr) ? [dhikr, ...PRESET_DHIKR] : PRESET_DHIKR),
    [dhikr],
  );

  return (
    <Stack spacing={3} alignItems="center">
      <Paper sx={{ p: { xs: 2.5, sm: 3 }, width: "100%", maxWidth: 560 }}>
        <Typography sx={{ fontFamily: fonts.naskh, textAlign: "center", mb: 1, color: "text.secondary" }}>
          اذكر الله واهدِ ثواب ذكرك لمن تحب
        </Typography>

        <Box
          sx={{
            fontFamily: fonts.naskh,
            fontSize: { xs: "1.5rem", sm: "1.75rem" },
            fontWeight: 700,
            textAlign: "center",
            minHeight: 48,
            display: "grid",
            placeItems: "center",
            py: 1,
          }}
          aria-live="polite"
        >
          {dhikr}
        </Box>
      </Paper>

      {/* الحلقة الكبيرة القابلة للنقر */}
      <Box sx={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.palette.divider} strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={reached ? theme.palette.secondary.main : theme.palette.primary.main}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: "stroke-dashoffset .18s ease" }}
          />
        </svg>

        <Button
          ref={ringRef}
          onClick={increment}
          disabled={reached}
          aria-label={`تسبيح — ${count}${target > 0 ? ` من ${target}` : ""}`}
          sx={{
            position: "absolute",
            inset: 10,
            borderRadius: "50%",
            display: "flex",
            flexDirection: "column",
            gap: 0.25,
            bgcolor: reached ? "secondary.main" : "primary.main",
            color: reached ? "#1A1A1A" : "#fff",
            minWidth: 0,
            "&:hover": { bgcolor: reached ? "secondary.dark" : "primary.dark" },
            "&:disabled": { bgcolor: "secondary.main", color: "#1A1A1A" },
            boxShadow: "0 10px 30px rgba(31,93,76,0.25)",
          }}
        >
          <Typography sx={{ fontSize: size / 4.2, fontWeight: 800, lineHeight: 1 }}>
            {toArabicNumber(count)}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {target > 0 ? `من ${toArabicNumber(target)}` : "بدون حد"}
          </Typography>
          {reached && <Typography variant="caption">تم العدد</Typography>}
        </Button>
      </Box>

      {/* الإعدادات */}
      <Paper sx={{ p: { xs: 2.5, sm: 3 }, width: "100%", maxWidth: 560 }}>
        <Stack spacing={2}>
          <FormControl fullWidth>
            <InputLabel id="dhikr-label">الذكر</InputLabel>
            <Select
              labelId="dhikr-label"
              label="الذكر"
              value={dhikr}
              onChange={(e) => changeDhikr(e.target.value)}
            >
              {dhikrOptions.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              عدد التكرارات
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {TARGETS.map((t) => (
                <Chip
                  key={t}
                  label={t === 0 ? "بدون حد" : toArabicNumber(t)}
                  clickable
                  color={target === t && !customMode ? "primary" : "default"}
                  variant={target === t && !customMode ? "filled" : "outlined"}
                  onClick={() => {
                    setCustomMode(false);
                    changeTarget(t);
                  }}
                />
              ))}
              <Chip
                label="مخصص"
                clickable
                color={customMode ? "primary" : "default"}
                variant={customMode ? "filled" : "outlined"}
                onClick={() => setCustomMode(true)}
              />
            </Stack>

            {customMode && (
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <TextField
                  label="ذكر مخصص"
                  value={customDhikr}
                  onChange={(e) => setCustomDhikr(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="العدد"
                  value={customTarget}
                  onChange={(e) => setCustomTarget(e.target.value.replace(/[^\d]/g, ""))}
                  size="small"
                  sx={{ width: 110 }}
                  inputProps={{ inputMode: "numeric" }}
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    const n = Number(customTarget || "0");
                    setState((prev) => ({
                      ...prev,
                      dhikr: customDhikr.trim() || prev.dhikr,
                      target: Number.isFinite(n) ? n : prev.target,
                      count: 0,
                    }));
                    snack("تم تحديث الإعدادات", "success");
                  }}
                >
                  تطبيق
                </Button>
              </Stack>
            )}
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button onClick={reset} startIcon={<ReplayIcon />} variant="outlined" color="error">
              تصفير العدّاد
            </Button>
            <Button onClick={decrement} startIcon={<RemoveIcon />} variant="outlined" color="inherit">
              ناقص واحد
            </Button>
            <Tooltip title="يُستخدم الاهتزاز تلقائيًا عند الدعم">
              <Button startIcon={<VibrationIcon />} variant="text" color="inherit" disabled>
                الاهتزاز مفعّل
              </Button>
            </Tooltip>
          </Stack>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pt: 1,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography color="text.secondary">إجمالي التسبيحات</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: "1.25rem" }}>
              {toArabicNumber(total)}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
}

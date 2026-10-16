import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import { azkarCategories, getAzkarCategory } from "../data/azkar";
import { DhikrCard } from "../components/DhikrCard";
import { SectionHeader } from "../components/SectionHeader";
import { usePageTitle } from "../hooks/usePageTitle";
import { toArabicNumber } from "../utils/arabic";

const DEFAULT_CATEGORY = azkarCategories[0].id;

export default function AzkarPage() {
  usePageTitle("الأذكار");
  const theme = useTheme();
  const [activeId, setActiveId] = useState(DEFAULT_CATEGORY);
  const category = getAzkarCategory(activeId) ?? azkarCategories[0];

  // حفظ تقدّم كل فئة في localStorage: { [categoryId]: { [index]: count } }
  const storageKey = "sj-azkar-progress";
  const [progress, setProgress] = useState<Record<string, Record<number, number>>>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Record<string, Record<number, number>>) : {};
    } catch {
      return {};
    }
  });

  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch {
        /* ignore */
      }
    }, 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [progress]);

  const categoryProgress = progress[category.id] ?? {};

  const completed = useMemo(
    () => category.azkar.filter((z, i) => (categoryProgress[i] ?? 0) >= z.count).length,
    [category, categoryProgress],
  );
  const total = category.azkar.length;
  const allDone = completed === total;

  const increment = (index: number, max: number) => {
    setProgress((prev) => {
      const cur = prev[category.id]?.[index] ?? 0;
      if (cur >= max) return prev;
      return {
        ...prev,
        [category.id]: { ...(prev[category.id] ?? {}), [index]: cur + 1 },
      };
    });
  };

  const resetZikr = (index: number) => {
    setProgress((prev) => ({
      ...prev,
      [category.id]: { ...(prev[category.id] ?? {}), [index]: 0 },
    }));
  };

  const resetCategory = () => {
    setProgress((prev) => ({ ...prev, [category.id]: {} }));
  };

  return (
    <Stack spacing={4}>
      <SectionHeader
        title="الأذكار"
        subtitle="أذكار الصباح والمساء والنوم وبعد الصلاة، مع عدّاد مريح وحفظ للتقدّم."
      />

      {/* اختيار الفئة */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap role="tablist" aria-label="فئات الأذكار">
        {azkarCategories.map((c) => (
          <Chip
            key={c.id}
            label={c.title}
            role="tab"
            aria-selected={c.id === activeId}
            onClick={() => setActiveId(c.id)}
            color={c.id === activeId ? "primary" : "default"}
            variant={c.id === activeId ? "filled" : "outlined"}
            sx={{ fontWeight: 600, minHeight: 38 }}
          />
        ))}
      </Stack>

      {/* تقدّم الفئة */}
      <Paper sx={{ p: 2, border: "1px solid", borderColor: "divider" }}>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {category.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {category.description}
              </Typography>
            </Box>
            <Chip
              icon={allDone ? <CheckCircleIcon /> : undefined}
              label={`${toArabicNumber(completed)} / ${toArabicNumber(total)}`}
              color={allDone ? "secondary" : "primary"}
              variant={allDone ? "filled" : "outlined"}
              sx={{ fontWeight: 700 }}
            />
          </Stack>
          <LinearProgress
            variant="determinate"
            value={total === 0 ? 0 : (completed / total) * 100}
            aria-label={`تقدّم ${category.title}`}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: theme.palette.divider,
            }}
          />
        </Stack>
      </Paper>

      {/* قائمة الأذكار */}
      <Box>
        {category.azkar.map((z, i) => (
          <DhikrCard
            key={`${category.id}-${i}`}
            zikr={z}
            index={i}
            count={categoryProgress[i] ?? 0}
            onIncrement={() => increment(i, z.count)}
            onReset={() => resetZikr(i)}
          />
        ))}
      </Box>

      <Button onClick={resetCategory} startIcon={<ReplayIcon />} variant="outlined" color="inherit" sx={{ alignSelf: "flex-start" }}>
        إعادة تعيين تقدّم هذه الفئة
      </Button>
    </Stack>
  );
}

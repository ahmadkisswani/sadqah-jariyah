import { Box, Button, Chip, Paper, Stack, Typography, useTheme } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import { fonts } from "../theme";
import { toArabicNumber } from "../utils/arabic";
import type { Zikr } from "../data/azkar";

type Props = {
  zikr: Zikr;
  index: number;
  count: number;
  onIncrement: () => void;
  onReset: () => void;
};

/** بطاقة ذكر بمساحة نقر كبيرة وعدّاد تقدّم بصري. */
export function DhikrCard({ zikr, index, count, onIncrement, onReset }: Props) {
  const theme = useTheme();
  const done = count >= zikr.count;
  const progress = Math.min(1, count / zikr.count);
  const size = 84;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <Paper
      component="article"
      sx={{
        p: { xs: 2.5, sm: 3 },
        mb: 2,
        border: "1px solid",
        borderColor: done ? "secondary.main" : "divider",
        transition: "border-color .2s ease, background-color .2s ease",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Chip
          label={toArabicNumber(index + 1)}
          size="small"
          color={done ? "secondary" : "primary"}
          variant={done ? "filled" : "outlined"}
          sx={{ fontWeight: 700 }}
        />
        <Chip
          label={`التكرار: ${toArabicNumber(zikr.count)}`}
          size="small"
          variant="outlined"
          color="default"
        />
        {done && <CheckCircleIcon color="secondary" fontSize="small" />}
      </Stack>

      <Typography
        sx={{
          fontFamily: fonts.naskh,
          fontSize: { xs: "1.2rem", sm: "1.35rem" },
          lineHeight: 2.1,
          mb: 3,
        }}
      >
        {zikr.text}
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
        <Button
          onClick={onIncrement}
          disabled={done}
          variant={done ? "outlined" : "contained"}
          color={done ? "secondary" : "primary"}
          aria-label={`اضغط للذكر — ${count} من ${zikr.count}`}
          sx={{
            flexGrow: 1,
            minHeight: 56,
            fontSize: "1.05rem",
            position: "relative",
          }}
        >
          {done ? "تم الذكر" : "اضغط للتكرار"}
        </Button>

        <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={theme.palette.divider}
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={done ? theme.palette.secondary.main : theme.palette.primary.main}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: "stroke-dashoffset .25s ease" }}
            />
          </svg>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              lineHeight: 1,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "1.15rem" }}>
                {toArabicNumber(count)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                من {toArabicNumber(zikr.count)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Stack>

      {count > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <Button
            onClick={onReset}
            size="small"
            startIcon={<ReplayIcon />}
            color="inherit"
            sx={{ color: "text.secondary" }}
          >
            إعادة تعيين هذا الذكر
          </Button>
        </Box>
      )}
    </Paper>
  );
}

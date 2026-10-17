import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import {
  CALCULATION_METHODS,
  HIGH_LATITUDE_OPTIONS,
  methodName,
  suggestsHighLatitudeRule,
  type HighLatitudeSetting,
} from "../../data/prayer/methods";
import { OBLIGATORY_PRAYERS, STRINGS, prayerLabel, type Lang } from "../../data/prayer/labels";
import { clearPrayerCache } from "../../data/prayer/api";
import type { PrayerSettings } from "../../hooks/usePrayerSettings";

type Props = {
  lang: Lang;
  settings: PrayerSettings;
  onUpdate: (patch: Partial<PrayerSettings>) => void;
  onReset: () => void;
  onOpenLocation: () => void;
  /** طريقة الحساب الفعلية كما أعادها الخادم (بعد التلقائي). */
  effectiveMethodId: number | null;
  locationLabel: string;
  latitude: number | null;
};

/** منطقة إعدادات المواقيت: الموقع، الطريقة، المذهب، الصيغة، اللغة، والتعديلات. */
export function PrayerSettingsCard({
  lang,
  settings,
  onUpdate,
  onReset,
  onOpenLocation,
  effectiveMethodId,
  locationLabel,
  latitude,
}: Props) {
  const [adjustOpen, setAdjustOpen] = useState(false);

  const highLatSuggested = latitude !== null && suggestsHighLatitudeRule(latitude);

  const step = (key: (typeof OBLIGATORY_PRAYERS)[number], delta: number) => {
    const current = settings.tune[key] ?? 0;
    const next = Math.max(-30, Math.min(30, current + delta));
    onUpdate({ tune: { ...settings.tune, [key]: next } });
  };

  return (
    <Accordion
      component="section"
      aria-label={STRINGS.settings.ar}
      disableGutters
      sx={{
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} id="sj-prayer-settings">
        <Stack direction="row" spacing={1} alignItems="center">
          <SettingsIcon fontSize="small" color="primary" />
          <Typography variant="h6" component="h3" sx={{ fontWeight: 800 }}>
            {STRINGS.settings[lang]}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        <Stack spacing={2.5} divider={<Divider flexItem />}>
          {/* الموقع */}
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={1}>
            <Stack spacing={0.25}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {STRINGS.location[lang]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {locationLabel}
              </Typography>
            </Stack>
            <Button size="small" variant="outlined" startIcon={<EditLocationAltIcon />} onClick={onOpenLocation}>
              {STRINGS.changeLocation[lang]}
            </Button>
          </Stack>

          {/* طريقة الحساب */}
          <Stack spacing={0.75}>
            <FormControl fullWidth size="small">
              <InputLabel id="sj-method-label">{STRINGS.calculationMethod[lang]}</InputLabel>
              <Select
                labelId="sj-method-label"
                label={STRINGS.calculationMethod[lang]}
                value={settings.methodId === null ? "auto" : String(settings.methodId)}
                onChange={(event) => {
                  const value = event.target.value;
                  onUpdate({ methodId: value === "auto" ? null : Number(value) });
                }}
              >
                <MenuItem value="auto">{STRINGS.autoMethod[lang]}</MenuItem>
                {CALCULATION_METHODS.map((method) => (
                  <MenuItem key={method.id} value={String(method.id)}>
                    {lang === "ar" ? method.ar : method.en}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary">
              {STRINGS.effectiveMethod[lang]}:{" "}
              {effectiveMethodId !== null ? methodName(effectiveMethodId, lang) : "—"}
            </Typography>
          </Stack>

          {/* المذهب */}
          <Stack spacing={0.75}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {STRINGS.madhhab[lang]}
            </Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={String(settings.school)}
              onChange={(_, value) => {
                if (value !== null) onUpdate({ school: value === "1" ? 1 : 0 });
              }}
              aria-label={STRINGS.madhhab[lang]}
            >
              <ToggleButton value="0">{STRINGS.standard[lang]}</ToggleButton>
              <ToggleButton value="1">{STRINGS.hanafi[lang]}</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* قاعدة خطوط العرض العالية */}
          <Stack spacing={0.75}>
            <FormControl fullWidth size="small">
              <InputLabel id="sj-highlat-label">{STRINGS.highLatitude[lang]}</InputLabel>
              <Select
                labelId="sj-highlat-label"
                label={STRINGS.highLatitude[lang]}
                value={String(settings.highLatitude)}
                onChange={(event) => {
                  const value = event.target.value;
                  const parsed = value === "auto" ? "auto" : (Number(value) as HighLatitudeSetting);
                  onUpdate({ highLatitude: parsed });
                }}
              >
                {HIGH_LATITUDE_OPTIONS.map((option) => (
                  <MenuItem key={String(option.value)} value={String(option.value)}>
                    {lang === "ar" ? option.ar : option.en}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {highLatSuggested ? (
              <Typography variant="caption" color="text.secondary">
                {STRINGS.highLatitudeHint[lang]}
              </Typography>
            ) : null}
          </Stack>

          {/* صيغة الوقت واللغة */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Stack spacing={0.75}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {STRINGS.timeFormat[lang]}
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={settings.timeFormat}
                onChange={(_, value) => {
                  if (value !== null) onUpdate({ timeFormat: value });
                }}
                aria-label={STRINGS.timeFormat[lang]}
              >
                <ToggleButton value="12">{STRINGS.twelveHour[lang]}</ToggleButton>
                <ToggleButton value="24">{STRINGS.twentyFourHour[lang]}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            <Stack spacing={0.75}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {STRINGS.language[lang]}
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={settings.lang}
                onChange={(_, value) => {
                  if (value !== null) onUpdate({ lang: value });
                }}
                aria-label={STRINGS.language[lang]}
              >
                <ToggleButton value="ar">{STRINGS.arabic.ar}</ToggleButton>
                <ToggleButton value="en">{STRINGS.english.en}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>

          {/* تعديلات الدقائق (اختيارية) */}
          <Stack spacing={1}>
            <Button
              size="small"
              onClick={() => setAdjustOpen((value) => !value)}
              sx={{ alignSelf: "flex-start" }}
              aria-expanded={adjustOpen}
            >
              {STRINGS.adjustments[lang]}
            </Button>
            <Collapse in={adjustOpen}>
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  {STRINGS.adjustmentsHint[lang]}
                </Typography>
                {OBLIGATORY_PRAYERS.map((key) => {
                  const value = settings.tune[key] ?? 0;
                  const label = prayerLabel(key);
                  return (
                    <Stack
                      key={key}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography variant="body2">{label[lang]}</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Tooltip title="-">
                          <IconButton
                            size="small"
                            aria-label={`${label[lang]} -1`}
                            onClick={() => step(key, -1)}
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Typography
                          variant="body2"
                          dir="ltr"
                          sx={{ minWidth: 44, textAlign: "center", fontWeight: 700 }}
                        >
                          {value === 0 ? "0" : `${value > 0 ? "+" : ""}${value}`}
                        </Typography>
                        <Tooltip title="+">
                          <IconButton
                            size="small"
                            aria-label={`${label[lang]} +1`}
                            onClick={() => step(key, 1)}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  );
                })}
                {OBLIGATORY_PRAYERS.some((key) => (settings.tune[key] ?? 0) !== 0) ? (
                  <Typography variant="caption" color="text.secondary">
                    {lang === "ar"
                      ? "تُطبَّق التعديلات فورًا على المواقيت المعروضة."
                      : "Adjustments are applied to the displayed times immediately."}
                  </Typography>
                ) : null}
              </Stack>
            </Collapse>
          </Stack>

          {/* استعادة الافتراضي */}
          <Button
            color="inherit"
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={() => {
              clearPrayerCache();
              onReset();
            }}
            sx={{ alignSelf: "flex-start" }}
          >
            {STRINGS.reset[lang]}
          </Button>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

/** تنسيق مساعد لعرض الموقع في الإعدادات. */
export function settingsLocationLabel(
  location: { city: string; cityEn: string; country: string; countryEn: string } | null,
  lang: Lang,
): string {
  if (!location) return lang === "ar" ? "لم يُحدَّد بعد" : "Not set yet";
  const city = lang === "ar" ? location.city : location.cityEn;
  const country = lang === "ar" ? location.country : location.countryEn;
  return `${city}${country ? ` — ${country}` : ""}`;
}

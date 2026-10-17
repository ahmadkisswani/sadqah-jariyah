import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PlaceIcon from "@mui/icons-material/Place";
import { COUNTRIES, type CityEntry, type CountryEntry, type ManualCity } from "../../data/prayer/locations";
import type { ResolvedLocation } from "../../data/prayer/location";
import { STRINGS, type Lang } from "../../data/prayer/labels";
import type { GeolocationPermission, LocationStatus } from "../../hooks/useLocationResolver";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  location: ResolvedLocation | null;
  status: LocationStatus;
  permission: GeolocationPermission;
  busy: boolean;
  notice: string | null;
  onRequestPrecise: () => void;
  onUseManualCity: (city: ManualCity) => void;
  onUseCoordinates: (latitude: number, longitude: number) => Promise<boolean>;
};

/**
 * نافذة اختيار الموقع: الدقيق تلقائيًا، أو مدينة من قائمة جاهزة، أو إحداثيات يدوية.
 * كل الاختيارات تُحفظ محليًا في هذا الجهاز فقط.
 */
export function LocationDialog({
  open,
  onClose,
  lang,
  location,
  status,
  permission,
  busy,
  notice,
  onRequestPrecise,
  onUseManualCity,
  onUseCoordinates,
}: Props) {
  const [country, setCountry] = useState<CountryEntry | null>(null);
  const [city, setCity] = useState<CityEntry | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [coordsError, setCoordsError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCoordsError(null);
    }
  }, [open]);

  const currentLine = useMemo(() => {
    if (!location) return null;
    const cityName = lang === "ar" ? location.city : location.cityEn;
    const countryName = lang === "ar" ? location.country : location.countryEn;
    return `${cityName}${countryName ? ` — ${countryName}` : ""} (${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)})`;
  }, [location, lang]);

  const applyCoordinates = async () => {
    const lat = Number(latitude.replace(",", "."));
    const lng = Number(longitude.replace(",", "."));
    const valid =
      Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    if (!valid) {
      setCoordsError(STRINGS.invalidCoordinates[lang]);
      return;
    }
    setCoordsError(null);
    const ok = await onUseCoordinates(lat, lng);
    if (ok) onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="sj-location-title">
      <DialogTitle id="sj-location-title" sx={{ display: "flex", alignItems: "center", gap: 1, pe: 6 }}>
        <PlaceIcon color="primary" />
        {STRINGS.location[lang]}
        <IconButton
          aria-label={STRINGS.close[lang]}
          onClick={onClose}
          sx={{ position: "absolute", insetInlineEnd: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {currentLine ? (
            <Typography variant="body2" color="text.secondary">
              {lang === "ar" ? "الموقع الحالي" : "Current location"}: {currentLine}
            </Typography>
          ) : null}

          {notice ? <Alert severity="info">{notice}</Alert> : null}

          {/* 1) الموقع الدقيق */}
          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {lang === "ar" ? "١. موقعك الدقيق (GPS)" : "1. Your precise location (GPS)"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {STRINGS.useGpsExplain[lang]}
            </Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <MyLocationIcon />}
                onClick={onRequestPrecise}
                disabled={busy || status === "resolving"}
              >
                {STRINGS.useMyLocation[lang]}
              </Button>
            </Box>
            {permission === "denied" ? (
              <Typography variant="caption" color="error">
                {STRINGS.locationDenied[lang]}
              </Typography>
            ) : null}
          </Stack>

          <Divider>
            <Typography variant="caption" color="text.secondary">
              {lang === "ar" ? "أو" : "or"}
            </Typography>
          </Divider>

          {/* 2) اختيار المدينة */}
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {lang === "ar" ? "٢. اختيار الدولة والمدينة" : "2. Pick a country and city"}
            </Typography>
            <Autocomplete
              options={COUNTRIES}
              value={country}
              onChange={(_, value) => {
                setCountry(value);
                setCity(null);
              }}
              getOptionLabel={(option) => (lang === "ar" ? option.ar : option.en)}
              filterOptions={(options, state) => {
                const query = state.inputValue.trim();
                if (!query) return options;
                const lower = query.toLowerCase();
                return options.filter(
                  (option) => option.ar.includes(query) || option.en.toLowerCase().includes(lower),
                );
              }}
              isOptionEqualToValue={(option, value) => option.code === value.code}
              renderInput={(params) => (
                <TextField {...params} label={STRINGS.country[lang]} size="small" />
              )}
            />
            <Autocomplete
              options={country?.cities ?? []}
              value={city}
              disabled={!country}
              onChange={(_, value) => {
                setCity(value);
                if (value && country) {
                  onUseManualCity({
                    countryCode: country.code,
                    country: country.ar,
                    countryEn: country.en,
                    city: value.ar,
                    cityEn: value.en,
                    latitude: value.latitude,
                    longitude: value.longitude,
                  });
                  onClose();
                }
              }}
              getOptionLabel={(option) => (lang === "ar" ? option.ar : option.en)}
              filterOptions={(options, state) => {
                const query = state.inputValue.trim();
                if (!query) return options;
                const lower = query.toLowerCase();
                return options.filter(
                  (option) => option.ar.includes(query) || option.en.toLowerCase().includes(lower),
                );
              }}
              isOptionEqualToValue={(option, value) =>
                option.latitude === value.latitude && option.longitude === value.longitude
              }
              renderInput={(params) => (
                <TextField {...params} label={STRINGS.city[lang]} size="small" />
              )}
            />
            <Typography variant="caption" color="text.secondary">
              {lang === "ar"
                ? "المواقيت تُحسب لمركز المدينة؛ للدقة الأقصى استخدم موقعك الدقيق."
                : "Times are calculated for the city centre; use your precise location for best accuracy."}
            </Typography>
          </Stack>

          <Divider>
            <Typography variant="caption" color="text.secondary">
              {lang === "ar" ? "أو" : "or"}
            </Typography>
          </Divider>

          {/* 3) إحداثيات يدوية */}
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {lang === "ar" ? "٣. إحداثيات يدوية" : "3. Manual coordinates"}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label={STRINGS.latitude[lang]}
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                size="small"
                fullWidth
                inputProps={{ inputMode: "decimal", dir: "ltr" }}
                placeholder="31.95"
              />
              <TextField
                label={STRINGS.longitude[lang]}
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                size="small"
                fullWidth
                inputProps={{ inputMode: "decimal", dir: "ltr" }}
                placeholder="35.91"
              />
            </Stack>
            {coordsError ? (
              <Typography variant="caption" color="error">
                {coordsError}
              </Typography>
            ) : null}
            <Box>
              <Button variant="outlined" onClick={applyCoordinates} disabled={busy}>
                {STRINGS.apply[lang]}
              </Button>
            </Box>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{STRINGS.close[lang]}</Button>
      </DialogActions>
    </Dialog>
  );
}

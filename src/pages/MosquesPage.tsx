import { lazy, Suspense, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Link,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import MapIcon from "@mui/icons-material/Map";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import PlaceIcon from "@mui/icons-material/Place";
import DirectionsIcon from "@mui/icons-material/Directions";
import PhoneIcon from "@mui/icons-material/Phone";
import LanguageIcon from "@mui/icons-material/Language";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { SectionHeader } from "../components/SectionHeader";
import { ShareButton } from "../components/ShareButton";
import { LocationDialog } from "../components/prayer/LocationDialog";
import { usePrayerSettings } from "../hooks/usePrayerSettings";
import { useLocationResolver } from "../hooks/useLocationResolver";
import { useMosques } from "../hooks/useMosques";
import { geolocationEnvironment } from "../data/prayer/location";
import { STRINGS } from "../data/prayer/labels";
import {
  MOSQUE_RADII_KM,
  directionsLink,
  osmMapLink,
  type Mosque,
  type MosqueRadiusKm,
} from "../data/mosques/api";
import { formatDistance } from "../utils/geo";
import { toArabicNumber } from "../utils/arabic";
import { primaryText } from "../theme";

const MosqueMap = lazy(() => import("../components/mosques/MosqueMap"));

const COPY = {
  ar: {
    title: "المساجد القريبة",
    subtitle:
      "اعثر على المساجد وأماكن الصلاة حول موقعك من بيانات OpenStreetMap المفتوحة. البحث لا يبدأ إلا بضغطتك.",
    search: "ابحث عن المساجد القريبة",
    searching: "جارٍ البحث…",
    refresh: "تحديث",
    showMap: "عرض الخريطة",
    hideMap: "إخفاء الخريطة",
    radius: "نطاق البحث",
    results: (count: number, radius: number) =>
      `${count} نتيجة ضمن ${toArabicNumber(radius)} كم`,
    cached: "عرض من ذاكرة الجهاز — قد لا تكون النتائج محدّثة.",
    stale: "تعذّر تحديث النتائج؛ تُعرض آخر نتيجة محفوظة على جهازك.",
    empty: "لم نجد مساجد في هذا النطاق. جرّب نطاقًا أوسع أو افتح الخريطة.",
    osm: "افتح خريطة OpenStreetMap",
    directions: "الاتجاهات",
    call: "اتصال",
    website: "الموقع",
    showOnMap: "على الخريطة",
    noLocation: "حدّد موقعك أولًا لعرض المساجد القريبة.",
    locationHint: "يُستخدم موقعك لحظة البحث فقط، ولا يُحفظ سجل للمواقع التي تبحث فيها.",
    attribution:
      "بيانات الخرائط © مساهمو OpenStreetMap (رخصة ODbL). التغطية تختلف بين المدن وقد لا تشمل كل المساجد.",
    privacy:
      "لا نرسل أي معرّف عنك؛ يرسل البحث إحداثيات مقرّبة ونصف القطر فقط، وتُحفظ النتائج مؤقتًا على جهازك.",
    details: "تفاصيل",
    openNow: "أوقات العمل",
    denomination: "الطائفة",
  },
  en: {
    title: "Nearby Mosques",
    subtitle:
      "Find mosques and prayer spaces around you using open OpenStreetMap data. Search only starts when you tap the button.",
    search: "Search nearby mosques",
    searching: "Searching…",
    refresh: "Refresh",
    showMap: "Show map",
    hideMap: "Hide map",
    radius: "Search radius",
    results: (count: number, radius: number) => `${count} result(s) within ${radius} km`,
    cached: "Showing results saved on this device — they may be out of date.",
    stale: "Could not refresh; showing the last result saved on your device.",
    empty: "No mosques found in this radius. Try a wider radius or open the map.",
    osm: "Open the OpenStreetMap map",
    directions: "Directions",
    call: "Call",
    website: "Website",
    showOnMap: "On map",
    noLocation: "Set your location first to show nearby mosques.",
    locationHint: "Your location is used only while searching; no search location history is stored.",
    attribution:
      "Map data © OpenStreetMap contributors (ODbL). Coverage varies by city and may not include every mosque.",
    privacy:
      "No identifier is sent. A search sends rounded coordinates and a radius only; results are cached temporarily on your device.",
    details: "Details",
    openNow: "Opening hours",
    denomination: "Denomination",
  },
} as const;

export default function MosquesPage() {
  const { settings, update } = usePrayerSettings();
  const lang = settings.lang;
  const copy = COPY[lang];
  const location = settings.location;
  const resolver = useLocationResolver({ location, onChange: update });
  const [radius, setRadius] = useState<MosqueRadiusKm>(3);
  const { result, loading, error, search } = useMosques(location, radius);
  const [mapVisible, setMapVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const cardsRef = useRef(new Map<string, HTMLElement>());

  const gpsInsecure = geolocationEnvironment() === "insecure";
  const mosques = result?.mosques ?? [];

  const showOnMap = (mosque: Mosque) => {
    setSelectedId(mosque.id);
    setMapVisible(true);
  };

  const focusCard = (mosque: Mosque) => {
    setSelectedId(mosque.id);
    const element = cardsRef.current.get(mosque.id);
    element?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <Stack spacing={4}>
      <SectionHeader level="h1" title={copy.title} subtitle={copy.subtitle} />

      {!location && resolver.status === "resolving" ? (
        <Paper sx={{ p: 2, borderRadius: 4, border: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              {STRINGS.locatingNow[lang]}
            </Typography>
          </Stack>
        </Paper>
      ) : null}

      {!location && resolver.status !== "resolving" ? (
        <Paper
          component="section"
          aria-label={STRINGS.location[lang]}
          sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
        >
          <Stack spacing={1.5} alignItems="flex-start">
            <Stack direction="row" spacing={1} alignItems="center">
              <PlaceIcon aria-hidden sx={{ color: (theme) => primaryText(theme.palette.mode) }} />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
                {copy.noLocation}
              </Typography>
            </Stack>
            {gpsInsecure ? (
              <Alert severity="warning" sx={{ borderRadius: 3, width: "100%" }}>
                {STRINGS.locationInsecure[lang]}
              </Alert>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {resolver.notice ?? copy.locationHint}
              </Typography>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="contained"
                startIcon={
                  resolver.busy ? <CircularProgress size={16} color="inherit" /> : <MyLocationIcon />
                }
                onClick={() => void resolver.requestPrecise()}
                disabled={resolver.busy || gpsInsecure}
              >
                {resolver.busy ? STRINGS.locatingNow[lang] : STRINGS.useMyLocation[lang]}
              </Button>
              <Button
                variant="outlined"
                startIcon={<EditLocationAltIcon />}
                onClick={() => setLocationDialogOpen(true)}
              >
                {STRINGS.chooseManually[lang]}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      {location ? (
        <Paper
          component="section"
          aria-label={copy.search}
          sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
        >
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.25}
              alignItems={{ xs: "stretch", sm: "center" }}
              flexWrap="wrap"
              rowGap={1}
            >
              <Button
                variant="contained"
                startIcon={
                  loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />
                }
                onClick={() => void search()}
                disabled={loading}
              >
                {loading ? copy.searching : copy.search}
              </Button>
              <TextField
                select
                size="small"
                label={copy.radius}
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value) as MosqueRadiusKm)}
                sx={{ minWidth: 150 }}
              >
                {MOSQUE_RADII_KM.map((value) => (
                  <MenuItem key={value} value={value}>
                    {lang === "ar" ? `${toArabicNumber(value)} كم` : `${value} km`}
                  </MenuItem>
                ))}
              </TextField>
              {result ? (
                <Button
                  variant="text"
                  startIcon={<RefreshIcon />}
                  onClick={() => void search({ force: true })}
                  disabled={loading}
                >
                  {copy.refresh}
                </Button>
              ) : null}
              {location ? (
                <Button
                  variant="outlined"
                  startIcon={<MapIcon />}
                  onClick={() => setMapVisible((value) => !value)}
                  aria-pressed={mapVisible}
                >
                  {mapVisible ? copy.hideMap : copy.showMap}
                </Button>
              ) : null}
              <Chip
                icon={<PlaceIcon />}
                label={lang === "ar" ? location.city : location.cityEn}
                variant="outlined"
                onClick={() => setLocationDialogOpen(true)}
                clickable
                sx={{ maxWidth: 220 }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {copy.locationHint}
            </Typography>
          </Stack>
        </Paper>
      ) : null}

      {error ? (
        <Alert
          severity="warning"
          sx={{ borderRadius: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              component="a"
              href={location ? osmMapLink(location) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<OpenInNewIcon />}
            >
              {copy.osm}
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      {result?.stale ? (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          {copy.stale}
        </Alert>
      ) : null}

      {result ? (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
          <Typography
            variant="subtitle1"
            component="h2"
            data-mosque-count={result.mosques.length}
            sx={{ fontWeight: 800 }}
          >
            {copy.results(result.mosques.length, radius)}
          </Typography>
          {result.source === "cache" ? (
            <Chip size="small" variant="outlined" label={copy.cached} />
          ) : null}
        </Stack>
      ) : null}

      {mapVisible && location ? (
        <Suspense fallback={<Skeleton variant="rounded" height={360} />}>
          <MosqueMap
            user={location}
            mosques={mosques}
            lang={lang}
            selectedId={selectedId}
            onSelect={focusCard}
          />
        </Suspense>
      ) : null}

      {result && mosques.length === 0 ? (
        <Alert
          severity="info"
          sx={{ borderRadius: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              component="a"
              href={location ? osmMapLink(location) : undefined}
              target="_blank"
              rel="noopener noreferrer"
            >
              {copy.osm}
            </Button>
          }
        >
          {copy.empty}
        </Alert>
      ) : null}

      {mosques.length > 0 ? (
        <Stack component="ol" spacing={2} sx={{ listStyle: "none", p: 0, m: 0 }}>
          {mosques.map((mosque, index) => {
            const selected = selectedId === mosque.id;
            return (
              <Paper
                component="li"
                key={mosque.id}
                data-mosque-id={mosque.id}
                ref={(element: HTMLElement | null) => {
                  if (element) cardsRef.current.set(mosque.id, element);
                  else cardsRef.current.delete(mosque.id);
                }}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: selected ? "secondary.main" : "divider",
                  transition: "border-color 160ms ease, transform 160ms ease",
                  "&:hover": { transform: "translateY(-2px)" },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    aria-hidden
                    sx={{
                      width: 38,
                      height: 38,
                      flexShrink: 0,
                      borderRadius: "12px",
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "rgba(31,93,76,0.1)",
                      color: (theme) => primaryText(theme.palette.mode),
                      fontWeight: 800,
                    }}
                  >
                    {lang === "ar" ? toArabicNumber(index + 1) : index + 1}
                  </Box>
                  <Stack spacing={0.75} sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      rowGap={0.5}
                    >
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 800, lineHeight: 1.4 }}>
                        {mosque.name}
                      </Typography>
                      <Chip
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={formatDistance(mosque.distanceKm, lang)}
                      />
                    </Stack>
                    {mosque.nameEn && mosque.nameEn !== mosque.name ? (
                      <Typography variant="caption" color="text.secondary" dir="ltr" sx={{ textAlign: "start" }}>
                        {mosque.nameEn}
                      </Typography>
                    ) : null}
                    {mosque.address ? (
                      <Typography variant="body2" color="text.secondary">
                        {mosque.address}
                      </Typography>
                    ) : null}
                    <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={0.5}>
                      {mosque.openingHours ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${copy.openNow}: ${mosque.openingHours}`}
                        />
                      ) : null}
                      {mosque.denomination ? (
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${copy.denomination}: ${mosque.denomination}`}
                        />
                      ) : null}
                    </Stack>
                    <Divider sx={{ my: 0.5 }} />
                    <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<DirectionsIcon />}
                        component="a"
                        href={location ? directionsLink(location, mosque) : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {copy.directions}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<MapIcon />}
                        onClick={() => showOnMap(mosque)}
                      >
                        {copy.showOnMap}
                      </Button>
                      {mosque.phone ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PhoneIcon />}
                          component="a"
                          href={`tel:${mosque.phone.replace(/[^\d+]/g, "")}`}
                        >
                          {copy.call}
                        </Button>
                      ) : null}
                      {mosque.website ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<LanguageIcon />}
                          component="a"
                          href={mosque.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {copy.website}
                        </Button>
                      ) : null}
                      <ShareButton
                        size="small"
                        text={`${mosque.name}${mosque.address ? ` — ${mosque.address}` : ""}\n${
                          location ? directionsLink(location, mosque) : ""
                        }`}
                        label={lang === "ar" ? "مشاركة" : "Share"}
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      ) : null}

      <Stack spacing={1}>
        <Typography variant="caption" color="text.secondary">
          {copy.attribution}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {copy.privacy}
        </Typography>
        {location ? (
          <Link
            href={osmMapLink(location)}
            target="_blank"
            rel="noopener noreferrer"
            variant="caption"
          >
            {copy.osm}
          </Link>
        ) : null}
      </Stack>

      <LocationDialog
        open={locationDialogOpen}
        onClose={() => setLocationDialogOpen(false)}
        lang={lang}
        location={location}
        status={resolver.status}
        permission={resolver.permission}
        busy={resolver.busy}
        notice={resolver.notice}
        onRequestPrecise={() => void resolver.requestPrecise()}
        onUseManualCity={(city) => {
          resolver.useManualCity(city);
          setLocationDialogOpen(false);
        }}
        onUseCoordinates={async (latitude, longitude) => {
          const ok = await resolver.useCoordinates(latitude, longitude);
          if (ok) setLocationDialogOpen(false);
          return ok;
        }}
      />
    </Stack>
  );
}

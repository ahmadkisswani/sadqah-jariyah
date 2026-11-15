import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ExploreIcon from "@mui/icons-material/Explore";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import EditLocationAltIcon from "@mui/icons-material/EditLocationAlt";
import PlaceIcon from "@mui/icons-material/Place";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { SectionHeader } from "../components/SectionHeader";
import { ShareButton } from "../components/ShareButton";
import { LocationDialog } from "../components/prayer/LocationDialog";
import { usePrayerSettings } from "../hooks/usePrayerSettings";
import { useLocationResolver } from "../hooks/useLocationResolver";
import { geolocationEnvironment } from "../data/prayer/location";
import { STRINGS } from "../data/prayer/labels";
import {
  adjustHeadingForScreen,
  compassDirection,
  distanceToKaaba,
  formatDistance,
  headingFromOrientation,
  qiblaBearing,
  smoothHeading,
} from "../utils/geo";
import { toArabicNumber } from "../utils/arabic";
import { primaryText } from "../theme";

type SensorState = "idle" | "requesting" | "active" | "unsupported" | "denied" | "error";

type PermissionCapableOrientation = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

type CompassEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };

const COPY = {
  ar: {
    title: "اتجاه القبلة",
    subtitle:
      "اتجاه الكعبة من موقعك بالدرجات من الشمال. البوصلة تعمل على الجهاز فقط، ولا يُرسل موقعك إلى أي خدمة.",
    enable: "تفعيل البوصلة",
    requesting: "جارٍ طلب الإذن…",
    active: "البوصلة تعمل",
    unsupported: "هذا الجهاز أو المتصفح لا يوفّر بوصلة رقمية.",
    denied: "لم يُسمح باستخدام البوصلة. يمكنك الاعتماد على الدرجة الرقمية أدناه.",
    error: "تعذّر تشغيل البوصلة. جرّب إعادة التحميل أو استخدم الدرجة الرقمية.",
    waiting: "بانتظار إشارة البوصلة… حرّك الجهاز على شكل رقم ٨ إن لم تظهر.",
    bearing: "اتجاه القبلة من الشمال",
    distance: "المسافة إلى الكعبة",
    deviceHeading: "اتجاه الجهاز الحالي",
    turn: "أدر الجهاز",
    right: "إلى اليمين",
    left: "إلى اليسار",
    aligned: "الجهاز متجه نحو القبلة تقريبًا",
    location: "الموقع المستخدم",
    change: "تغيير الموقع",
    noLocation: "حدّد موقعك أولًا لحساب اتجاه القبلة.",
    calibrationTitle: "لنتيجة أدق",
    calibration: [
      "ضع الجهاز أفقيًا وبعيدًا عن المعادن والمغناطيس.",
      "حرّك الجهاز على شكل رقم ٨ لمعايرة البوصلة.",
      "قد يختلف الاتجاه قليلًا بسبب حساس الجهاز؛ تحقّق من الدرجة الرقمية عند الشك.",
    ],
    method:
      "الحساب يعتمد على المسافة الكبرى بين موقعك والكعبة، ويشير إلى الشمال الحقيقي. البوصلة المغناطيسية قد تنحرف قليلًا حسب المكان.",
    share: "شارك اتجاه القبلة",
    sensorNote:
      "لا نستخدم البوصلة إلا بعد ضغطك على الزر، ولا نحفظ أي قراءات أو سجل للحركة.",
  },
  en: {
    title: "Qibla Direction",
    subtitle:
      "The Kaaba direction from your location in degrees from north. The compass runs on your device only; your location is not sent anywhere.",
    enable: "Enable compass",
    requesting: "Requesting permission…",
    active: "Compass active",
    unsupported: "This device or browser does not provide a digital compass.",
    denied: "Compass permission was denied. Use the numeric bearing below.",
    error: "Could not start the compass. Try reloading or use the numeric bearing.",
    waiting: "Waiting for a compass signal… move the device in a figure 8 if nothing appears.",
    bearing: "Qibla bearing from north",
    distance: "Distance to the Kaaba",
    deviceHeading: "Current device heading",
    turn: "Turn the device",
    right: "right",
    left: "left",
    aligned: "The device is roughly facing the Qibla",
    location: "Location used",
    change: "Change location",
    noLocation: "Set your location first to calculate the Qibla direction.",
    calibrationTitle: "For a better result",
    calibration: [
      "Hold the device flat, away from metal and magnets.",
      "Move the device in a figure 8 to calibrate the compass.",
      "Sensor accuracy varies; rely on the numeric bearing when in doubt.",
    ],
    method:
      "The calculation uses the great-circle bearing from your location to the Kaaba and refers to true north. A magnetic compass may deviate slightly by place.",
    share: "Share Qibla direction",
    sensorNote:
      "The compass is used only after you press the button; no readings or movement history are stored.",
  },
} as const;

const degrees = (value: number, lang: "ar" | "en") =>
  `${lang === "ar" ? toArabicNumber(Math.round(value)) : Math.round(value)}°`;

export default function QiblaPage() {
  const { settings, update } = usePrayerSettings();
  const lang = settings.lang;
  const copy = COPY[lang];
  const location = settings.location;
  const resolver = useLocationResolver({ location, onChange: update });
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [sensorState, setSensorState] = useState<SensorState>("idle");
  const [enabled, setEnabled] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);
  const [waitedLong, setWaitedLong] = useState(false);
  const headingRef = useRef<number | null>(null);

  const bearing = useMemo(() => (location ? qiblaBearing(location) : null), [location]);
  const distance = useMemo(() => (location ? distanceToKaaba(location) : null), [location]);

  const sensorSupported =
    typeof window !== "undefined" && "DeviceOrientationEvent" in window;

  useEffect(() => {
    if (!sensorSupported) {
      setSensorState("unsupported");
      return;
    }
    if (!enabled) return;

    const handle = (event: Event) => {
      const orientation = event as CompassEvent;
      const raw = headingFromOrientation(orientation);
      if (raw === null) return;
      const screenAngle =
        (window.screen.orientation as ScreenOrientation | undefined)?.angle ??
        (window as Window & { orientation?: number }).orientation ??
        0;
      const next = adjustHeadingForScreen(raw, screenAngle);
      const smoothed = smoothHeading(headingRef.current, next);
      headingRef.current = smoothed;
      setHeading(smoothed);
      setSensorState("active");
    };

    window.addEventListener("deviceorientationabsolute", handle, true);
    window.addEventListener("deviceorientation", handle, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handle, true);
      window.removeEventListener("deviceorientation", handle, true);
    };
  }, [enabled, sensorSupported]);

  useEffect(() => {
    if (!enabled || heading !== null) {
      setWaitedLong(false);
      return;
    }
    const timer = window.setTimeout(() => setWaitedLong(true), 3500);
    return () => window.clearTimeout(timer);
  }, [enabled, heading]);

  const enableCompass = async () => {
    if (!sensorSupported) {
      setSensorState("unsupported");
      return;
    }
    setSensorState("requesting");
    const orientationConstructor = window.DeviceOrientationEvent as PermissionCapableOrientation;
    try {
      if (typeof orientationConstructor.requestPermission === "function") {
        const permission = await orientationConstructor.requestPermission();
        if (permission !== "granted") {
          setSensorState("denied");
          return;
        }
      }
      setEnabled(true);
      setSensorState("active");
    } catch {
      setSensorState("error");
    }
  };

  const turn =
    bearing !== null && heading !== null
      ? ((bearing - heading + 540) % 360) - 180
      : null;
  const gpsInsecure = geolocationEnvironment() === "insecure";

  const sensorMessage = (() => {
    if (sensorState === "unsupported") return { severity: "info" as const, text: copy.unsupported };
    if (sensorState === "denied") return { severity: "warning" as const, text: copy.denied };
    if (sensorState === "error") return { severity: "warning" as const, text: copy.error };
    if (enabled && heading === null && waitedLong)
      return { severity: "info" as const, text: copy.waiting };
    return null;
  })();

  return (
    <Stack spacing={4}>
      <SectionHeader
        level="h1"
        title={copy.title}
        subtitle={copy.subtitle}
        action={
          bearing !== null ? (
            <ShareButton
              size="small"
              text={`${copy.title}: ${degrees(bearing, lang)} ${compassDirection(bearing, lang)}${
                location ? ` — ${lang === "ar" ? location.city : location.cityEn}` : ""
              }`}
              label={copy.share}
            />
          ) : undefined
        }
      />

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
          aria-label={copy.noLocation}
          sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
        >
          <Stack spacing={1.5} alignItems="flex-start">
            <Stack direction="row" spacing={1} alignItems="center">
              <ExploreIcon aria-hidden sx={{ color: (theme) => primaryText(theme.palette.mode) }} />
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
                {resolver.notice ?? copy.sensorNote}
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

      {location && bearing !== null && distance !== null ? (
        <>
          <Paper
            sx={{
              p: { xs: 2.5, md: 3.5 },
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <Stack spacing={2.5} alignItems="center">
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                rowGap={1}
                justifyContent="center"
              >
                <Chip
                  icon={<PlaceIcon />}
                  label={lang === "ar" ? location.city : location.cityEn}
                  variant="outlined"
                  onClick={() => setLocationDialogOpen(true)}
                  clickable
                />
                <Chip
                  icon={<ExploreIcon />}
                  color="secondary"
                  label={`${copy.bearing}: ${degrees(bearing, lang)}`}
                />
                <Chip
                  variant="outlined"
                  label={`${copy.distance}: ${formatDistance(distance, lang)}`}
                />
              </Stack>

              <Box
                className="sj-compass"
                data-qibla-bearing={Math.round(bearing)}
                role="img"
                aria-label={`${copy.bearing}: ${degrees(bearing, lang)} ${compassDirection(
                  bearing,
                  lang,
                )}`}
              >
                <Box
                  className="sj-compass__rose"
                  sx={{ transform: `rotate(${heading === null ? 0 : -heading}deg)` }}
                >
                  <svg viewBox="0 0 240 240" width="100%" height="100%" aria-hidden="true">
                    <circle cx="120" cy="120" r="114" fill="none" stroke="currentColor" strokeOpacity="0.16" strokeWidth="2" />
                    <circle cx="120" cy="120" r="96" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="1" />
                    {Array.from({ length: 72 }, (_, index) => {
                      const angle = index * 5;
                      const major = index % 9 === 0;
                      return (
                        <line
                          key={angle}
                          x1="120"
                          y1={major ? 10 : 14}
                          x2="120"
                          y2={major ? 24 : 20}
                          stroke="currentColor"
                          strokeOpacity={major ? 0.6 : 0.25}
                          strokeWidth={major ? 2 : 1}
                          transform={`rotate(${angle} 120 120)`}
                        />
                      );
                    })}
                    <text x="120" y="42" textAnchor="middle" fontSize="16" fontWeight="800" fill="currentColor">
                      {lang === "ar" ? "ش" : "N"}
                    </text>
                    <text x="202" y="125" textAnchor="middle" fontSize="14" fill="currentColor" opacity="0.7">
                      {lang === "ar" ? "ق" : "E"}
                    </text>
                    <text x="120" y="208" textAnchor="middle" fontSize="14" fill="currentColor" opacity="0.7">
                      {lang === "ar" ? "ج" : "S"}
                    </text>
                    <text x="38" y="125" textAnchor="middle" fontSize="14" fill="currentColor" opacity="0.7">
                      {lang === "ar" ? "غ" : "W"}
                    </text>
                  </svg>
                  <Box
                    className="sj-compass__needle"
                    sx={{ transform: `rotate(${bearing}deg)` }}
                  >
                    <svg viewBox="0 0 240 240" width="100%" height="100%" aria-hidden="true">
                      <polygon points="120,30 130,104 120,96 110,104" fill="#C9A24B" />
                      <rect x="112" y="20" width="16" height="16" rx="3" fill="#1F5D4C" stroke="#C9A24B" strokeWidth="2" />
                      <text x="120" y="32" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff">
                        ﷽
                      </text>
                    </svg>
                  </Box>
                </Box>
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: "50% auto auto 50%",
                    transform: "translate(-50%, -50%)",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    bgcolor: "background.paper",
                    border: "3px solid",
                    borderColor: "secondary.main",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  }}
                />
              </Box>

              <Stack spacing={1} alignItems="center" textAlign="center">
                {heading !== null ? (
                  <Typography variant="body2" color="text.secondary">
                    {copy.deviceHeading}: {degrees(heading, lang)}
                  </Typography>
                ) : null}
                {turn !== null ? (
                  <Typography
                    variant="h6"
                    component="p"
                    sx={{ fontWeight: 800, color: (theme) => primaryText(theme.palette.mode) }}
                  >
                    {Math.abs(turn) < 4
                      ? copy.aligned
                      : `${copy.turn} ${degrees(Math.abs(turn), lang)} ${
                          turn > 0 ? copy.right : copy.left
                        }`}
                  </Typography>
                ) : null}
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460 }}>
                  {copy.method}
                </Typography>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={
                    sensorState === "requesting" ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <ExploreIcon />
                    )
                  }
                  onClick={() => void enableCompass()}
                  disabled={sensorState === "requesting" || sensorState === "unsupported"}
                >
                  {sensorState === "requesting"
                    ? copy.requesting
                    : heading === null
                      ? copy.enable
                      : copy.active}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EditLocationAltIcon />}
                  onClick={() => setLocationDialogOpen(true)}
                >
                  {copy.change}
                </Button>
              </Stack>

              {sensorMessage ? (
                <Alert severity={sensorMessage.severity} sx={{ borderRadius: 3, width: "100%" }}>
                  {sensorMessage.text}
                </Alert>
              ) : null}
            </Stack>
          </Paper>

          <Paper
            component="section"
            aria-label={copy.calibrationTitle}
            sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
          >
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1} alignItems="center">
                <InfoOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 800 }}>
                  {copy.calibrationTitle}
                </Typography>
              </Stack>
              <Box component="ul" sx={{ m: 0, ps: 2.5, color: "text.secondary" }}>
                {copy.calibration.map((item) => (
                  <Typography key={item} component="li" variant="body2" sx={{ lineHeight: 1.9 }}>
                    {item}
                  </Typography>
                ))}
              </Box>
              <Divider />
              <Typography variant="caption" color="text.secondary">
                {copy.sensorNote}
              </Typography>
            </Stack>
          </Paper>
        </>
      ) : null}

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

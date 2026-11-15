import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { useSnack } from "../../hooks/useSnack";
import { prayerLabel, type Lang } from "../../data/prayer/labels";
import type { PrayerInstant } from "../../utils/prayer";
import { formatClock, formatCountdownShort } from "../../utils/prayer";

type ReminderSettings = {
  enabled: boolean;
  leadMinutes: 0 | 5 | 10 | 15;
};

const STORAGE_KEY = "sj-prayer-reminders-v1";
const DEFAULT_SETTINGS: ReminderSettings = { enabled: false, leadMinutes: 10 };
const LEAD_OPTIONS = [0, 5, 10, 15] as const;

type PermissionState = NotificationPermission | "unsupported";

function normalize(stored: ReminderSettings | null): ReminderSettings {
  const lead = Number(stored?.leadMinutes);
  return {
    enabled: stored?.enabled === true,
    leadMinutes: LEAD_OPTIONS.includes(lead as (typeof LEAD_OPTIONS)[number])
      ? (lead as ReminderSettings["leadMinutes"])
      : DEFAULT_SETTINGS.leadMinutes,
  };
}

const COPY = {
  ar: {
    title: "تذكير الصلاة",
    subtitle: "تنبيه محلي قبل الأذان أو عنده، يعمل أثناء فتح الموقع فقط.",
    enable: "تفعيل التذكير",
    lead: "التنبيه قبل",
    atTime: "عند الأذان",
    minutes: (value: number) => `${value} دقائق`,
    next: "التذكير القادم",
    in: "بعد",
    unsupported: "متصفحك لا يدعم الإشعارات المحلية. سيبقى جدول المواقيت والعدّ التنازلي متاحين.",
    denied: "الإشعارات متوقّفة من إعدادات المتصفح. يمكنك تفعيلها من أيقونة القفل بجوار العنوان.",
    granted: "الإشعارات مسموحة",
    default: "لم يُطلب إذن الإشعارات بعد",
    note: "لا نستخدم إشعارات خلفية ولا نرسل شيئًا إلى خادم. على iPhone قد تحتاج إلى تثبيت الموقع كتطبيق أولًا.",
    enabledSnack: "تم تفعيل تذكير الصلاة",
    deniedSnack: "لم يُسمح بالإشعارات — يمكنك متابعة العدّ التنازلي في الصفحة.",
    reminderDue: "حان وقت التذكير",
    timezone: "بتوقيت موقعك",
    clock: "الوقت",
  },
  en: {
    title: "Prayer reminder",
    subtitle: "A local alert before or at the adhan; it works while the site is open.",
    enable: "Enable reminder",
    lead: "Remind me before",
    atTime: "At the adhan",
    minutes: (value: number) => `${value} minutes`,
    next: "Next reminder",
    in: "in",
    unsupported: "Your browser does not support local notifications. The times and countdown remain available.",
    denied: "Notifications are blocked in browser settings. Enable them from the lock icon near the address.",
    granted: "Notifications allowed",
    default: "Notification permission not requested yet",
    note: "No background notifications and nothing sent to a server. On iPhone you may need to install the site as an app first.",
    enabledSnack: "Prayer reminder enabled",
    deniedSnack: "Notification permission was not granted — you can keep using the countdown.",
    reminderDue: "Reminder time reached",
    timezone: "in your location's timezone",
    clock: "Time",
  },
} as const;

type Props = {
  lang: Lang;
  next: PrayerInstant | null;
  now: number;
  locationLabel: string;
};

/**
 * تذكير صلاة محلي واختياري.
 *
 * لا يُطلب إذن الإشعارات تلقائيًا؛ لا يحدث شيء حتى يضغط المستخدم المفتاح.
 * الجدولة كلها في الصفحة الحالية عبر setTimeout، ولا تُستخدم Service Worker
 * لإشعارات خلفية — التزامًا بمبدأ عدم إزعاج الزائر أو تتبعه.
 */
export function PrayerRemindersCard({ lang, next, now, locationLabel }: Props) {
  const copy = COPY[lang];
  const snack = useSnack();
  const [stored, setStored] = useLocalStorage<ReminderSettings>(STORAGE_KEY, DEFAULT_SETTINGS);
  const settings = normalize(stored);
  const [permission, setPermission] = useState<PermissionState>(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const lastFired = useRef<string | null>(null);

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const nextKey = next ? `${next.dateKey}:${next.key}` : "";
  const nextAt = next?.at ?? 0;
  const nextPrayer = next?.key ?? null;
  const nextClock = next?.clock ?? "";

  useEffect(() => {
    if (!settings.enabled || permission !== "granted" || !nextKey || !nextPrayer) return;
    const reminderId = `${nextKey}:${settings.leadMinutes}`;
    if (lastFired.current === reminderId) return;
    const fireAt = nextAt - settings.leadMinutes * 60_000;
    const delay = fireAt - Date.now();
    // إن فات وقت التذكير بأكثر من دقيقة (فتح الصفحة متأخرًا) لا نزعج المستخدم.
    if (delay < -60_000) return;

    const timer = window.setTimeout(() => {
      if (lastFired.current === reminderId) return;
      lastFired.current = reminderId;
      const label = prayerLabel(nextPrayer);
      const title =
        settings.leadMinutes === 0
          ? lang === "ar"
            ? `حان وقت صلاة ${label.ar}`
            : `It is time for ${label.en}`
          : lang === "ar"
            ? `صلاة ${label.ar} بعد ${settings.leadMinutes} دقائق`
            : `${label.en} in ${settings.leadMinutes} minutes`;
      const body = `${formatClock(nextClock, "24", lang)} — ${locationLabel}`;
      try {
        const notification = new Notification(title, {
          body,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: reminderId,
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch {
        snack(`${title} — ${body}`, "info");
      }
    }, Math.max(0, delay));

    return () => window.clearTimeout(timer);
  }, [
    settings.enabled,
    settings.leadMinutes,
    permission,
    nextKey,
    nextAt,
    nextPrayer,
    nextClock,
    lang,
    locationLabel,
    snack,
  ]);

  const enable = async () => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    let current = Notification.permission;
    if (current === "default") {
      try {
        current = await Notification.requestPermission();
      } catch {
        current = "denied";
      }
      setPermission(current);
    }
    if (current !== "granted") {
      setPermission(current);
      snack(copy.deniedSnack, "info");
      return;
    }
    setStored({ ...settings, enabled: true });
    snack(copy.enabledSnack, "success");
  };

  const toggle = (checked: boolean) => {
    if (!checked) {
      setStored({ ...settings, enabled: false });
      return;
    }
    void enable();
  };

  const reminderAt = nextAt && settings.enabled ? nextAt - settings.leadMinutes * 60_000 : 0;
  const remaining = reminderAt ? reminderAt - now : 0;
  const nextLabel = next ? prayerLabel(next.key) : null;

  return (
    <Paper
      component="section"
      aria-label={copy.title}
      sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 4, border: "1px solid", borderColor: "divider" }}
    >
      <Stack spacing={1.75}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            {settings.enabled && permission === "granted" ? (
              <NotificationsActiveIcon color="primary" aria-hidden />
            ) : (
              <NotificationsOffIcon color="action" aria-hidden />
            )}
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 800 }}>
              {copy.title}
            </Typography>
          </Stack>
          <Switch
            checked={settings.enabled && permission === "granted"}
            onChange={(event) => toggle(event.target.checked)}
            disabled={permission === "unsupported" || permission === "denied"}
            inputProps={{ "aria-label": copy.enable }}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {copy.subtitle}
        </Typography>

        {permission === "unsupported" ? (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            {copy.unsupported}
          </Alert>
        ) : permission === "denied" ? (
          <Alert severity="warning" sx={{ borderRadius: 3 }}>
            {copy.denied}
          </Alert>
        ) : (
          <>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ xs: "stretch", sm: "center" }}>
              <FormControl size="small" sx={{ minWidth: 170 }} disabled={!settings.enabled}>
                <InputLabel id="sj-reminder-lead-label">{copy.lead}</InputLabel>
                <Select
                  labelId="sj-reminder-lead-label"
                  label={copy.lead}
                  value={settings.leadMinutes}
                  onChange={(event) =>
                    setStored({
                      ...settings,
                      leadMinutes: Number(event.target.value) as ReminderSettings["leadMinutes"],
                    })
                  }
                >
                  {LEAD_OPTIONS.map((value) => (
                    <MenuItem key={value} value={value}>
                      {value === 0 ? copy.atTime : copy.minutes(value)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Chip
                size="small"
                variant="outlined"
                color={permission === "granted" ? "success" : "default"}
                label={permission === "granted" ? copy.granted : copy.default}
              />
            </Stack>

            {settings.enabled && permission === "granted" && next && nextLabel ? (
              <Typography variant="body2" color="text.secondary">
                {copy.next}: <strong>{nextLabel[lang]}</strong>{" "}
                {remaining > 0
                  ? `${copy.in} ${formatCountdownShort(remaining, lang)}`
                  : settings.leadMinutes === 0
                    ? copy.atTime
                    : copy.reminderDue}{" "}
                · {copy.clock}: {formatClock(next.clock, "24", lang)} ({copy.timezone})
              </Typography>
            ) : null}
          </>
        )}

        <Typography variant="caption" color="text.secondary">
          {copy.note}
        </Typography>
      </Stack>
    </Paper>
  );
}

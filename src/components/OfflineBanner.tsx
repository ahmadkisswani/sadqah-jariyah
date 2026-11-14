import { useEffect, useState } from "react";
import { Alert, Collapse, Typography } from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";

/** شريط صادق لحالة الاتصال: لا يدّعي أن بيانات الشبكة محدّثة أثناء الانقطاع. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(
    typeof navigator === "undefined" ? false : !navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <Collapse in={offline} unmountOnExit>
      <Alert
        severity="warning"
        icon={<WifiOffIcon />}
        role="status"
        aria-live="polite"
        sx={{ mb: 3, borderRadius: 3, alignItems: "center" }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          أنت غير متصل بالشبكة. القرآن والأذكار والأدعية المحفوظة تعمل، أما مواقيت الصلاة
          والتلاوة الصوتية فقد تحتاج اتصالًا.
        </Typography>
      </Alert>
    </Collapse>
  );
}

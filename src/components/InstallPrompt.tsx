import { useEffect, useState } from "react";
import { Alert, Button, Collapse, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "sj-install-dismissed";

/**
 * دعوة لطيفة (غير ملحّة) لتثبيت الموقع كتطبيق، تظهر فقط عند توفّر الحدث،
 * وتبقى مخفية إذا رفضها المستخدم سابقًا.
 */
export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    setVisible(false);
    setEvt(null);
  };

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <Collapse in={visible}>
      <Alert
        severity="info"
        icon={<DownloadIcon />}
        sx={{ mb: 3, alignItems: "center" }}
        action={
          <>
            <Button color="inherit" size="small" onClick={install} sx={{ fontWeight: 700 }}>
              تثبيت
            </Button>
            <IconButton aria-label="تجاهل" size="small" onClick={dismiss}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      >
        ثبّت الموقع على جهازك ليكون قريبًا منك دائمًا.
      </Alert>
    </Collapse>
  );
}

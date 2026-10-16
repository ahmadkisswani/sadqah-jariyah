import { useState } from "react";
import { Button, IconButton, Tooltip, type ButtonProps } from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { shareText, copyText } from "../utils/share";
import { useSnack } from "../hooks/useSnack";

type Props = {
  text: string;
  label?: string;
  variant?: "button" | "icon";
  color?: ButtonProps["color"];
  size?: ButtonProps["size"];
};

/**
 * زر مشاركة موحّد: يجرّب Web Share API أولًا، ثم النسخ إلى الحافظة،
 * ويعرض تأكيدًا عبر Snackbar.
 */
export function ShareButton({ text, label = "مشاركة", variant = "button", color = "primary", size = "medium" }: Props) {
  const snack = useSnack();
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    const result = await shareText(text);
    setBusy(false);
    if (result === "shared") snack("تمت المشاركة", "success");
    else if (result === "copied") snack("تم نسخ النص", "success");
    else if (result === "failed") snack("تعذّرت المشاركة على هذا الجهاز", "error");
  };

  if (variant === "icon") {
    return (
      <Tooltip title={label}>
        <IconButton onClick={handle} aria-label={label} color={color} size={size} disabled={busy}>
          <ShareIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      onClick={handle}
      startIcon={<ShareIcon />}
      variant="outlined"
      color={color}
      size={size}
      disabled={busy}
    >
      {label}
    </Button>
  );
}

type CopyProps = {
  text: string;
  label?: string;
  variant?: "button" | "icon";
  size?: ButtonProps["size"];
};

/** زر نسخ موحّد يعرض تأكيدًا عبر Snackbar. */
export function CopyButton({ text, label = "نسخ", variant = "button", size = "medium" }: CopyProps) {
  const snack = useSnack();

  const handle = async () => {
    const result = await copyText(text);
    if (result === "copied") snack("تم نسخ النص", "success");
    else snack("تعذّر النسخ على هذا الجهاز", "error");
  };

  if (variant === "icon") {
    return (
      <Tooltip title={label}>
        <IconButton onClick={handle} aria-label={label} size={size}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button onClick={handle} startIcon={<ContentCopyIcon />} variant="outlined" size={size}>
      {label}
    </Button>
  );
}

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { Alert, Snackbar } from "@mui/material";

type SnackState = { open: boolean; message: string; severity: "success" | "info" | "error" };

/* -------------------------------------------------------------------------- */
/*  إزاحة الإشعارات:                                                          */
/*  بعض الصفحات (المصحف) تعرض شريط تشغيل ثابتًا في الأسفل، فلو ظهر الإشعار في  */
/*  مكانه الافتراضي غطّى أزرار التحكّم. لذلك يُعلن هذا الشريط عن ارتفاعه ليرتفع */
/*  الإشعار فوقه تلقائيًا.                                                     */
/* -------------------------------------------------------------------------- */

let bottomOffset = 0;
const offsetListeners = new Set<() => void>();

/** يُسجّل ارتفاع الشريط السفلي الحالي (بالبكسل) حتى لا تغطّيه الإشعارات. */
export function setSnackBottomOffset(offset: number) {
  if (bottomOffset === offset) return;
  bottomOffset = offset;
  for (const listener of offsetListeners) listener();
}

function subscribeOffset(callback: () => void) {
  offsetListeners.add(callback);
  return () => {
    offsetListeners.delete(callback);
  };
}

function useSnackBottomOffset() {
  return useSyncExternalStore(
    subscribeOffset,
    () => bottomOffset,
    () => 0,
  );
}

const SnackContext = createContext<(message: string, severity?: SnackState["severity"]) => void>(
  () => {},
);

export function useSnack() {
  return useContext(SnackContext);
}

/** مزوّد إشعارات Snackbar مركزي — يُستدعى من أزرار النسخ والمشاركة. */
export function SnackProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SnackState>({
    open: false,
    message: "",
    severity: "success",
  });
  const offset = useSnackBottomOffset();

  const show = useCallback(
    (message: string, severity: SnackState["severity"] = "success") => {
      setState({ open: true, message, severity });
    },
    [],
  );

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const value = useMemo(() => show, [show]);

  return (
    <SnackContext.Provider value={value}>
      {children}
      <Snackbar
        open={state.open}
        autoHideDuration={2600}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: 84 + offset, sm: 24 + offset } }}
      >
        <Alert onClose={close} severity={state.severity} variant="filled" sx={{ width: "100%" }}>
          {state.message}
        </Alert>
      </Snackbar>
    </SnackContext.Provider>
  );
}

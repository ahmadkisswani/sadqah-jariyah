import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Alert, Snackbar } from "@mui/material";

type SnackState = { open: boolean; message: string; severity: "success" | "info" | "error" };

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
        sx={{ bottom: { xs: 84, sm: 24 } }}
      >
        <Alert onClose={close} severity={state.severity} variant="filled" sx={{ width: "100%" }}>
          {state.message}
        </Alert>
      </Snackbar>
    </SnackContext.Provider>
  );
}

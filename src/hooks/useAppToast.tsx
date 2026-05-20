import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
/* eslint-disable react-refresh/only-export-components */

export type ToastVariant = "default" | "destructive";

export type ToastPayload = {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastState = ToastPayload & { id: number };

type AppToastContextValue = {
  toast: ToastState | null;
  show: (payload: ToastPayload) => void;
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  dismiss: () => void;
};

const AppToastContext = createContext<AppToastContextValue | null>(null);

export function AppToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const dismiss = useCallback(() => {
    setToast(null);
  }, []);

  const show = useCallback((payload: ToastPayload) => {
    setToast({
      ...payload,
      id: Date.now(),
      variant: payload.variant ?? "default",
    });
  }, []);

  const success = useCallback(
    (message: string, durationMs = 2000) => {
      show({ durationMs, message });
    },
    [show],
  );

  const error = useCallback(
    (message: string, durationMs = 3000) => {
      show({ durationMs, message, variant: "destructive" });
    },
    [show],
  );

  const value = useMemo(
    () => ({ dismiss, error, show, success, toast }),
    [dismiss, error, show, success, toast],
  );

  return (
    <AppToastContext.Provider value={value}>
      {children}
    </AppToastContext.Provider>
  );
}

export function useAppToast() {
  const context = useContext(AppToastContext);

  if (!context) {
    throw new Error("useAppToast must be used within AppToastProvider");
  }

  return context;
}

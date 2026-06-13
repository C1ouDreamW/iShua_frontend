import { useEffect } from "react";

import { useAppToast } from "@/hooks/useAppToast";
import { cn } from "@/lib/utils";

export function AppToastViewport() {
  const { dismiss, toast } = useAppToast();

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(dismiss, toast.durationMs ?? 2000);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast]);

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-[calc(1rem+env(safe-area-inset-top,0px))] z-[100] flex justify-center px-4 motion-safe:transition-opacity motion-safe:duration-200",
        toast ? "opacity-100" : "opacity-0",
      )}
      role="status"
    >
      {toast ? (
        <p
          className={cn(
            "rounded-md border border-border px-4 py-2 text-sm font-medium shadow-paper",
            toast.variant === "destructive"
              ? "border-error/30 bg-error-bg text-error"
              : "border-border bg-bg-surface text-text-primary",
          )}
        >
          {toast.message}
        </p>
      ) : null}
    </div>
  );
}

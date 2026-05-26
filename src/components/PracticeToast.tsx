import { useEffect } from "react";

import { cn } from "@/lib/utils";

type PracticeToastProps = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  durationMs?: number;
};

export function PracticeToast({
  message,
  visible,
  onDismiss,
  durationMs = 3000,
}: PracticeToastProps) {
  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onDismiss, visible]);

  return (
    <div
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4 motion-safe:transition-opacity motion-safe:duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
      role="status"
    >
      <p className="rounded-md border border-border bg-bg-surface px-4 py-2 text-sm font-medium text-text-primary shadow-paper">
        {message}
      </p>
    </div>
  );
}

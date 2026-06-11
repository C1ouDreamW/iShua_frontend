import { useEffect } from "react";

import { useTurnstile } from "@/hooks/useTurnstile";
import { cn } from "@/lib/utils";

type TurnstileFieldProps = {
  className?: string;
  onTokenChange: (token: string | null) => void;
  onResetReady?: (reset: () => void) => void;
};

export function TurnstileField({
  className,
  onTokenChange,
  onResetReady,
}: TurnstileFieldProps) {
  const {
    containerRef,
    error,
    loading,
    reset,
    siteKeyConfigured,
    token,
  } = useTurnstile();

  useEffect(() => {
    onTokenChange(token);
  }, [onTokenChange, token]);

  useEffect(() => {
    onResetReady?.(reset);
  }, [onResetReady, reset]);

  if (!siteKeyConfigured) {
    return (
      <p className="text-sm text-text-secondary">
        人机验证未配置，请联系管理员。
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-text-primary">人机验证</span>
        {token ? (
          <span className="text-xs font-medium text-brand">已完成</span>
        ) : (
          <span className="text-xs text-text-secondary">
            发送验证码前需完成
          </span>
        )}
      </div>

      <div className="relative min-h-[65px] w-full">
        {loading ? (
          <div
            aria-hidden
            className="absolute inset-0 animate-pulse rounded-md border border-border bg-brand-muted/40"
          />
        ) : null}
        <div
          className={cn("turnstile-widget w-full", loading && "invisible")}
          ref={containerRef}
        />
      </div>

      {error ? <p className="text-center text-sm text-error">{error}</p> : null}
    </div>
  );
}

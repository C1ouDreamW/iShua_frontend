import { useCallback, useEffect, useRef, useState } from "react";

import {
  getTurnstileSiteKey,
  loadTurnstileScript,
  resolveTurnstileErrorMessage,
  TURNSTILE_ACTION_REGISTER_EMAIL_CODE,
} from "@/lib/turnstile";

type UseTurnstileOptions = {
  enabled?: boolean;
};

export function useTurnstile({ enabled = true }: UseTurnstileOptions = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteKey = getTurnstileSiteKey();

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
    setToken(null);
  }, []);

  useEffect(() => {
    if (!enabled || !siteKey) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          action: TURNSTILE_ACTION_REGISTER_EMAIL_CODE,
          sitekey: siteKey,
          theme: "light",
          size: "flexible",
          language: "zh-cn",
          callback: (nextToken) => {
            setToken(nextToken);
            setError(null);
          },
          "error-callback": (errorCode) => {
            setToken(null);
            setError(resolveTurnstileErrorMessage(errorCode));
          },
          "expired-callback": () => {
            setToken(null);
            setError("人机验证已过期，请重新验证。");
          },
        });
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "人机验证加载失败，请刷新页面后重试。",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      setToken(null);
    };
  }, [enabled, siteKey]);

  return {
    containerRef,
    error,
    loading,
    reset,
    siteKeyConfigured: Boolean(siteKey),
    token,
  };
}

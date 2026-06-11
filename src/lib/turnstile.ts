const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** CF 官方测试 Site Key，任意域名（含 localhost）可用 */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

export const TURNSTILE_ACTION_REGISTER_EMAIL_CODE = "register_email_code";

export function getTurnstileSiteKey() {
  const configured = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();

  if (
    import.meta.env.DEV &&
    (!configured || configured === "TURNSTILE_SITE_KEY")
  ) {
    return TURNSTILE_TEST_SITE_KEY;
  }

  if (!configured || configured === "TURNSTILE_SITE_KEY") {
    return null;
  }

  return configured;
}

export function resolveTurnstileErrorMessage(errorCode?: string | number) {
  const code = String(errorCode ?? "");

  switch (code) {
    case "110100":
    case "110110":
      return "Turnstile Site Key 无效，请检查前端环境变量配置。";
    case "110200": {
      const host =
        typeof window !== "undefined" ? window.location.hostname : "当前域名";
      return `域名「${host}」未在 Cloudflare Turnstile 控制台授权。请在 Widget → Hostname Management 中添加该域名后重试。`;
    }
    case "110600":
    case "110620":
      return "人机验证已超时，请重新验证。";
    case "200500":
      return "无法加载人机验证组件，请检查网络或是否拦截了 challenges.cloudflare.com。";
    default:
      return code
        ? `人机验证失败（${code}），请刷新页面后重试。`
        : "人机验证加载失败，请刷新页面后重试。";
  }
}

let scriptLoading: Promise<void> | null = null;

function waitForTurnstileApi(timeoutMs = 10_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const check = () => {
      if (window.turnstile) {
        resolve();
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error("Turnstile 脚本加载失败。"));
        return;
      }

      window.requestAnimationFrame(check);
    };

    check();
  });
}

export function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile is only available in the browser."));
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (scriptLoading) {
    return scriptLoading;
  }

  scriptLoading = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]`,
    );

    if (existing) {
      if (window.turnstile) {
        resolve();
        return;
      }

      existing.addEventListener(
        "load",
        () => {
          void waitForTurnstileApi().then(resolve).catch(reject);
        },
        { once: true },
      );
      existing.addEventListener(
        "error",
        () => reject(new Error("Turnstile 脚本加载失败。")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.onload = () => {
      void waitForTurnstileApi().then(resolve).catch(reject);
    };
    script.onerror = () => reject(new Error("Turnstile 脚本加载失败。"));
    document.head.appendChild(script);
  });

  return scriptLoading;
}

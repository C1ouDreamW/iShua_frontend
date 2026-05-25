import { ApiError, ApiOutageError, API_OUTAGE_MESSAGE } from "@/api/client";

export { API_OUTAGE_MESSAGE };
export const NETWORK_ERROR_MESSAGE = API_OUTAGE_MESSAGE;
export const AUTH_EXPIRED_MESSAGE = "登录已过期，请重新登录。";

function looksLikeStructuredPayload(message: string) {
  const trimmed = message.trim();

  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  );
}

export function isApiOutageError(error: unknown): boolean {
  if (error instanceof ApiOutageError) {
    return true;
  }

  if (error instanceof TypeError || error instanceof SyntaxError) {
    return true;
  }

  return false;
}

/** @deprecated Use isApiOutageError */
export function isNetworkError(error: unknown): boolean {
  return isApiOutageError(error);
}

export function resolveApiErrorMessage(
  error: unknown,
  fallback = "操作失败，请稍后重试。",
): string {
  if (isApiOutageError(error)) {
    return API_OUTAGE_MESSAGE;
  }

  if (error instanceof ApiError) {
    const message = error.message?.trim();

    if (!message || looksLikeStructuredPayload(message)) {
      return API_OUTAGE_MESSAGE;
    }

    return message;
  }

  if (error instanceof Error && error.message) {
    if (looksLikeStructuredPayload(error.message)) {
      return API_OUTAGE_MESSAGE;
    }

    return error.message;
  }

  return fallback;
}

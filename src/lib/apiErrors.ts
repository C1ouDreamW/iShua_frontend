import { ApiError } from "@/api/client";

export const NETWORK_ERROR_MESSAGE = "网络异常，请稍后重试。";
export const AUTH_EXPIRED_MESSAGE = "登录已过期，请重新登录。";

export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

export function resolveApiErrorMessage(
  error: unknown,
  fallback = "操作失败，请稍后重试。",
): string {
  if (isNetworkError(error)) {
    return NETWORK_ERROR_MESSAGE;
  }

  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

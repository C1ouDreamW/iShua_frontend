import { AUTH_TOKEN_KEY } from "@/api/client";
import type { AuthUser } from "@/types/auth";

export const AUTH_USER_KEY = "ishua_user";

export function readStoredToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveStoredToken(token: string) {
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // localStorage may be unavailable in private browsing.
  }
}

export function clearStoredAuth() {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem(AUTH_USER_KEY);
  } catch {
    // Ignore storage failures; in-memory auth state is still cleared.
  }
}

export function readStoredUser() {
  try {
    const raw = window.localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: AuthUser) {
  try {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch {
    // Best-effort cache only.
  }
}

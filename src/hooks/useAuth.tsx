import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
/* eslint-disable react-refresh/only-export-components */

import * as authApi from "@/api/auth";
import { isApiOutageError } from "@/lib/apiErrors";
import {
  clearStoredAuth,
  readStoredToken,
  readStoredUser,
  saveStoredToken,
  saveStoredUser,
} from "@/lib/authStorage";
import type {
  AuthUser,
  LoginPayload,
  LoginResult,
  RegisterPayload,
} from "@/types/auth";

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<LoginResult>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromLoginResult(result: LoginResult): AuthUser {
  return {
    nickname: result.nickname,
    role: result.role,
    userId: result.userId,
    username: result.username,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => readStoredToken());
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [loading, setLoading] = useState(() => Boolean(readStoredToken()));

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!readStoredToken()) {
      setLoading(false);
      return null;
    }

    setLoading(true);

    try {
      const currentUser = await authApi.me();
      saveStoredUser(currentUser);
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (isApiOutageError(error)) {
        return readStoredUser();
      }

      logout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        void refreshUser();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const handleLogin = useCallback(async (payload: LoginPayload) => {
    const result = await authApi.login(payload);

    if (!result.token) {
      throw new Error("登录响应缺少 token。");
    }

    const nextUser = userFromLoginResult(result);
    saveStoredToken(result.token);
    saveStoredUser(nextUser);
    setToken(result.token);
    setUser(nextUser);

    return result;
  }, []);

  const handleRegister = useCallback(async (payload: RegisterPayload) => {
    await authApi.register(payload);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token && user),
      loading,
      login: handleLogin,
      logout,
      refreshUser,
      register: handleRegister,
      token,
      user,
    }),
    [handleLogin, handleRegister, loading, logout, refreshUser, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

import { request } from "@/api/client";
import type {
  AuthUser,
  LoginPayload,
  LoginResult,
  RegisterPayload,
} from "@/types/auth";

export function login(payload: LoginPayload) {
  return request<LoginResult>("/api/v1/users/login", {
    body: payload,
    method: "POST",
  });
}

export function register(payload: RegisterPayload) {
  return request<null>("/api/v1/users/register", {
    body: payload,
    method: "POST",
  });
}

export function me() {
  return request<AuthUser>("/api/v1/users/me");
}

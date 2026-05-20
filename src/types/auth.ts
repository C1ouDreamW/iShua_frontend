import type { components } from "@/types/api";

export type UserRole = "USER" | "PREMIUM" | "ADMIN";

export type AuthUser = Omit<
  components["schemas"]["UserMeVO"],
  "role"
> & {
  role?: UserRole | string;
};

export type LoginPayload = components["schemas"]["UserLoginDTO"];
export type RegisterPayload = components["schemas"]["UserRegisterDTO"];
export type LoginResult = components["schemas"]["UserLoginVO"];

import type { UserRole } from "@/types/auth";

const ROLE_RANK: Record<UserRole, number> = {
  USER: 0,
  PREMIUM: 1,
  ADMIN: 2,
};

export function normalizeRole(role: string | undefined): UserRole | null {
  if (role === "USER" || role === "PREMIUM" || role === "ADMIN") {
    return role;
  }

  return null;
}

export function roleRank(role: string | undefined) {
  const normalized = normalizeRole(role);
  return normalized ? ROLE_RANK[normalized] : -1;
}

export function hasMinRole(
  userRole: string | undefined,
  minRole: UserRole,
) {
  return roleRank(userRole) >= ROLE_RANK[minRole];
}

export function isPremiumOrAbove(role: string | undefined) {
  return hasMinRole(role, "PREMIUM");
}

export function isAdmin(role: string | undefined) {
  return normalizeRole(role) === "ADMIN";
}

export const UPGRADE_CONTACT_EMAIL = "cloud_aaa@163.com";

export const ROLE_LABEL: Record<UserRole, string> = {
  USER: "普通用户",
  PREMIUM: "高级用户",
  ADMIN: "管理员",
};

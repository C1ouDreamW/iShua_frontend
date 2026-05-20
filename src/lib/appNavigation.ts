import {
  BookmarkX,
  Compass,
  Library,
  Shield,
  type LucideIcon,
} from "lucide-react";

import { hasMinRole, isAdmin } from "@/lib/rbac";
import type { UserRole } from "@/types/auth";

export type AppNavItem = {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  minRole?: UserRole;
  premiumFeature?: boolean;
  adminOnly?: boolean;
};

export const APP_SIDEBAR_NAV: AppNavItem[] = [
  {
    id: "discover",
    label: "发现",
    to: "/",
    icon: Compass,
  },
  {
    id: "wrong",
    label: "错题本",
    to: "/app/wrong-questions",
    icon: BookmarkX,
    minRole: "USER",
  },
  {
    id: "banks",
    label: "我的题库",
    to: "/app/banks",
    icon: Library,
    minRole: "PREMIUM",
    premiumFeature: true,
  },
  {
    id: "admin",
    label: "管理",
    to: "/app/admin/users",
    icon: Shield,
    adminOnly: true,
  },
];

export function getVisibleSidebarNav(role: string | undefined) {
  return APP_SIDEBAR_NAV.filter((item) => {
    if (item.adminOnly) {
      return isAdmin(role);
    }

    if (item.premiumFeature) {
      return true;
    }

    if (item.minRole) {
      return hasMinRole(role, item.minRole);
    }

    return true;
  });
}

export function canAccessNavItem(role: string | undefined, item: AppNavItem) {
  if (item.adminOnly) {
    return isAdmin(role);
  }

  if (item.premiumFeature) {
    return hasMinRole(role, "PREMIUM");
  }

  if (item.minRole) {
    return hasMinRole(role, item.minRole);
  }

  return true;
}

export function isNavItemActive(pathname: string, item: AppNavItem) {
  if (item.to === "/") {
    return pathname === "/";
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

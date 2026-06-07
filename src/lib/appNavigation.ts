import {
  BarChart3,
  BookmarkX,
  Compass,
  FolderCog,
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
    to: "/app/discover",
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
    label: "题库",
    to: "/app/banks",
    icon: Library,
    minRole: "USER",
  },
  {
    id: "manage",
    label: "管理题库",
    to: "/app/manage/banks",
    icon: FolderCog,
    minRole: "PREMIUM",
    premiumFeature: true,
  },
  {
    id: "admin",
    label: "用户管理",
    to: "/app/admin/users",
    icon: Shield,
    adminOnly: true,
  },
  {
    id: "admin-ai-import-stats",
    label: "导入统计",
    to: "/app/admin/ai-import/stats",
    icon: BarChart3,
    adminOnly: true,
  },
];

export const APP_MOBILE_NAV_IDS = ["discover", "wrong", "banks"] as const;

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

export function getNavItemById(id: string) {
  return APP_SIDEBAR_NAV.find((item) => item.id === id);
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
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

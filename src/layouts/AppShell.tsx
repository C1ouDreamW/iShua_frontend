import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useMatches,
  useNavigate,
  useOutlet,
} from "react-router-dom";
import { User } from "lucide-react";

import { fadeSlideUp } from "@/lib/motion";

import { UpgradePrompt } from "@/components/auth/UpgradePrompt";
import {
  MobileNavBar,
  ProfileSheet,
  type MobileNavItem,
} from "@/components/auth/ProfileSheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  APP_MOBILE_NAV_IDS,
  canAccessNavItem,
  getNavItemById,
  getVisibleSidebarNav,
  isNavItemActive,
} from "@/lib/appNavigation";
import { buildLoginRedirect } from "@/lib/navigation";
import { ROLE_LABEL } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type RouteHandle = {
  immersive?: boolean;
};

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const outlet = useOutlet();
  const { isAuthenticated, loading, logout, user } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isImmersive = matches.some(
    (match) => (match.handle as RouteHandle | undefined)?.immersive,
  );

  if (!loading && !isAuthenticated) {
    return (
      <Navigate
        replace
        to={buildLoginRedirect(location.pathname, location.search)}
      />
    );
  }

  if (isImmersive) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-10">
        <div className="paper-panel mx-auto h-64 max-w-3xl animate-pulse" />
      </div>
    );
  }

  const sidebarNav = getVisibleSidebarNav(user?.role);
  const displayName = user?.nickname || user?.username || "未登录";
  const roleLabel =
    user?.role && user.role in ROLE_LABEL
      ? ROLE_LABEL[user.role as keyof typeof ROLE_LABEL]
      : "用户";

  const mobileNavItems: MobileNavItem[] = [
    ...APP_MOBILE_NAV_IDS.map((navId) => {
      const item = getNavItemById(navId)!;
      const shortLabel =
        navId === "wrong" ? "错题" : navId === "banks" ? "题库" : item.label;

      return {
        active: isNavItemActive(location.pathname, item),
        icon: item.icon,
        id: navId,
        label: shortLabel,
        to: item.to,
      };
    }),
    {
      action: "profile",
      icon: User,
      id: "profile",
      label: "我的",
    },
  ];

  function handleMobileNavClick(item: MobileNavItem) {
    if (item.action === "profile") {
      setProfileOpen(true);
      return;
    }

    if (item.action === "upgrade") {
      setUpgradeOpen(true);
      return;
    }

    if (item.to) {
      navigate(item.to);
    }
  }

  return (
    <div className="min-h-screen text-text-primary lg:flex">
      <UpgradePrompt onOpenChange={setUpgradeOpen} open={upgradeOpen} />

      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-bg-surface lg:flex">
        <div className="border-b px-5 py-6">
          <Link
            className="font-serif text-xl font-semibold text-brand"
            to="/"
          >
            iShua
          </Link>
          <p className="mt-1 text-xs text-text-muted">一页一题，沉浸刷完</p>
        </div>

        <nav aria-label="应用导航" className="flex flex-1 flex-col gap-1 p-3">
          {sidebarNav.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(location.pathname, item);
            const needsUpgrade =
              item.premiumFeature && !canAccessNavItem(user?.role, item);

            if (needsUpgrade) {
              return (
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    "text-text-secondary hover:bg-brand-muted/60 hover:text-text-primary",
                  )}
                  key={item.id}
                  onClick={() => setUpgradeOpen(true)}
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0" />
                  {item.label}
                </button>
              );
            }

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-brand-muted font-medium text-brand"
                    : "text-text-secondary hover:bg-brand-muted/60 hover:text-text-primary",
                )}
                key={item.id}
                to={item.to}
              >
                <Icon aria-hidden="true" className="size-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t p-4">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-muted font-medium text-brand"
            >
              {displayName.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">
                {displayName}
              </p>
              <p className="text-xs text-text-muted">{roleLabel}</p>
            </div>
          </div>
          <Button
            className="mt-3 w-full"
            onClick={logout}
            size="sm"
            variant="outline"
          >
            退出
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <a
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-bg-surface focus:px-3 focus:py-2 focus:shadow"
          href="#main-content"
        >
          跳到主内容
        </a>

        <main className="flex-1 pb-20 lg:pb-0" id="main-content">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              animate="visible"
              exit="exit"
              initial="hidden"
              key={location.pathname}
              variants={fadeSlideUp}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>

        <MobileNavBar items={mobileNavItems} onItemClick={handleMobileNavClick} />
      </div>

      <ProfileSheet
        onOpenChange={setProfileOpen}
        onRequestUpgrade={() => {
          setProfileOpen(false);
          setUpgradeOpen(true);
        }}
        open={profileOpen}
      />
    </div>
  );
}

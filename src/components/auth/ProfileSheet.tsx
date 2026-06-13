import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router-dom";
import { FolderCog, LogOut, X, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { DURATION, EASE_OUT } from "@/lib/motion";
import { isPremiumOrAbove, ROLE_LABEL, UPGRADE_CONTACT_EMAIL } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type ProfileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestUpgrade: () => void;
};

export function ProfileSheet({
  open,
  onOpenChange,
  onRequestUpgrade,
}: ProfileSheetProps) {
  const { logout, user } = useAuth();
  const displayName = user?.nickname || user?.username || "未登录";
  const role = user?.role;
  const roleLabel =
    role && role in ROLE_LABEL
      ? ROLE_LABEL[role as keyof typeof ROLE_LABEL]
      : "用户";

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="关闭菜单"
            className="absolute inset-0 bg-black/40"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            transition={{ duration: DURATION.page, ease: EASE_OUT }}
            type="button"
          />
          <motion.section
            animate={{ y: 0 }}
            aria-label="我的"
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border bg-bg-surface p-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] shadow-lg"
            exit={{ y: "100%" }}
            initial={{ y: "100%" }}
            role="dialog"
            transition={{ duration: DURATION.expand, ease: EASE_OUT }}
          >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-xl font-semibold text-text-primary">
              {displayName}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              @{user?.username ?? "—"}
            </p>
            <span className="mt-2 inline-flex rounded-md border border-border bg-bg-sheet px-2 py-0.5 text-xs font-medium text-brand">
              {roleLabel}
            </span>
          </div>
          <Button
            aria-label="关闭"
            onClick={() => onOpenChange(false)}
            size="icon"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-5" />
          </Button>
        </div>

        {!isPremiumOrAbove(role) ? (
          <div className="paper-panel mb-6 bg-bg-sheet p-4 text-sm leading-6 text-text-secondary">
            <p className="font-medium text-text-primary">升级 PREMIUM</p>
            <p className="mt-2">
              开通后可创建题库、管理试题并使用 AI 导入。联系管理员：
              <span className="block font-medium text-brand">
                {UPGRADE_CONTACT_EMAIL}
              </span>
            </p>
            <Button className="mt-4 w-full" onClick={onRequestUpgrade} size="sm">
              了解如何升级
            </Button>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          {isPremiumOrAbove(role) ? (
            <Button asChild className="w-full justify-start gap-2" variant="outline">
              <Link onClick={() => onOpenChange(false)} to="/app/manage/banks">
                <FolderCog aria-hidden="true" className="size-4" />
                管理题库
              </Link>
            </Button>
          ) : null}
          <Button
            className="w-full justify-start gap-2"
            onClick={() => {
              onOpenChange(false);
              logout();
            }}
            variant="outline"
          >
            <LogOut aria-hidden="true" className="size-4" />
            退出登录
          </Button>
        </div>
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export type MobileNavItem = {
  id: string;
  label: string;
  to?: string;
  icon: LucideIcon;
  action?: "profile" | "upgrade";
  active?: boolean;
};

export function MobileNavBar({
  items,
  onItemClick,
}: {
  items: MobileNavItem[];
  onItemClick: (item: MobileNavItem) => void;
}) {
  return (
    <nav
      aria-label="底部导航"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-bg-surface/95 backdrop-blur pb-safe lg:hidden"
    >
      <ul className="mx-auto grid h-14 max-w-lg grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.id}>
              <button
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] transition-colors",
                  item.active
                    ? "font-medium text-brand"
                    : "text-text-muted hover:text-text-primary",
                )}
                onClick={() => onItemClick(item)}
                type="button"
              >
                <Icon aria-hidden="true" className="size-5" />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

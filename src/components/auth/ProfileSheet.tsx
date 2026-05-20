import { LogOut, X, type LucideIcon } from "lucide-react";

import { UpgradePrompt } from "@/components/auth/UpgradePrompt";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        aria-label="关闭菜单"
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <section
        aria-label="我的"
        className="absolute inset-x-0 bottom-0 rounded-t-2xl border bg-bg-surface p-6 pb-8 shadow-lg"
        role="dialog"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-xl font-semibold text-text-primary">
              {displayName}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              @{user?.username ?? "—"}
            </p>
            <span className="mt-2 inline-flex rounded-full bg-brand-muted px-2 py-0.5 text-xs font-medium text-brand">
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
          <div className="mb-6 rounded-xl border bg-bg-canvas p-4 text-sm leading-6 text-text-secondary">
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
      </section>
    </div>
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
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-bg-surface/95 backdrop-blur lg:hidden"
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

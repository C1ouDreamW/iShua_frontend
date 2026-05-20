import { useState, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

import { UpgradePrompt } from "@/components/auth/UpgradePrompt";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { buildLoginRedirect } from "@/lib/navigation";
import { hasMinRole } from "@/lib/rbac";
import type { UserRole } from "@/types/auth";

type RoleGateProps = {
  minRole: UserRole;
  children: ReactNode;
  /** USER 访问 PREMIUM 功能时展示升级弹窗，而非纯无权限页 */
  premiumFeature?: boolean;
};

export function RoleGate({
  minRole,
  children,
  premiumFeature = minRole === "PREMIUM",
}: RoleGateProps) {
  const location = useLocation();
  const { isAuthenticated, loading, user } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(true);

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="h-64 animate-pulse rounded-xl border bg-bg-surface" />
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        to={buildLoginRedirect(location.pathname, location.search)}
      />
    );
  }

  if (hasMinRole(user?.role, minRole)) {
    return children;
  }

  if (premiumFeature) {
    return (
      <section className="mx-auto flex max-w-lg flex-col items-center gap-6 px-6 py-16 text-center">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-text-primary">
            需要高级权限
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            当前账号为普通用户，开通 PREMIUM 后可管理自建题库与 AI 导入。
          </p>
        </div>
        <Button onClick={() => setUpgradeOpen(true)}>了解如何升级</Button>
        <Button asChild variant="outline">
          <Link to="/app/wrong-questions">返回错题本</Link>
        </Button>
        <UpgradePrompt onOpenChange={setUpgradeOpen} open={upgradeOpen} />
      </section>
    );
  }

  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-6 px-6 py-16 text-center">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-text-primary">
          暂无访问权限
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          该页面仅管理员可访问。如有疑问请联系管理员。
        </p>
      </div>
      <Button asChild variant="outline">
        <Link to="/">返回大厅</Link>
      </Button>
    </section>
  );
}

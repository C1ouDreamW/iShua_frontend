import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import {
  pageAdminUsers,
  updateAdminUserRole,
  type AdminUser,
} from "@/api/admin";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PaginationBar } from "@/components/PaginationBar";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/useAppToast";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type UsersState = {
  error: string | null;
  loading: boolean;
  total: number;
  users: AdminUser[];
};

const roleLabels: Record<string, string> = {
  ADMIN: "管理员",
  PREMIUM: "高级用户",
  USER: "普通用户",
};

function roleLabel(role: string | undefined) {
  return role ? (roleLabels[role] ?? role) : "未知角色";
}

function RolePill({ role }: { role: string | undefined }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-20 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium",
        role === "ADMIN"
          ? "border-brand/30 bg-brand-muted text-brand"
          : "border-border bg-bg-sheet text-text-secondary",
      )}
    >
      {roleLabel(role)}
    </span>
  );
}

export function AdminUsersPage() {
  const [current, setCurrent] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [usersState, setUsersState] = useState<UsersState>({
    error: null,
    loading: true,
    total: 0,
    users: [],
  });
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const { error, success } = useAppToast();

  useEffect(() => {
    let ignore = false;

    async function loadUsers() {
      setUsersState((prev) => ({ ...prev, error: null, loading: true }));

      try {
        const data = await pageAdminUsers({ current, pageSize: PAGE_SIZE });

        if (!ignore) {
          setUsersState({
            error: null,
            loading: false,
            total: data?.total ?? 0,
            users: data?.records ?? [],
          });
        }
      } catch (loadError) {
        if (!ignore) {
          setUsersState({
            error: resolveApiErrorMessage(
              loadError,
              "用户列表加载失败，请稍后再试。",
            ),
            loading: false,
            total: 0,
            users: [],
          });
        }
      }
    }

    void loadUsers();

    return () => {
      ignore = true;
    };
  }, [current, reloadKey]);

  function refresh() {
    setReloadKey((key) => key + 1);
  }

  async function handleRoleChange(user: AdminUser, role: "USER" | "PREMIUM") {
    if (!user.userId || user.role === role) {
      return;
    }

    setUpdatingUserId(user.userId);

    try {
      await updateAdminUserRole(user.userId, { role });
      success("角色已更新");
      refresh();
    } catch (updateError) {
      error(resolveApiErrorMessage(updateError, "角色更新失败，请稍后再试。"));
    } finally {
      setUpdatingUserId(null);
    }
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-text-primary">
            用户管理
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            查看用户角色，并在普通用户与高级用户之间切换。
          </p>
        </div>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="size-4" />
          刷新
        </Button>
      </header>

      {usersState.loading ? (
        <div className="paper-panel flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              className="h-12 animate-pulse rounded-md bg-bg-sheet"
              key={index}
            />
          ))}
        </div>
      ) : null}

      {!usersState.loading && usersState.error ? (
        <ErrorState message={usersState.error} onRetry={refresh} />
      ) : null}

      {!usersState.loading &&
      !usersState.error &&
      usersState.users.length === 0 ? (
        <EmptyState description="暂无可管理用户。" title="暂无用户" />
      ) : null}

      {!usersState.loading &&
      !usersState.error &&
      usersState.users.length > 0 ? (
        <>
          <div className="paper-panel overflow-hidden p-0">
            <div className="hidden grid-cols-[1.2fr_1fr_0.9fr_0.9fr_1.2fr] border-b border-border px-4 py-3 text-xs font-medium text-text-muted md:grid">
              <span>账号</span>
              <span>昵称</span>
              <span>角色</span>
              <span>创建时间</span>
              <span className="text-right">操作</span>
            </div>

            <Stagger className="divide-y divide-border" key={current}>
              {usersState.users.map((user) => {
                const isAdmin = user.role === "ADMIN";
                const updating = updatingUserId === user.userId;

                return (
                  <StaggerItem
                    as="article"
                    className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.2fr_1fr_0.9fr_0.9fr_1.2fr] md:items-center"
                    key={user.userId ?? user.username}
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {user.username ?? "未知账号"}
                      </p>
                      <p className="mt-1 text-xs text-text-muted md:hidden">
                        {formatRelativeTime(user.createTime)}
                      </p>
                    </div>
                    <p className="text-text-secondary">
                      {user.nickname || "未设置"}
                    </p>
                    <RolePill role={user.role} />
                    <p className="hidden text-text-secondary md:block">
                      {formatRelativeTime(user.createTime)}
                    </p>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button
                        disabled={isAdmin || updating || user.role === "USER"}
                        onClick={() => void handleRoleChange(user, "USER")}
                        size="sm"
                        variant="outline"
                      >
                        设为普通
                      </Button>
                      <Button
                        disabled={isAdmin || updating || user.role === "PREMIUM"}
                        onClick={() => void handleRoleChange(user, "PREMIUM")}
                        size="sm"
                      >
                        设为高级
                      </Button>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>

          <PaginationBar
            ariaLabel="用户分页"
            current={current}
            itemLabel="个用户"
            onPageChange={setCurrent}
            pageSize={PAGE_SIZE}
            total={usersState.total}
          />
        </>
      ) : null}
    </section>
  );
}

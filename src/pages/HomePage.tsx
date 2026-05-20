import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { pagePublicBanks, type QuestionBank } from "@/api/banks";
import { BankCard } from "@/components/BankCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PaginationBar } from "@/components/PaginationBar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useResponsivePageSize } from "@/hooks/useResponsivePageSize";

type LobbyState = {
  banks: QuestionBank[];
  total: number;
  loading: boolean;
  error: string | null;
};

export function HomePage() {
  const { isAuthenticated, logout, user } = useAuth();
  const pageSize = useResponsivePageSize();
  const [current, setCurrent] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<LobbyState>({
    banks: [],
    error: null,
    loading: true,
    total: 0,
  });

  useEffect(() => {
    let ignore = false;

    async function loadBanks() {
      setState((prev) => ({ ...prev, error: null, loading: true }));

      try {
        const data = await pagePublicBanks({ current, pageSize });

        if (!ignore) {
          setState({
            banks: data?.records ?? [],
            error: null,
            loading: false,
            total: data?.total ?? 0,
          });
        }
      } catch (error) {
        if (!ignore) {
          setState({
            banks: [],
            error:
              error instanceof Error
                ? error.message
                : "公开题库加载失败，请稍后再试。",
            loading: false,
            total: 0,
          });
        }
      }
    }

    void loadBanks();

    return () => {
      ignore = true;
    };
  }, [current, pageSize, reloadKey]);

  return (
    <main className="min-h-screen bg-bg-canvas">
      <section className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
        <header className="relative overflow-hidden rounded-2xl border bg-bg-surface p-8 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-brand-muted blur-3xl" />
          <div className="relative flex flex-col gap-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex flex-col gap-3">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-brand text-2xl font-semibold text-white shadow-sm">
                  刷
                </div>
                <div>
                  <h1 className="font-serif text-4xl font-semibold text-text-primary">
                    iShua
                  </h1>
                  <p className="mt-2 text-lg text-text-secondary">
                    一页一题，沉浸刷完
                  </p>
                </div>
              </div>
              {isAuthenticated ? (
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-sm text-text-secondary sm:inline">
                    {user?.nickname || user?.username}
                  </span>
                  <Button onClick={logout} variant="outline">
                    退出
                  </Button>
                </div>
              ) : (
                <nav
                  aria-label="访客导航"
                  className="flex shrink-0 items-center gap-2"
                >
                  <Button asChild variant="ghost">
                    <Link to="/login">登录</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register">注册</Link>
                  </Button>
                </nav>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-brand">公开题库大厅</p>
              <p className="max-w-2xl text-sm leading-6 text-text-secondary">
                {isAuthenticated
                  ? "选择公开题库后会进入登录练习路由，后续阶段将同步错题与记录。"
                  : "选择一个公开题库即可开始访客刷题。本阶段只做本地判分，不同步错题与记录。"}
              </p>
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-text-primary">
                发现公开题库
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                卡片仅展示标题与描述，保持选题路径清爽。
              </p>
            </div>
            {state.total > 0 ? (
              <p className="hidden text-sm text-text-muted sm:block">
                每页 {pageSize} 个
              </p>
            ) : null}
          </div>

          {state.loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
                <div
                  className="min-h-52 animate-pulse rounded-xl border bg-bg-surface p-5"
                  key={index}
                />
              ))}
            </div>
          ) : state.error ? (
            <ErrorState
              message={state.error}
              onRetry={() => setReloadKey((key) => key + 1)}
            />
          ) : state.banks.length === 0 ? (
            <EmptyState
              description="当前还没有公开题库。后端添加公开题库后，这里会显示可开始刷题的卡片。"
              title="还没有公开题库"
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {state.banks.map((bank) => (
                  <BankCard bank={bank} key={bank.id ?? bank.title} />
                ))}
              </div>
              <PaginationBar
                current={current}
                onPageChange={setCurrent}
                pageSize={pageSize}
                total={state.total}
              />
            </>
          )}
        </section>
      </section>
    </main>
  );
}

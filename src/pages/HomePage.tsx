import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { pagePublicBankRoots, type BankNode } from "@/api/bankNodes";
import { LobbyAuthenticatedActions } from "@/components/LobbyAccountMenu";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LogoMark } from "@/components/LogoMark";
import { ContentCrossfade } from "@/components/motion/ContentCrossfade";
import { PageTransition } from "@/components/motion/PageTransition";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { PaginationBar } from "@/components/PaginationBar";
import { RootNodeCard } from "@/components/RootNodeCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useResponsivePageSize } from "@/hooks/useResponsivePageSize";
import { resolveApiErrorMessage } from "@/lib/apiErrors";

type LobbyState = {
  roots: BankNode[];
  total: number;
  loading: boolean;
  error: string | null;
};

export function HomePage() {
  const { isAuthenticated, loading: authLoading, logout, user } = useAuth();
  const pageSize = useResponsivePageSize();
  const [current, setCurrent] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<LobbyState>({
    error: null,
    loading: true,
    roots: [],
    total: 0,
  });

  useEffect(() => {
    let ignore = false;

    async function loadRoots() {
      setState((prev) => ({ ...prev, error: null, loading: true }));

      try {
        const data = await pagePublicBankRoots({
          current,
          pageSize,
        });

        if (!ignore) {
          setState({
            error: null,
            loading: false,
            roots: data?.records ?? [],
            total: data?.total ?? 0,
          });
        }
      } catch (error) {
        if (!ignore) {
          setState({
            error: resolveApiErrorMessage(
              error,
              "公开题库加载失败，请稍后再试。",
            ),
            loading: false,
            roots: [],
            total: 0,
          });
        }
      }
    }

    void loadRoots();

    return () => {
      ignore = true;
    };
  }, [current, pageSize, reloadKey]);

  useEffect(() => {
    if (state.total === 0) {
      return;
    }

    const maxPage = Math.max(1, Math.ceil(state.total / pageSize));
    setCurrent((page) => (page > maxPage ? maxPage : page));
  }, [pageSize, state.total]);

  return (
    <main className="min-h-screen">
      <PageTransition className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
        <header className="paper-panel relative overflow-hidden p-6 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-border"
          />
          <div className="relative flex flex-col gap-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-3">
                <LogoMark size="lg" />
                <div>
                  <h1 className="font-serif text-3xl font-semibold text-text-primary sm:text-4xl">
                    iShua
                  </h1>
                  <p className="mt-2 text-lg text-text-secondary">
                    一页一题，沉浸刷完
                  </p>
                </div>
              </div>
              <Reveal className="sm:shrink-0">
                {authLoading ? (
                  <div
                    aria-hidden
                    className="h-10 w-28 animate-pulse rounded-md border border-border bg-bg-surface"
                  />
                ) : isAuthenticated ? (
                  <LobbyAuthenticatedActions
                    displayName={user?.nickname || user?.username || "用户"}
                    onLogout={logout}
                  />
                ) : (
                  <nav
                    aria-label="访客导航"
                    className="flex items-center gap-2 self-end sm:shrink-0"
                  >
                    <Button asChild variant="ghost">
                      <Link to="/login">登录</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/register">注册</Link>
                    </Button>
                  </nav>
                )}
              </Reveal>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-brand">公开题库大厅</p>
              <p className="max-w-2xl text-sm leading-6 text-text-secondary">
                {isAuthenticated
                  ? "大厅展示公开根节点；文件夹可进入子树浏览，题库节点可直接刷题。"
                  : "选择一个公开入口开始刷题。文件夹需进入子树选择题库；本阶段访客刷题仅本地判分。"}
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
                仅展示根节点；文件夹含子题库统计，题库节点显示题量。
              </p>
            </div>
            {state.total > 0 ? (
              <p className="hidden text-sm text-text-muted sm:block">
                每页 {pageSize} 个
              </p>
            ) : null}
          </div>

          <ContentCrossfade
            stateKey={
              state.loading
                ? "loading"
                : state.error
                  ? "error"
                  : state.roots.length === 0
                    ? "empty"
                    : `content-${current}`
            }
          >
            {state.loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
                  <div
                    className="paper-panel min-h-52 animate-pulse p-5"
                    key={index}
                  />
                ))}
              </div>
            ) : state.error ? (
              <ErrorState
                backHref="/"
                message={state.error}
                onRetry={() => setReloadKey((key) => key + 1)}
              />
            ) : state.roots.length === 0 ? (
              <EmptyState
                description="当前还没有公开根节点。管理员添加公开题库后，这里会显示可浏览的入口。"
                title="还没有公开题库"
              />
            ) : (
              <div className="flex flex-col gap-4">
                <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" key={current}>
                  {state.roots.map((node) => (
                    <StaggerItem key={node.id ?? node.title}>
                      <RootNodeCard node={node} />
                    </StaggerItem>
                  ))}
                </Stagger>
                <PaginationBar
                  current={current}
                  onPageChange={setCurrent}
                  pageSize={pageSize}
                  total={state.total}
                />
              </div>
            )}
          </ContentCrossfade>
        </section>
      </PageTransition>
    </main>
  );
}

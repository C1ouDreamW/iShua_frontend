import { useEffect, useRef, useState } from "react";
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
import { IcpFooter } from "@/components/IcpFooter";
import { PaginationBar } from "@/components/PaginationBar";
import { RootNodeCard } from "@/components/RootNodeCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useResponsivePageSize } from "@/hooks/useResponsivePageSize";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { cn } from "@/lib/utils";

type LobbyState = {
  roots: BankNode[];
  total: number;
  /** 全屏骨架：仅首次进入且无可展示数据时为 true。 */
  loading: boolean;
  /** 保留旧列表的后台刷新/翻页，配合透明度作局部进度提示。 */
  refreshing: boolean;
  error: string | null;
};

/**
 * 首页公开题库分页短时缓存（模块级，跨组件挂载存活）：
 * 翻页、其他页面返回时立即复用上次结果，不回退整屏骨架、不重播逐卡入场。
 */
const LOBBY_CACHE_TTL = 60_000;

const lobbyCache = new Map<
  string,
  { records: BankNode[]; total: number; fetchedAt: number }
>();

function lobbyCacheKey(current: number, pageSize: number) {
  return `${current}:${pageSize}`;
}

export function HomePage() {
  const { isAuthenticated, loading: authLoading, logout, user } = useAuth();
  const pageSize = useResponsivePageSize();
  const [current, setCurrent] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const forceReloadRef = useRef(false);
  const [state, setState] = useState<LobbyState>(() => {
    const cached = lobbyCache.get(lobbyCacheKey(1, pageSize));
    return cached
      ? {
          error: null,
          loading: false,
          refreshing: false,
          roots: cached.records,
          total: cached.total,
        }
      : { error: null, loading: true, refreshing: false, roots: [], total: 0 };
  });

  useEffect(() => {
    let ignore = false;
    const cacheKey = lobbyCacheKey(current, pageSize);
    // 重试按钮强制走网络；翻页/返回优先用缓存。
    const forceReload = forceReloadRef.current;
    forceReloadRef.current = false;
    const cached = lobbyCache.get(cacheKey);

    async function loadRoots(options?: { silent?: boolean }) {
      if (!options?.silent) {
        setState((prev) => ({
          ...prev,
          error: null,
          loading: prev.roots.length === 0,
          refreshing: prev.roots.length > 0,
        }));
      }

      try {
        const data = await pagePublicBankRoots({
          current,
          pageSize,
        });

        if (!ignore) {
          const records = data?.records ?? [];
          const total = data?.total ?? 0;
          lobbyCache.set(cacheKey, { records, total, fetchedAt: Date.now() });
          setState({
            error: null,
            loading: false,
            refreshing: false,
            roots: records,
            total,
          });
        }
      } catch (error) {
        if (!ignore && !options?.silent) {
          setState({
            error: resolveApiErrorMessage(
              error,
              "公开题库加载失败，请稍后再试。",
            ),
            loading: false,
            refreshing: false,
            roots: [],
            total: 0,
          });
        }
      }
    }

    if (!forceReload && cached) {
      // 缓存命中立即同步展示：翻页/返回时不回退骨架屏、不重播入场动画
      // （SWR 的核心行为）。首屏挂载时初始 state 已读同一份缓存，此处为
      // 同值写入，React 会自动跳过重渲染。
      setState({
        error: null,
        loading: false,
        refreshing: false,
        roots: cached.records,
        total: cached.total,
      });

      if (Date.now() - cached.fetchedAt > LOBBY_CACHE_TTL) {
        void loadRoots({ silent: true });
      }
    } else {
      void loadRoots();
    }

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
    <main className="flex min-h-screen flex-col">
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
                    : "content"
            }
          >
            {state.loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                onRetry={() => {
                  forceReloadRef.current = true;
                  setReloadKey((key) => key + 1);
                }}
              />
            ) : state.roots.length === 0 ? (
              <EmptyState
                description="当前还没有公开根节点。管理员添加公开题库后，这里会显示可浏览的入口。"
                title="还没有公开题库"
              />
            ) : (
              <div className="flex flex-col gap-4">
                {/* Stagger 不按页码重建：容器跨页保留，逐卡入场只在首次展示时执行，
                    翻页时列表整体保留（缓存命中即时切换），后台刷新时降低透明度作局部提示。 */}
                <Stagger
                  aria-busy={state.refreshing || undefined}
                  className={cn(
                    "grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3",
                    state.refreshing && "opacity-60",
                  )}
                >
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

      <IcpFooter className="mt-auto" />
    </main>
  );
}

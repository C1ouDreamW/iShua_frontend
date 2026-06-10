import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { pageMyBanks, pagePublicBanks, type QuestionBank } from "@/api/banks";
import { UpgradePrompt } from "@/components/auth/UpgradePrompt";
import { BankCard } from "@/components/BankCard";
import { ContentCrossfade } from "@/components/motion/ContentCrossfade";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PaginationBar } from "@/components/PaginationBar";
import { useAuth } from "@/hooks/useAuth";
import { useResponsivePageSize } from "@/hooks/useResponsivePageSize";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { isPremiumOrAbove } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type TabId = "public" | "private";

type BanksState = {
  banks: QuestionBank[];
  total: number;
  loading: boolean;
  error: string | null;
};

const TAB_LABELS: { id: TabId; label: string }[] = [
  { id: "public", label: "公共" },
  { id: "private", label: "私有" },
];

export function PracticeBanksPage() {
  const { user } = useAuth();
  const canAccessPrivate = isPremiumOrAbove(user?.role);
  const pageSize = useResponsivePageSize();
  const [tab, setTab] = useState<TabId>("public");
  const [current, setCurrent] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [state, setState] = useState<BanksState>({
    banks: [],
    error: null,
    loading: true,
    total: 0,
  });

  useEffect(() => {
    setCurrent(1);
  }, [tab]);

  useEffect(() => {
    let ignore = false;

    async function loadBanks() {
      setState((prev) => ({ ...prev, error: null, loading: true }));

      try {
        const data =
          tab === "public"
            ? await pagePublicBanks({ current, pageSize })
            : await pageMyBanks({ current, pageSize });

        const records = data?.records ?? [];
        const filtered =
          tab === "private"
            ? records.filter((bank) => bank.isPublic !== 1)
            : records;

        if (!ignore) {
          setState({
            banks: filtered,
            error: null,
            loading: false,
            total:
              tab === "private"
                ? filtered.length < records.length
                  ? filtered.length
                  : (data?.total ?? filtered.length)
                : (data?.total ?? 0),
          });
        }
      } catch (error) {
        if (!ignore) {
          setState({
            banks: [],
            error: resolveApiErrorMessage(
              error,
              tab === "public"
                ? "公开题库加载失败，请稍后再试。"
                : "私有题库加载失败，请稍后再试。",
            ),
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
  }, [current, pageSize, reloadKey, tab]);

  function handleTabClick(nextTab: TabId) {
    if (nextTab === "private" && !canAccessPrivate) {
      setUpgradeOpen(true);
      return;
    }

    setTab(nextTab);
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <UpgradePrompt onOpenChange={setUpgradeOpen} open={upgradeOpen} />

      <header>
        <h1 className="font-serif text-3xl font-semibold text-text-primary">
          题库
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          选择公开或私有题库开始刷题。创建与管理题库请使用侧栏「管理题库」。
        </p>
      </header>

      <div
        aria-label="题库分类"
        className="flex gap-1 rounded-lg border bg-bg-surface p-1"
        role="tablist"
      >
        {TAB_LABELS.map(({ id, label }) => {
          const isActive = tab === id;
          const isPrivateLocked = id === "private" && !canAccessPrivate;

          return (
            <button
              aria-selected={isActive}
              className={cn(
                "relative flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "text-brand"
                  : "text-text-secondary hover:text-text-primary",
                isPrivateLocked && "opacity-60",
              )}
              key={id}
              onClick={() => handleTabClick(id)}
              role="tab"
              type="button"
            >
              {isActive ? (
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-md bg-brand-muted"
                  layoutId="banks-tab-indicator"
                  transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                />
              ) : null}
              <span className="relative z-10">{label}</span>
              {isPrivateLocked ? (
                <span className="relative z-10 ml-1 text-xs text-text-muted inline-flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-0.5 inline-block h-3 w-3"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M4.5 7V5a3.5 3.5 0 117 0v2h.75A1.75 1.75 0 0114 8.75v4.5A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25v-4.5A1.75 1.75 0 013.75 7H4.5zm1 0h5V5a2.5 2.5 0 10-5 0v2zM3.75 8a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-8.5z"
                    />
                  </svg>
                  （PREMIUM）
                </span>
              ) : null}
            </button>
      
          );
        })}
      </div>

      <ContentCrossfade
        stateKey={
          state.loading
            ? `loading-${tab}`
            : state.error
              ? `error-${tab}`
              : state.banks.length === 0
                ? `empty-${tab}`
                : `content-${tab}-${current}`
        }
      >
        {state.loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
              <div
                className="paper-panel min-h-52 animate-pulse"
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
            description={
              tab === "public"
                ? "当前还没有公开题库，请稍后再来或联系管理员。"
                : canAccessPrivate
                  ? "你还没有私有题库。可在「管理题库」中创建。"
                  : "升级 PREMIUM 后可刷私有题库。"
            }
            title={tab === "public" ? "还没有公开题库" : "还没有私有题库"}
          />
        ) : (
          <>
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" key={`${tab}-${current}`}>
              {state.banks.map((bank) => (
                <StaggerItem key={bank.id ?? bank.title}>
                  <BankCard bank={bank} />
                </StaggerItem>
              ))}
            </Stagger>
            <PaginationBar
              ariaLabel={tab === "public" ? "公开题库分页" : "私有题库分页"}
              current={current}
              itemLabel="个题库"
              onPageChange={setCurrent}
              pageSize={pageSize}
              total={state.total}
            />
          </>
        )}
      </ContentCrossfade>
    </section>
  );
}

import { useEffect, useState } from "react";

import { pageMyBanks, pagePublicBanks, type QuestionBank } from "@/api/banks";
import { UpgradePrompt } from "@/components/auth/UpgradePrompt";
import { BankCard } from "@/components/BankCard";
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
                "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-muted text-brand"
                  : "text-text-secondary hover:text-text-primary",
                isPrivateLocked && "opacity-60",
              )}
              key={id}
              onClick={() => handleTabClick(id)}
              role="tab"
              type="button"
            >
              {label}
              {isPrivateLocked ? (
                <span className="ml-1 text-xs text-text-muted">（PREMIUM）</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {state.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
            <div
              className="min-h-52 animate-pulse rounded-xl border bg-bg-surface"
              key={index}
            />
          ))}
        </div>
      ) : null}

      {!state.loading && state.error ? (
        <ErrorState
          message={state.error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : null}

      {!state.loading && !state.error && state.banks.length === 0 ? (
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
      ) : null}

      {!state.loading && !state.error && state.banks.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.banks.map((bank) => (
              <BankCard bank={bank} key={bank.id ?? bank.title} />
            ))}
          </div>
          <PaginationBar
            ariaLabel={tab === "public" ? "公开题库分页" : "私有题库分页"}
            current={current}
            itemLabel="个题库"
            onPageChange={setCurrent}
            pageSize={pageSize}
            total={state.total}
          />
        </>
      ) : null}
    </section>
  );
}

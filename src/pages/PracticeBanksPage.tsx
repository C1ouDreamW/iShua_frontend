import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { isLeafNode } from "@/api/bankNodes";
import { UpgradePrompt } from "@/components/auth/UpgradePrompt";
import { BankTree } from "@/components/bank-tree/BankTree";
import {
  buildBankTree,
  filterPrivatePracticeNodes,
} from "@/components/bank-tree/buildBankTree";
import type { TreeBankNode } from "@/components/bank-tree/buildBankTree";
import { useBankTree } from "@/components/bank-tree/useBankTree";
import { ContentCrossfade } from "@/components/motion/ContentCrossfade";
import { useAuth } from "@/hooks/useAuth";
import { buildPracticePath } from "@/lib/navigation";
import { isPremiumOrAbove } from "@/lib/rbac";
import { cn } from "@/lib/utils";

type TabId = "public" | "private";

const TAB_LABELS: { id: TabId; label: string }[] = [
  { id: "public", label: "公共" },
  { id: "private", label: "私有" },
];

export function PracticeBanksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAccessPrivate = isPremiumOrAbove(user?.role);
  const [tab, setTab] = useState<TabId>("public");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const treeScope = tab === "public" ? "public" : "mine";
  const treeEnabled = tab === "public" || canAccessPrivate;
  const { error, flatNodes, loading, refresh } = useBankTree({
    enabled: treeEnabled,
    scope: treeScope,
  });

  const tree = useMemo(() => {
    const nodes =
      tab === "private"
        ? filterPrivatePracticeNodes(flatNodes)
        : flatNodes;
    return buildBankTree(nodes);
  }, [flatNodes, tab]);

  function handleTabClick(nextTab: TabId) {
    if (nextTab === "private" && !canAccessPrivate) {
      setUpgradeOpen(true);
      return;
    }

    setTab(nextTab);
  }

  function handleSelect(node: TreeBankNode) {
    if (!isLeafNode(node) || node.id == null) {
      return;
    }

    navigate(buildPracticePath(node.id, true));
  }

  const emptyTitle =
    tab === "public" ? "还没有公开题库" : "还没有私有题库";
  const emptyDescription =
    tab === "public"
      ? "当前还没有可刷的公开题库，请稍后再来或联系管理员。"
      : "你还没有私有题库。可在「管理题库」中创建。";

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <UpgradePrompt onOpenChange={setUpgradeOpen} open={upgradeOpen} />

      <header>
        <h1 className="font-serif text-3xl font-semibold text-text-primary">
          题库
        </h1>
        <p className="mt-2 text-sm leading-6 text-text-secondary">
          在树中选择题库节点开始刷题。文件夹仅用于展开浏览；创建与管理请使用侧栏「管理题库」。
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
                <span className="relative z-10 ml-1 inline-flex items-center text-xs text-text-muted">
                  <svg
                    aria-hidden="true"
                    className="mr-0.5 inline-block h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M4.5 7V5a3.5 3.5 0 117 0v2h.75A1.75 1.75 0 0114 8.75v4.5A1.75 1.75 0 0112.25 15h-8.5A1.75 1.75 0 012 13.25v-4.5A1.75 1.75 0 013.75 7H4.5zm1 0h5V5a2.5 2.5 0 10-5 0v2zM3.75 8a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75h-8.5z" />
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
          loading
            ? `loading-${tab}`
            : error
              ? `error-${tab}`
              : tree.length === 0
                ? `empty-${tab}`
                : `content-${tab}`
        }
      >
        <div className="paper-panel p-4">
          <BankTree
            emptyDescription={emptyDescription}
            emptyTitle={emptyTitle}
            error={error}
            loading={loading}
            onRetry={refresh}
            onSelect={handleSelect}
            tree={tree}
          />
        </div>
      </ContentCrossfade>
    </section>
  );
}

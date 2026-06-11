import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { isLeafNode } from "@/api/bankNodes";
import { BankTree } from "@/components/bank-tree/BankTree";
import type { TreeBankNode } from "@/components/bank-tree/buildBankTree";
import { useBankTree } from "@/components/bank-tree/useBankTree";
import { ErrorState } from "@/components/ErrorState";
import { LogoMark } from "@/components/LogoMark";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { buildPracticePath } from "@/lib/navigation";

export function BankBrowsePage() {
  const { rootId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const numericRootId = Number(rootId);
  const validRootId = Number.isFinite(numericRootId);

  const { error, flatNodes, loading, refresh, tree } = useBankTree({
    enabled: validRootId,
    rootId: validRootId ? numericRootId : undefined,
    scope: "public",
  });

  const rootTitle = useMemo(() => {
    const root = flatNodes.find((node) => node.id === numericRootId);
    return root?.title ?? "题库浏览";
  }, [flatNodes, numericRootId]);

  function handleSelect(node: TreeBankNode) {
    if (!isLeafNode(node) || node.id == null) {
      return;
    }

    navigate(buildPracticePath(node.id, isAuthenticated));
  }

  if (!validRootId) {
    return (
      <main className="min-h-screen px-6 py-12">
        <ErrorState
          backHref="/"
          backLabel="返回大厅"
          message="根节点 ID 不正确。"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <PageTransition className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
        <header className="paper-panel p-6">
          <div className="flex flex-col gap-4">
            <Button asChild className="w-fit" size="sm" variant="ghost">
              <Link to="/">← 返回公开大厅</Link>
            </Button>
            <div className="flex items-start gap-4">
              <LogoMark size="md" />
              <div>
                <p className="text-sm font-medium text-brand">公开子树</p>
                <h1 className="mt-1 font-serif text-3xl font-semibold text-text-primary">
                  {rootTitle}
                </h1>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  展开文件夹浏览子题库；点击题库节点即可开始刷题。
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="paper-panel p-4">
          <BankTree
            emptyDescription="该文件夹下暂无可刷的公开题库。"
            emptyTitle="暂无可刷题库"
            error={error}
            loading={loading}
            onRetry={refresh}
            onSelect={handleSelect}
            tree={tree}
          />
        </section>
      </PageTransition>
    </main>
  );
}

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { cn } from "@/lib/utils";

import { BankTreeNode } from "./BankTreeNode";
import type { TreeBankNode } from "./buildBankTree";

type BankTreeProps = {
  className?: string;
  error?: string | null;
  loading?: boolean;
  onRetry?: () => void;
  onSelect: (node: TreeBankNode) => void;
  selectedId?: number | null;
  tree: TreeBankNode[];
};

export function BankTree({
  className,
  error,
  loading,
  onRetry,
  onSelect,
  selectedId,
  tree,
}: BankTreeProps) {
  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            className="h-9 animate-pulse rounded-md bg-bg-sheet"
            key={index}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorState message={error} onRetry={onRetry} />
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          description="新建文件夹或题库，开始组织你的题目结构。"
          title="还没有节点"
        />
      </div>
    );
  }

  return (
    <ul className={cn("space-y-0.5", className)} role="tree">
      {tree.map((node) => (
        <BankTreeNode
          key={node.id ?? node.title}
          node={node}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </ul>
  );
}

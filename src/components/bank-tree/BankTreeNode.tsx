import { ChevronRight, FileText, Folder } from "lucide-react";
import { useState } from "react";

import { isFolderNode } from "@/api/bankNodes";
import { cn } from "@/lib/utils";

import type { TreeBankNode } from "./buildBankTree";

type BankTreeNodeProps = {
  depth?: number;
  node: TreeBankNode;
  selectedId?: number | null;
  onSelect: (node: TreeBankNode) => void;
};

export function BankTreeNode({
  depth = 0,
  node,
  selectedId,
  onSelect,
}: BankTreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isFolder = isFolderNode(node);
  const [expanded, setExpanded] = useState(depth < 2);
  const isSelected = selectedId != null && node.id === selectedId;

  return (
    <li>
      <div
        className={cn(
          "group flex w-full items-center gap-1 rounded-md pr-2 transition-colors",
          isSelected
            ? "bg-brand-muted text-brand"
            : "text-text-primary hover:bg-bg-sheet",
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren ? (
          <button
            aria-expanded={expanded}
            aria-label={expanded ? "折叠" : "展开"}
            className="flex size-7 shrink-0 items-center justify-center rounded-sm text-text-muted hover:bg-bg-canvas"
            onClick={() => setExpanded((value) => !value)}
            type="button"
          >
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "size-4 transition-transform",
                expanded && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span className="size-7 shrink-0" />
        )}

        <button
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-sm"
          onClick={() => onSelect(node)}
          type="button"
        >
          {isFolder ? (
            <Folder
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0",
                isSelected ? "text-brand" : "text-text-muted",
              )}
            />
          ) : (
            <FileText
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0",
                isSelected ? "text-brand" : "text-text-muted",
              )}
            />
          )}

          <span className="min-w-0 flex-1 truncate font-medium">
            {node.title ?? "未命名"}
          </span>

          {!isFolder && node.questionCount != null ? (
            <span className="shrink-0 text-xs text-text-muted">
              {node.questionCount}
            </span>
          ) : null}
        </button>
      </div>

      {hasChildren && expanded ? (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <BankTreeNode
              depth={depth + 1}
              key={child.id ?? child.title}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

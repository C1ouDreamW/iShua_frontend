import { FileText, Folder } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";

import { isFolderNode, isLeafNode, type BankNode } from "@/api/bankNodes";
import { Button } from "@/components/ui/button";
import {
  type ManageBanksOutletContext,
} from "@/pages/ManageBanksLayout";
import { cn } from "@/lib/utils";

export function ManageBanksHome() {
  const { onAddChild, onDeleteNode, onEditNode, previewNode } =
    useOutletContext<ManageBanksOutletContext>();

  return (
    <ManageBanksHomePanel
      node={previewNode}
      onAddChild={onAddChild}
      onDelete={() => {
        if (previewNode) {
          onDeleteNode(previewNode);
        }
      }}
      onEdit={() => {
        if (previewNode) {
          onEditNode(previewNode);
        }
      }}
    />
  );
}

type ManageBanksHomePanelProps = {
  node: BankNode | null;
  onAddChild: (parentId: number, kind: "FOLDER" | "LEAF") => void;
  onDelete: () => void;
  onEdit: () => void;
};

function ManageBanksHomePanel({
  node,
  onAddChild,
  onDelete,
  onEdit,
}: ManageBanksHomePanelProps) {
  if (!node?.id) {
    return (
      <div className="paper-panel flex min-h-[28rem] flex-col items-center justify-center gap-3 px-8 py-16 text-center">
        <p className="font-serif text-2xl font-semibold text-text-primary">
          选择左侧节点
        </p>
        <p className="max-w-sm text-sm leading-6 text-text-secondary">
          点击文件夹可管理子结构；点击题库节点可进入录题、导入与刷题。
        </p>
      </div>
    );
  }

  const isFolder = isFolderNode(node);
  const isLeaf = isLeafNode(node);
  const isPublic = node.isPublic === 1;

  return (
    <div className="paper-panel flex min-h-[28rem] flex-col gap-6 p-6">
      <div className="flex items-start gap-3">
        {isFolder ? (
          <Folder aria-hidden="true" className="mt-1 size-6 text-brand" />
        ) : (
          <FileText aria-hidden="true" className="mt-1 size-6 text-brand" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                isLeaf && isPublic
                  ? "bg-brand-muted text-brand"
                  : "border text-text-secondary",
              )}
            >
              {isFolder
                ? "文件夹"
                : isPublic
                  ? "公开题库"
                  : "私有题库"}
            </span>
            {isFolder && node.childCount != null ? (
              <span className="text-xs text-text-muted">
                {node.childCount} 个子节点
              </span>
            ) : null}
            {isLeaf && node.questionCount != null ? (
              <span className="text-xs text-text-muted">
                {node.questionCount} 道题
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-text-primary">
            {node.title ?? "未命名"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            {node.description || "暂无描述。"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {isFolder ? (
          <>
            <Button onClick={() => onAddChild(node.id!, "FOLDER")} variant="outline">
              新建子文件夹
            </Button>
            <Button onClick={() => onAddChild(node.id!, "LEAF")}>
              新建子题库
            </Button>
          </>
        ) : (
          <Button asChild>
            <Link to={`/app/manage/banks/${node.id}`}>进入题库详情</Link>
          </Button>
        )}
        <Button onClick={onEdit} variant="outline">
          编辑
        </Button>
        <Button onClick={onDelete} variant="ghost">
          删除
        </Button>
      </div>

      {isFolder ? (
        <p className="text-sm leading-6 text-text-secondary">
          文件夹不能直接录题。请在其下创建题库节点，或选择已有题库进入详情。
        </p>
      ) : null}
    </div>
  );
}

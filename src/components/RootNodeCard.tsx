import { Folder, FileText } from "lucide-react";
import { Link } from "react-router-dom";

import { isFolderNode, isLeafNode, type BankNode } from "@/api/bankNodes";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { buildPracticePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type RootNodeCardProps = {
  node: BankNode;
};

function formatFolderMeta(node: BankNode): string {
  if (node.descendantLeafCount != null && node.descendantLeafCount > 0) {
    return `含 ${node.descendantLeafCount} 个题库`;
  }
  if (node.childCount != null && node.childCount > 0) {
    return `${node.childCount} 个子节点`;
  }
  return "文件夹 · 进入浏览子题库";
}

export function RootNodeCard({ node }: RootNodeCardProps) {
  const { isAuthenticated } = useAuth();
  const nodeId = node.id;
  const title = node.title ?? "未命名";
  const isFolder = isFolderNode(node);
  const isLeaf = isLeafNode(node);
  const isPublic = node.isPublic === 1;

  return (
    <article
      className={cn(
        "paper-panel paper-panel-accent flex min-h-44 flex-col justify-between p-5 sm:min-h-52",
        "transition-[border-color,background-color] duration-100",
        "hover:border-brand/30",
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
              isFolder
                ? "border-border text-text-secondary"
                : isPublic
                  ? "border-brand/30 bg-bg-sheet text-brand"
                  : "border-border text-text-secondary",
            )}
          >
            {isFolder ? (
              <>
                <Folder aria-hidden="true" className="size-3" />
                文件夹
              </>
            ) : (
              <>
                <FileText aria-hidden="true" className="size-3" />
                {isPublic ? "公开题库" : "题库"}
              </>
            )}
          </span>
        </div>
        <h2 className="line-clamp-2 font-serif text-xl font-semibold leading-snug text-text-primary">
          {title}
        </h2>
        <p className="line-clamp-2 text-sm leading-6 text-text-secondary">
          {node.description ||
            (isFolder
              ? formatFolderMeta(node)
              : "进入后可直接开始练习。")}
        </p>
        {isFolder ? (
          <p className="text-xs text-text-muted">{formatFolderMeta(node)}</p>
        ) : null}
        {isLeaf && node.questionCount != null ? (
          <p className="text-xs text-text-muted">{node.questionCount} 道题</p>
        ) : null}
      </div>

      <div className="mt-6">
        {isFolder ? (
          <Button asChild className="w-full" disabled={!nodeId}>
            <Link to={nodeId ? `/banks/browse/${nodeId}` : "#"}>
              浏览子题库
            </Link>
          </Button>
        ) : (
          <Button asChild className="w-full" disabled={!nodeId}>
            <Link
              to={
                nodeId ? buildPracticePath(nodeId, isAuthenticated) : "#"
              }
            >
              开始刷题
            </Link>
          </Button>
        )}
      </div>
    </article>
  );
}

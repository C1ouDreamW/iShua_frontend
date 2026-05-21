import { Link } from "react-router-dom";

import type { QuestionBank } from "@/api/banks";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type BankCardProps = {
  bank: QuestionBank;
  variant?: "lobby" | "owned";
  onEdit?: () => void;
  onDelete?: () => void;
};

export function BankCard({
  bank,
  variant = "lobby",
  onEdit,
  onDelete,
}: BankCardProps) {
  const { isAuthenticated } = useAuth();
  const bankId = bank.id;
  const title = bank.title ?? "未命名题库";
  const isOwned = variant === "owned";
  const isPublic = bank.isPublic === 1;
  const practicePath = isAuthenticated
    ? `/app/practice/${bankId}`
    : `/practice/guest/${bankId}`;
  const detailPath = bankId ? `/app/manage/banks/${bankId}` : "#";

  return (
    <article className="group flex min-h-52 flex-col justify-between rounded-xl border bg-bg-surface p-5 shadow-sm motion-safe:transition-all motion-safe:hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-md">
      <div className="flex flex-col gap-3">
        {isOwned ? (
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                isPublic
                  ? "bg-brand-muted text-brand"
                  : "border text-text-secondary",
              )}
            >
              {isPublic ? "公开" : "私有"}
            </span>
            <span className="font-serif text-sm text-text-muted">iShua</span>
          </div>
        ) : null}
        <h2 className="line-clamp-2 font-serif text-xl font-semibold leading-snug text-text-primary">
          {title}
        </h2>
        <p className="line-clamp-2 text-sm leading-6 text-text-secondary">
          {bank.description || "暂无描述，进入后可直接开始练习。"}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        {isOwned ? (
          <>
            <Button asChild className="w-full" disabled={!bankId}>
              <Link to={detailPath}>管理题库</Link>
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button asChild disabled={!bankId} size="sm" variant="outline">
                <Link to={bankId ? practicePath : "#"}>刷题</Link>
              </Button>
              <Button disabled={!onEdit} onClick={onEdit} size="sm" variant="outline">
                编辑
              </Button>
              <Button
                disabled={!onDelete}
                onClick={onDelete}
                size="sm"
                variant="ghost"
              >
                删除
              </Button>
            </div>
          </>
        ) : (
          <Button asChild className="w-full" disabled={!bankId}>
            <Link to={bankId ? practicePath : "#"}>开始刷题</Link>
          </Button>
        )}
      </div>
    </article>
  );
}

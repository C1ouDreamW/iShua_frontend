import { Link } from "react-router-dom";

import type { QuestionBank } from "@/api/banks";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

type BankCardProps = {
  bank: QuestionBank;
};

export function BankCard({ bank }: BankCardProps) {
  const { isAuthenticated } = useAuth();
  const bankId = bank.id;
  const title = bank.title ?? "未命名题库";
  const practicePath = isAuthenticated
    ? `/app/practice/${bankId}`
    : `/practice/guest/${bankId}`;

  return (
    <article className="group flex min-h-52 flex-col justify-between rounded-xl border bg-bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-md">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-brand-muted px-2 py-0.5 text-xs font-medium text-brand">
            公开题库
          </span>
          <span className="font-serif text-sm text-text-muted">iShua</span>
        </div>
        <h2 className="line-clamp-2 font-serif text-xl font-semibold leading-snug text-text-primary">
          {title}
        </h2>
        <p className="line-clamp-2 text-sm leading-6 text-text-secondary">
          {bank.description || "暂无描述，进入后可直接开始练习。"}
        </p>
      </div>

      <Button asChild className="mt-6 w-full" disabled={!bankId}>
        <Link to={bankId ? practicePath : "#"}>开始刷题</Link>
      </Button>
    </article>
  );
}

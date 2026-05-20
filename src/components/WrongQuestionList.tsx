import { Link } from "react-router-dom";

import type { WrongQuestion } from "@/api/wrong";
import { RemoveWrongQuestionDialog } from "@/components/RemoveWrongQuestionDialog";
import { PracticeToast } from "@/components/PracticeToast";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import { useState } from "react";

export type BankFilterOption = {
  id: number;
  label: string;
};

type WrongQuestionListProps = {
  records: WrongQuestion[];
  bankFilter: number | undefined;
  bankOptions: BankFilterOption[];
  onBankFilterChange: (bankId: number | undefined) => void;
  onRemove: (id: number) => Promise<void>;
};

const QUESTION_TYPE_LABEL: Record<string, string> = {
  SINGLE: "单选",
  MULTI: "多选",
  JUDGE: "判断",
};

export function WrongQuestionList({
  records,
  bankFilter,
  bankOptions,
  onBankFilterChange,
  onRemove,
}: WrongQuestionListProps) {
  const [pendingRemove, setPendingRemove] = useState<WrongQuestion | null>(null);
  const [removing, setRemoving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function buildPracticePath(bankId?: number) {
    if (bankId) {
      return `/app/wrong-questions/practice?bankId=${bankId}`;
    }

    return "/app/wrong-questions/practice";
  }

  async function confirmRemove() {
    if (!pendingRemove?.id) {
      return;
    }

    setRemoving(true);

    try {
      await onRemove(pendingRemove.id);
      setToastMessage("已移出错题本");
      setPendingRemove(null);
    } catch {
      setToastMessage("移出失败，请重试");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <PracticeToast
        message={toastMessage ?? ""}
        onDismiss={() => setToastMessage(null)}
        visible={Boolean(toastMessage)}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-col gap-2 text-sm text-text-secondary">
          <span>按题库筛选</span>
          <select
            className="h-10 rounded-md border bg-bg-surface px-3 text-text-primary"
            onChange={(event) => {
              const value = event.target.value;
              onBankFilterChange(value ? Number(value) : undefined);
            }}
            value={bankFilter ?? ""}
          >
            <option value="">全部题库</option>
            {bankOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Button asChild>
          <Link to={buildPracticePath()}>开始重刷</Link>
        </Button>
      </div>

      <ul className="flex flex-col gap-3">
        {records.map((item) => (
          <li
            className="rounded-xl border bg-bg-surface p-4 shadow-sm"
            key={item.id ?? `${item.questionId}-${item.questionBankId}`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <span className="rounded-full bg-brand-muted px-2 py-0.5 font-medium text-brand">
                    {QUESTION_TYPE_LABEL[item.questionType ?? ""] ?? "题目"}
                  </span>
                  <span>错误 {item.wrongCount ?? 0} 次</span>
                  <span>·</span>
                  <span>{formatRelativeTime(item.lastWrongTime)}</span>
                </div>
                <p className="mt-2 line-clamp-1 text-[15px] leading-7 text-text-primary">
                  {item.stem || "（无题干）"}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to={buildPracticePath(item.questionBankId)}>重刷</Link>
                </Button>
                <Button
                  onClick={() => setPendingRemove(item)}
                  size="sm"
                  variant="ghost"
                >
                  移出
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <RemoveWrongQuestionDialog
        onConfirm={() => void confirmRemove()}
        onOpenChange={(open) => {
          if (!open && !removing) {
            setPendingRemove(null);
          }
        }}
        open={Boolean(pendingRemove)}
        removing={removing}
        stem={pendingRemove?.stem}
      />
    </>
  );
}

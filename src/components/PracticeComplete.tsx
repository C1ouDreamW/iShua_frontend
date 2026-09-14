import { motion } from "motion/react";

import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Button } from "@/components/ui/button";
import { fadeSlideUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

type PracticeCompleteProps = {
  title: string;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  onPrimary: () => void;
  onRetry: () => void;
  onContinueUnanswered?: () => void;
  onReviewWrong?: () => void;
  primaryLabel?: string;
  reviewedCount?: number;
};

export function PracticeComplete({
  title,
  correctCount,
  wrongCount,
  unansweredCount,
  onPrimary,
  onRetry,
  onContinueUnanswered,
  onReviewWrong,
  primaryLabel = "返回大厅",
  reviewedCount = 0,
}: PracticeCompleteProps) {
  const answeredCount = correctCount + wrongCount;
  const accuracy =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const canReviewWrong =
    unansweredCount === 0 && wrongCount > 0 && Boolean(onReviewWrong);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <motion.section
        animate="visible"
        className="paper-panel w-full max-w-md p-8 text-center"
        initial="hidden"
        variants={fadeSlideUp}
      >
        <p className="text-sm font-medium tracking-wide text-brand">练习完成</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-text-primary">
          {title}
        </h1>
        <div className="mt-8 border border-border bg-bg-sheet px-6 py-5 shadow-paper">
          <p className="font-serif text-5xl font-semibold tabular-nums text-brand">
            {answeredCount > 0
              ? `${accuracy}%`
              : reviewedCount > 0
                ? `${reviewedCount} 题`
                : "—"}
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            {answeredCount > 0
              ? "客观题正确率"
              : reviewedCount > 0
                ? "已查看参考答案"
                : "尚未作答"}
          </p>
        </div>
        <Stagger
          as="dl"
          className={cn(
            "mt-6 grid gap-3 text-center",
            reviewedCount > 0
              ? "grid-cols-2 sm:grid-cols-4"
              : "grid-cols-3",
          )}
        >
          <StaggerItem className="border border-border bg-bg-surface p-3">
            <dt className="text-xs text-text-muted">答对</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-success">
              {correctCount}
            </dd>
          </StaggerItem>
          <StaggerItem className="border border-border bg-bg-surface p-3">
            <dt className="text-xs text-text-muted">答错</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-error">
              {wrongCount}
            </dd>
          </StaggerItem>
          <StaggerItem className="border border-border bg-bg-surface p-3">
            <dt className="text-xs text-text-muted">未答</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-text-secondary">
              {unansweredCount}
            </dd>
          </StaggerItem>
          {reviewedCount > 0 ? (
            <StaggerItem className="border border-border bg-bg-surface p-3">
              <dt className="text-xs text-text-muted">已看解析</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-brand">
                {reviewedCount}
              </dd>
            </StaggerItem>
          ) : null}
        </Stagger>
        <div className="mt-8 flex flex-col gap-3">
          {unansweredCount > 0 && onContinueUnanswered ? (
            <Button onClick={onContinueUnanswered}>
              继续未答题（{unansweredCount}）
            </Button>
          ) : canReviewWrong ? (
            <Button onClick={onReviewWrong}>重刷错题（{wrongCount}）</Button>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1"
              onClick={onRetry}
              variant={
                unansweredCount > 0 || canReviewWrong ? "outline" : "default"
              }
            >
              再刷一遍
            </Button>
            <Button className="flex-1" onClick={onPrimary} variant="outline">
              {primaryLabel}
            </Button>
          </div>
        </div>
      </motion.section>
    </main>
  );
}

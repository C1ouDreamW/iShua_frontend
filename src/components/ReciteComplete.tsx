import { motion } from "motion/react";

import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Button } from "@/components/ui/button";
import { fadeSlideUp } from "@/lib/motion";

type ReciteCompleteProps = {
  title: string;
  knownCount: number;
  reviewCount: number;
  unansweredCount: number;
  total: number;
  onPrimary: () => void;
  onRetryAll: () => void;
  onRetryReview: () => void;
  primaryLabel?: string;
};

export function ReciteComplete({
  title,
  knownCount,
  reviewCount,
  unansweredCount,
  total,
  onPrimary,
  onRetryAll,
  onRetryReview,
  primaryLabel = "返回",
}: ReciteCompleteProps) {
  const masteryRate =
    total > 0 ? Math.round((knownCount / total) * 100) : 0;
  const canRetryReview = reviewCount > 0;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <motion.section
        animate="visible"
        className="paper-panel w-full max-w-md p-8 text-center"
        initial="hidden"
        variants={fadeSlideUp}
      >
        <p className="text-sm font-medium tracking-wide text-brand">背题完成</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-text-primary">
          {title}
        </h1>
        <div className="mt-8 border border-border bg-bg-sheet px-6 py-5 shadow-paper">
          <p className="font-serif text-5xl font-semibold tabular-nums text-brand">
            {masteryRate}%
          </p>
          <p className="mt-2 text-sm text-text-secondary">掌握率</p>
        </div>
        <Stagger as="dl" className="mt-6 grid grid-cols-3 gap-3 text-center">
          <StaggerItem className="border border-border bg-bg-surface p-3">
            <dt className="text-xs text-text-muted">记住了</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-success">
              {knownCount}
            </dd>
          </StaggerItem>
          <StaggerItem className="border border-border bg-bg-surface p-3">
            <dt className="text-xs text-text-muted">没记住</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-error">
              {reviewCount}
            </dd>
          </StaggerItem>
          <StaggerItem className="border border-border bg-bg-surface p-3">
            <dt className="text-xs text-text-muted">未评价</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-text-secondary">
              {unansweredCount}
            </dd>
          </StaggerItem>
        </Stagger>
        <div className="mt-8 flex flex-col gap-3">
          <Button onClick={onPrimary}>{primaryLabel}</Button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1"
              disabled={!canRetryReview}
              onClick={onRetryReview}
              variant="outline"
            >
              只背没记住的
            </Button>
            <Button
              className="flex-1"
              onClick={onRetryAll}
              variant="outline"
            >
              再背一遍
            </Button>
          </div>
        </div>
      </motion.section>
    </main>
  );
}

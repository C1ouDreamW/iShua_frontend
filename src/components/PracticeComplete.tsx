import { Button } from "@/components/ui/button";

type PracticeCompleteProps = {
  title: string;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  onPrimary: () => void;
  onRetry: () => void;
  primaryLabel?: string;
};

export function PracticeComplete({
  title,
  correctCount,
  wrongCount,
  unansweredCount,
  onPrimary,
  onRetry,
  primaryLabel = "返回大厅",
}: PracticeCompleteProps) {
  const answeredCount = correctCount + wrongCount;
  const accuracy =
    answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="paper-panel motion-safe:animate-complete-rise w-full max-w-md p-8 text-center">
        <p className="text-sm font-medium tracking-wide text-brand">练习完成</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-text-primary">
          {title}
        </h1>
        <div className="mt-8 border border-border bg-bg-sheet px-6 py-5 shadow-paper">
          <p className="font-serif text-5xl font-semibold tabular-nums text-brand">
            {accuracy}%
          </p>
          <p className="mt-2 text-sm text-text-secondary">正确率</p>
        </div>
        <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div
            className="motion-safe:animate-stat-in border border-border bg-bg-surface p-3"
            style={{ animationDelay: "var(--motion-stagger)" }}
          >
            <dt className="text-xs text-text-muted">答对</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-success">
              {correctCount}
            </dd>
          </div>
          <div
            className="motion-safe:animate-stat-in border border-border bg-bg-surface p-3"
            style={{ animationDelay: "calc(2 * var(--motion-stagger))" }}
          >
            <dt className="text-xs text-text-muted">答错</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-error">
              {wrongCount}
            </dd>
          </div>
          <div
            className="motion-safe:animate-stat-in border border-border bg-bg-surface p-3"
            style={{ animationDelay: "calc(3 * var(--motion-stagger))" }}
          >
            <dt className="text-xs text-text-muted">未答</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-text-secondary">
              {unansweredCount}
            </dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={onPrimary}>
            {primaryLabel}
          </Button>
          <Button className="flex-1" onClick={onRetry} variant="outline">
            再刷一遍
          </Button>
        </div>
      </section>
    </main>
  );
}

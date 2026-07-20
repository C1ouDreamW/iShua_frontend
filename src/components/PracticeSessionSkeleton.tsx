export function PracticeSessionSkeleton() {
  return (
    <main aria-label="正在加载题目" className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="h-16 animate-pulse rounded-md border border-border bg-bg-surface" />
        <div className="h-[520px] animate-pulse rounded-lg border border-border bg-bg-sheet" />
      </div>
    </main>
  );
}

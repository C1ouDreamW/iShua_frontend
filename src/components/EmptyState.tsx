type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-bg-surface/70 px-6 py-12 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-brand-muted/70 font-serif text-3xl font-semibold text-brand/40">
        刷
      </div>
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="font-serif text-2xl font-semibold text-text-primary">
          {title}
        </h2>
        <p className="text-sm leading-6 text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

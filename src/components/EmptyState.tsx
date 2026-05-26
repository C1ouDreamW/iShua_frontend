import { LogoMark } from "@/components/LogoMark";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="paper-panel flex min-h-64 flex-col items-center justify-center gap-4 border-dashed bg-bg-surface/80 px-6 py-12 text-center">
      <LogoMark faded size="md" />
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="font-serif text-2xl font-semibold text-text-primary">
          {title}
        </h2>
        <p className="text-sm leading-6 text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

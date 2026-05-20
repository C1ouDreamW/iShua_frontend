import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "加载失败",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border bg-error-bg px-6 py-12 text-center">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-error">
          {title}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
          {message}
        </p>
      </div>
      {onRetry ? (
        <Button onClick={onRetry} variant="outline">
          重试
        </Button>
      ) : null}
    </div>
  );
}

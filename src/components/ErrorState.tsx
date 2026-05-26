import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
};

export function ErrorState({
  title = "加载失败",
  message,
  onRetry,
  backHref,
  backLabel = "返回大厅",
}: ErrorStateProps) {
  return (
    <div className="paper-panel flex min-h-64 flex-col items-center justify-center gap-4 border-error/25 bg-error-bg px-6 py-12 text-center">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-error">
          {title}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
          {message}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <Button onClick={onRetry} variant="outline">
            重试
          </Button>
        ) : null}
        {backHref ? (
          <Button asChild variant={onRetry ? "ghost" : "outline"}>
            <Link to={backHref}>{backLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

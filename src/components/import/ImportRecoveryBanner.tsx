import { Loader2 } from "lucide-react";

import type { AiImportTaskSummary } from "@/api/aiImport";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ImportRecoveryBannerProps = {
  parsedTasks: AiImportTaskSummary[];
  inProgressTasks: AiImportTaskSummary[];
  loading: boolean;
  listError: string | null;
  resuming?: boolean;
  onResumeParsed: (task: AiImportTaskSummary) => void;
  onResumeProgress: (task: AiImportTaskSummary) => void;
};

function formatTaskLabel(task: AiImportTaskSummary) {
  const name = task.fileName?.trim() || "未命名文件";
  const count =
    task.questionCount != null && task.questionCount > 0
      ? `，${task.questionCount} 题`
      : "";

  return `${name}${count}`;
}

export function ImportRecoveryBanner({
  parsedTasks,
  inProgressTasks,
  loading,
  listError,
  resuming = false,
  onResumeParsed,
  onResumeProgress,
}: ImportRecoveryBannerProps) {
  const hasTasks = parsedTasks.length > 0 || inProgressTasks.length > 0;

  if (!loading && !hasTasks && !listError) {
    return null;
  }

  return (
    <section
      aria-label="进行中的导入任务"
      className={cn(
        "rounded-2xl border border-brand/30 bg-brand-muted/40 px-4 py-4",
      )}
    >
      <h2 className="text-sm font-semibold text-text-primary">进行中的导入</h2>
      <p className="mt-1 text-sm text-text-secondary">
        离开页面后仍可在此继续解析或确认导入，无需重新上传。
      </p>

      {loading ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          正在加载任务…
        </div>
      ) : null}

      {listError ? (
        <p className="mt-3 text-sm text-error" role="alert">
          {listError}
        </p>
      ) : null}

      {!loading && parsedTasks.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {parsedTasks.map((task) => (
            <li
              className="flex flex-col gap-2 rounded-xl border bg-bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              key={task.taskId ?? task.fileName}
            >
              <div className="min-w-0 text-sm">
                <p className="font-medium text-text-primary">待确认导入</p>
                <p className="truncate text-text-secondary">
                  {formatTaskLabel(task)}
                </p>
              </div>
              <Button
                disabled={resuming || !task.taskId}
                onClick={() => onResumeParsed(task)}
                size="sm"
                type="button"
              >
                继续确认导入
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && inProgressTasks.length > 0 ? (
        <ul className={cn("space-y-2", parsedTasks.length > 0 && "mt-2")}>
          {inProgressTasks.map((task) => (
            <li
              className="flex flex-col gap-2 rounded-xl border bg-bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              key={task.taskId ?? task.fileName}
            >
              <div className="min-w-0 text-sm">
                <p className="font-medium text-text-primary">正在解析</p>
                <p className="truncate text-text-secondary">
                  {formatTaskLabel(task)}
                </p>
              </div>
              <Button
                disabled={resuming || !task.taskId}
                onClick={() => onResumeProgress(task)}
                size="sm"
                type="button"
                variant="outline"
              >
                查看进度
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

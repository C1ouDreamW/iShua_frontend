import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";

import { useAiAnswerTask } from "@/hooks/useAiAnswerTask";
import { Button } from "@/components/ui/button";
import { DURATION, EASE_OUT } from "@/lib/motion";
import {
  countMissingAnswerable,
  type EditablePreviewQuestion,
} from "@/lib/aiImport";
import { cn } from "@/lib/utils";

type AiAnswerPanelProps = {
  taskId: string | null;
  disabled?: boolean;
  previewQuestions: EditablePreviewQuestion[];
  onMerged: (merged: EditablePreviewQuestion[]) => void;
};

export function AiAnswerPanel({
  taskId,
  disabled,
  previewQuestions,
  onMerged,
}: AiAnswerPanelProps) {
  const missingCount = countMissingAnswerable(previewQuestions);

  const { phase, status, error, create, reset } = useAiAnswerTask(
    previewQuestions,
    onMerged,
  );

  if (missingCount === 0 && phase === "idle") {
    return null;
  }

  return (
    <div className="rounded-xl border border-brand/30 bg-brand-muted/40 p-4">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          key={phase}
          transition={{ duration: DURATION.press, ease: EASE_OUT }}
        >
          {phase === "idle" ? (
            <IdleView
              disabled={disabled || !taskId}
              missingCount={missingCount}
              onStart={() => void create(taskId!)}
            />
          ) : null}

          {phase === "creating" ? (
            <ProgressView
              hint="正在创建解答任务…"
              status="SUBMITTED"
            />
          ) : null}

          {phase === "polling" ? (
            <ProgressView
              answeredCount={status?.answeredCount ?? 0}
              hint={status?.message ?? "AI 正在分片投票解答，请稍候…"}
              status={status?.status ?? "PROCESSING"}
              totalCount={status?.totalCount ?? 0}
            />
          ) : null}

          {phase === "ready" ? (
            <ReadyView
              answeredCount={status?.answeredCount ?? 0}
              onReset={reset}
              status={status?.status}
              totalCount={status?.totalCount ?? 0}
            />
          ) : null}

          {phase === "failed" ? (
            <FailedView error={error} onReset={reset} />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

type IdleViewProps = {
  missingCount: number;
  disabled?: boolean;
  onStart: () => void;
};

function IdleView({ missingCount, disabled, onStart }: IdleViewProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <Sparkles
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-brand"
        />
        <div>
          <p className="text-sm font-medium text-text-primary">
            检测到 {missingCount} 道缺答案客观题
          </p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">
            可触发 AI 解答（分片 + 投票），生成带置信度的答案供你确认。
            LOW 置信度题请重点复核。
          </p>
        </div>
      </div>
      <Button
        className={cn("shrink-0")}
        disabled={disabled}
        onClick={onStart}
        type="button"
      >
        <Sparkles aria-hidden="true" className="size-4" />
        AI 解答
      </Button>
    </div>
  );
}

type ProgressViewProps = {
  status: string;
  hint: string;
  totalCount?: number;
  answeredCount?: number;
};

function ProgressView({
  status,
  hint,
  totalCount = 0,
  answeredCount = 0,
}: ProgressViewProps) {
  const ratio =
    totalCount > 0 ? Math.min(100, Math.round((answeredCount / totalCount) * 100)) : 0;

  return (
    <div className="flex items-start gap-3">
      <Loader2
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 animate-spin text-brand"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">
          AI 解答中
          <span className="ml-2 rounded-md bg-bg-surface px-1.5 py-0.5 text-xs text-text-muted">
            {status}
          </span>
        </p>
        <p className="mt-1 text-xs leading-5 text-text-secondary">{hint}</p>
        {totalCount > 0 ? (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-surface">
              <motion.div
                animate={{ width: `${ratio}%` }}
                className="h-full rounded-full bg-brand"
                initial={false}
                transition={{ duration: DURATION.expand, ease: EASE_OUT }}
              />
            </div>
            <span className="text-xs tabular-nums text-text-muted">
              {answeredCount}/{totalCount}
            </span>
          </div>
        ) : null}
        <p className="mt-2 text-xs text-text-muted">
          可关闭页面，解答结果会在重新打开时合并到预览。
        </p>
      </div>
    </div>
  );
}

type ReadyViewProps = {
  status?: string;
  totalCount: number;
  answeredCount: number;
  onReset: () => void;
};

function ReadyView({
  status,
  totalCount,
  answeredCount,
  onReset,
}: ReadyViewProps) {
  const failedCount = totalCount - answeredCount;
  const isPartial = status === "PARTIAL";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-success"
        />
        <div>
          <p className="text-sm font-medium text-text-primary">
            解答完成，已合并到预览
          </p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">
            成功 {answeredCount} 题
            {isPartial && failedCount > 0
              ? `，失败 ${failedCount} 题（仍为缺答案，可再次解答）`
              : null}
            。请逐题复核答案，重点查看 LOW 置信度题。
          </p>
        </div>
      </div>
      <Button
        className="shrink-0"
        onClick={onReset}
        size="sm"
        type="button"
        variant="outline"
      >
        重新解答
      </Button>
    </div>
  );
}

type FailedViewProps = {
  error: string | null;
  onReset: () => void;
};

function FailedView({ error, onReset }: FailedViewProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-error"
        />
        <div>
          <p className="text-sm font-medium text-text-primary">解答失败</p>
          <p className="mt-1 text-xs leading-5 text-error">
            {error ?? "请稍后重试。"}
          </p>
        </div>
      </div>
      <Button
        className="shrink-0"
        onClick={onReset}
        size="sm"
        type="button"
        variant="outline"
      >
        重试
      </Button>
    </div>
  );
}

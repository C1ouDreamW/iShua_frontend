import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Upload } from "lucide-react";

import {
  getTaskStatus,
  submitImport,
  type AiImportTaskSummary,
} from "@/api/aiImport";
import { batchImportQuestions } from "@/api/bankNodes";
import { ImportRecoveryBanner } from "@/components/import/ImportRecoveryBanner";
import { PreviewQuestionTable } from "@/components/import/PreviewQuestionTable";
import { AiAnswerPanel } from "@/components/import/AiAnswerPanel";
import { Button } from "@/components/ui/button";
import { DURATION, EASE_OUT, slideVariants } from "@/lib/motion";
import { useAiImportRecovery } from "@/hooks/useAiImportRecovery";
import {
  clearImportSessionTaskId,
  createEditableList,
  editableToPreview,
  fetchPreviewQuestionsForTask,
  IMPORT_EXPIRED_MESSAGE,
  IMPORT_TASK_MISSING_MESSAGE,
  isInProgressImportStatus,
  isParsedReady,
  isTerminalImportStatus,
  resolveImportError,
  setImportSessionTaskId,
  validateImportFile,
  type EditablePreviewQuestion,
  type ImportWizardStep,
} from "@/lib/aiImport";
import { validateQuestionForm } from "@/lib/questionForm";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 3000;
const STEPS: { id: ImportWizardStep; label: string }[] = [
  { id: "upload", label: "上传" },
  { id: "parsing", label: "解析" },
  { id: "preview", label: "预览" },
  { id: "complete", label: "完成" },
];

type ImportWizardProps = {
  bankId: number;
  bankTitle: string;
  initialTaskId?: string | null;
};

export function ImportWizard({
  bankId,
  bankTitle,
  initialTaskId,
}: ImportWizardProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialResumeDoneRef = useRef(false);

  const [step, setStep] = useState<ImportWizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewLoadError, setPreviewLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<EditablePreviewQuestion[]>(
    [],
  );
  const [importedCount, setImportedCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [prevStepIndex, setPrevStepIndex] = useState(0);
  const [stepDirection, setStepDirection] = useState<1 | -1>(1);
  const [parseElapsedMs, setParseElapsedMs] = useState(0);
  const parseStartRef = useRef<number | null>(null);

  const {
    parsedTasks,
    inProgressTasks,
    loading: recoveryLoading,
    listError: recoveryListError,
    refreshTasks,
    findTaskById,
  } = useAiImportRecovery({ bankId });

  const applyStatusSnapshot = useCallback(
    (status: NonNullable<Awaited<ReturnType<typeof getTaskStatus>>>) => {
      setStatusMessage(status.message ?? null);

      if (status.status === "FAILED") {
        setError(status.message || "解析失败，请检查文件后重试。");
        setStep("upload");
        clearImportSessionTaskId(bankId);
        return;
      }

      if (status.status === "EXPIRED") {
        setError(IMPORT_EXPIRED_MESSAGE);
        setStep("upload");
        clearImportSessionTaskId(bankId);
        void refreshTasks();
        return;
      }

      if (status.status === "IMPORTED") {
        setImportedCount(status.totalCount ?? status.questions?.length ?? 0);
        setStep("complete");
        clearImportSessionTaskId(bankId);
        void refreshTasks();
        return;
      }

      if (isParsedReady(status.status)) {
        setPreviewQuestions(createEditableList(status.questions ?? []));
        setPreviewLoadError(
          status.questions?.length ? null : "预览题目为空，请重新拉取。",
        );
        setStep("preview");
        return;
      }

      if (isInProgressImportStatus(status.status)) {
        setStatusMessage(status.message ?? "正在处理，请稍候…");
        setStep("parsing");
      }
    },
    [bankId, refreshTasks],
  );

  const resumeFromSummary = useCallback(
    async (summary: AiImportTaskSummary, options?: { includePreview?: boolean }) => {
      const id = summary.taskId;

      if (!id) {
        setError("任务 ID 无效，请重新上传。");
        return;
      }

      setResuming(true);
      setError(null);
      setPreviewLoadError(null);
      setTaskId(id);
      setImportSessionTaskId(bankId, id);

      try {
        if (summary.status === "PARSED") {
          let activeSummary = summary;

          if (options?.includePreview && !activeSummary.questions?.length) {
            await refreshTasks({ includePreview: true });
            activeSummary = findTaskById(id) ?? activeSummary;
          }

          const questions = await fetchPreviewQuestionsForTask(
            id,
            activeSummary.questions,
          );
          setPreviewQuestions(createEditableList(questions));
          setPreviewLoadError(questions.length ? null : "预览题目为空，请重新拉取。");
          setStep("preview");
          return;
        }

        if (summary.status === "SUBMITTED" || summary.status === "PROCESSING") {
          setStatusMessage(summary.message ?? "正在解析，请稍候…");
          setStep("parsing");
          return;
        }

        const status = await getTaskStatus(id);

        if (!status) {
          setError(IMPORT_TASK_MISSING_MESSAGE);
          setStep("upload");
          return;
        }

        applyStatusSnapshot(status);
      } catch (resumeError) {
        setError(resolveImportError(resumeError));
        setStep("upload");
        void refreshTasks();
      } finally {
        setResuming(false);
      }
    },
    [applyStatusSnapshot, bankId, findTaskById, refreshTasks],
  );

  const resumeFromTaskId = useCallback(
    async (id: string) => {
      const summary = findTaskById(id);

      if (summary) {
        await resumeFromSummary(summary, { includePreview: true });
        return;
      }

      setResuming(true);
      setError(null);
      setTaskId(id);
      setImportSessionTaskId(bankId, id);

      try {
        const status = await getTaskStatus(id);

        if (!status) {
          setError(IMPORT_TASK_MISSING_MESSAGE);
          setStep("upload");
          return;
        }

        if (status.status === "PARSED") {
          setPreviewQuestions(createEditableList(status.questions ?? []));
          setPreviewLoadError(
            status.questions?.length ? null : "预览题目为空，请重新拉取。",
          );
          setStep("preview");
          return;
        }

        applyStatusSnapshot(status);
      } catch (resumeError) {
        setError(resolveImportError(resumeError));
        setStep("upload");
      } finally {
        setResuming(false);
      }
    },
    [applyStatusSnapshot, bankId, findTaskById, resumeFromSummary],
  );

  useEffect(() => {
    if (initialResumeDoneRef.current || recoveryLoading || !initialTaskId) {
      return;
    }

    initialResumeDoneRef.current = true;
    void resumeFromTaskId(initialTaskId);
  }, [initialTaskId, recoveryLoading, resumeFromTaskId]);

  useEffect(() => {
    if (step !== "parsing") {
      parseStartRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 离开解析步时重置计时显示
      setParseElapsedMs(0);
      return;
    }
    parseStartRef.current = performance.now();
    setParseElapsedMs(0);
    const id = window.setInterval(() => {
      if (parseStartRef.current != null) {
        setParseElapsedMs(performance.now() - parseStartRef.current);
      }
    }, 100);
    return () => {
      window.clearInterval(id);
    };
  }, [step]);

  useEffect(() => {
    if (step !== "parsing" || !taskId) {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    async function poll() {
      try {
        const status = await getTaskStatus(taskId!);

        if (cancelled) {
          return;
        }

        if (!status) {
          setError(IMPORT_TASK_MISSING_MESSAGE);
          setStep("upload");
          clearImportSessionTaskId(bankId);
          return;
        }

        setStatusMessage(status.message ?? null);

        if (isTerminalImportStatus(status.status)) {
          applyStatusSnapshot(status);
          return;
        }

        if (isParsedReady(status.status)) {
          applyStatusSnapshot(status);
          return;
        }

        timer = window.setTimeout(poll, POLL_INTERVAL_MS);
      } catch (pollError) {
        if (!cancelled) {
          setError(resolveImportError(pollError));
          setStep("upload");
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [applyStatusSnapshot, bankId, step, taskId]);

  async function reloadPreviewQuestions() {
    if (!taskId) {
      return;
    }

    setPreviewLoadError(null);
    setResuming(true);

    try {
      const questions = await fetchPreviewQuestionsForTask(taskId);
      setPreviewQuestions(createEditableList(questions));
      setPreviewLoadError(questions.length ? null : "预览题目为空，请重新拉取。");
    } catch (loadError) {
      setPreviewLoadError(resolveImportError(loadError));
    } finally {
      setResuming(false);
    }
  }

  function handleFileSelect(nextFile: File | null) {
    setFile(nextFile);
    setError(null);
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) {
      handleFileSelect(dropped);
    }
  }

  async function handleUpload() {
    const validationError = validateImportFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await submitImport(bankId, file!);
      const nextTaskId = result.taskId;

      if (!nextTaskId) {
        throw new Error("未返回任务 ID。");
      }

      setTaskId(nextTaskId);
      setImportSessionTaskId(bankId, nextTaskId);
      setStep("parsing");
      setStatusMessage("任务已提交，正在排队解析…");
      void refreshTasks();
    } catch (uploadError) {
      setError(resolveImportError(uploadError));
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmImport() {
    if (!taskId) {
      setError("缺少任务 ID，请重新上传。");
      setStep("upload");
      return;
    }

    for (const [index, question] of previewQuestions.entries()) {
      const validationError = validateQuestionForm(question);

      if (validationError) {
        setError(`第 ${index + 1} 题：${validationError}`);
        return;
      }
    }

    setImporting(true);
    setError(null);

    try {
      await batchImportQuestions(bankId, {
        questions: previewQuestions.map(editableToPreview),
        taskId,
      });

      setImportedCount(previewQuestions.length);
      setStep("complete");
      clearImportSessionTaskId(bankId);
      void refreshTasks();
    } catch (importError) {
      const message = resolveImportError(importError);
      setError(message);

      if (message === IMPORT_EXPIRED_MESSAGE) {
        setStep("upload");
        setTaskId(null);
        void refreshTasks();
      }
    } finally {
      setImporting(false);
    }
  }

  function resetToUpload() {
    setStep("upload");
    setFile(null);
    setTaskId(null);
    setPreviewQuestions([]);
    setStatusMessage(null);
    setPreviewLoadError(null);
    setError(null);
  }

  const stepIndex = STEPS.findIndex((item) => item.id === step);
  const showRecoveryBanner = step === "upload" && !uploading;

  if (stepIndex !== prevStepIndex) {
    setStepDirection(stepIndex > prevStepIndex ? 1 : -1);
    setPrevStepIndex(stepIndex);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <nav aria-label="导入步骤" className="flex flex-wrap gap-2">
          {STEPS.map((item, index) => {
            const reached = index <= stepIndex;
            const isCurrent = index === stepIndex;

            return (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors duration-200",
                  reached
                    ? "border-brand bg-brand-muted text-brand"
                    : "border-border text-text-muted",
                )}
                key={item.id}
              >
                <motion.span
                  animate={isCurrent ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                  className="font-medium tabular-nums"
                  transition={{ duration: DURATION.expand, ease: EASE_OUT }}
                >
                  {index + 1}
                </motion.span>
                {item.label}
              </div>
            );
          })}
        </nav>
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-border">
          <motion.div
            animate={{ scaleX: stepIndex / (STEPS.length - 1) }}
            className="h-full rounded-full bg-brand"
            initial={false}
            style={{ originX: 0 }}
            transition={{ duration: DURATION.page, ease: EASE_OUT }}
          />
        </div>
      </div>

      {showRecoveryBanner ? (
        <ImportRecoveryBanner
          inProgressTasks={inProgressTasks}
          listError={recoveryListError}
          loading={recoveryLoading}
          onResumeParsed={(task) => void resumeFromSummary(task, { includePreview: true })}
          onResumeProgress={(task) => void resumeFromSummary(task)}
          parsedTasks={parsedTasks}
          resuming={resuming}
        />
      ) : null}

      <AnimatePresence custom={stepDirection} initial={false} mode="wait">
        <motion.div
          animate="center"
          custom={stepDirection}
          exit="exit"
          initial="enter"
          key={step}
          variants={slideVariants}
        >
      {step === "upload" ? (
        <section className="space-y-4">
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed px-6 py-14 text-center transition-[border-color,background-color] duration-100",
              dragOver ? "border-brand bg-brand-muted/50" : "border-border bg-bg-surface",
            )}
            onDragLeave={() => setDragOver(false)}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDrop={handleDrop}
          >
            <Upload aria-hidden="true" className="size-10 text-brand" />
            <div>
              <p className="font-medium text-text-primary">拖拽文件到此处</p>
              <p className="mt-1 text-sm text-text-secondary">
                支持 .txt / .pdf / .docx，单文件不超过 10MB
              </p>
            </div>
            <input
              accept=".txt,.pdf,.docx"
              className="hidden"
              onChange={(event) =>
                handleFileSelect(event.target.files?.[0] ?? null)
              }
              onClick={(event) => {
                (event.target as HTMLInputElement).value = "";
              }}
              ref={fileInputRef}
              type="file"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              type="button"
              variant="outline"
            >
              选择文件
            </Button>
            {file ? (
              <p className="text-sm text-text-secondary">
                已选择：{file.name}（{(file.size / 1024 / 1024).toFixed(2)} MB）
              </p>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex gap-3">
            <Button disabled={uploading || !file} onClick={() => void handleUpload()}>
              {uploading ? "提交中…" : "开始解析"}
            </Button>
            <Button asChild variant="outline">
              <Link to={`/app/manage/banks/${bankId}`}>返回题库详情</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {step === "parsing" ? (
        <section className="paper-panel flex flex-col items-center gap-4 px-6 py-16 text-center">
          <Loader2 aria-hidden="true" className="size-10 animate-spin text-brand" />
          <p
            aria-live="off"
            className="text-sm font-medium tabular-nums text-text-secondary"
          >
            {(parseElapsedMs / 1000).toFixed(1)} s
          </p>
          <div>
            <h2 className="font-serif text-xl font-semibold text-text-primary">
              正在解析，请稍候…
            </h2>
            <AnimatePresence initial={false} mode="wait">
              <motion.p
                animate={{ opacity: 1 }}
                className="mt-2 text-sm text-text-secondary"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={statusMessage || "default"}
                transition={{ duration: DURATION.press, ease: EASE_OUT }}
              >
                {statusMessage || "AI 正在读取文件并生成题目预览。"}
              </motion.p>
            </AnimatePresence>
            <p className="mt-2 text-xs text-text-muted">
              可关闭页面，稍后在「进行中的导入」继续。
            </p>
          </div>
          <Button onClick={resetToUpload} type="button" variant="outline">
            返回上传
          </Button>
        </section>
      ) : null}

      {step === "preview" ? (
        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-xl font-semibold text-text-primary">
              预览并确认导入
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              共解析 {previewQuestions.length} 题，可在入库前展开编辑。
            </p>
          </div>

          {previewLoadError ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-error/30 bg-error/5 px-4 py-3">
              <p className="text-sm text-error" role="alert">
                {previewLoadError}
              </p>
              <Button
                disabled={resuming || !taskId}
                onClick={() => void reloadPreviewQuestions()}
                size="sm"
                type="button"
                variant="outline"
              >
                重新拉取预览
              </Button>
            </div>
          ) : null}

          <AiAnswerPanel
            disabled={importing || resuming}
            onMerged={setPreviewQuestions}
            previewQuestions={previewQuestions}
            taskId={taskId}
          />

          <PreviewQuestionTable
            disabled={importing || resuming}
            onChange={setPreviewQuestions}
            questions={previewQuestions}
          />

          {error ? (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              disabled={importing || resuming || previewQuestions.length === 0}
              onClick={() => void handleConfirmImport()}
            >
              {importing ? "导入中…" : "确认导入"}
            </Button>
            <Button disabled={importing} onClick={resetToUpload} variant="outline">
              返回上传
            </Button>
          </div>
        </section>
      ) : null}

      {step === "complete" ? (
        <section className="paper-panel flex flex-col items-center gap-4 px-6 py-16 text-center">
          <motion.div
            animate={{ scale: 1, opacity: 1 }}
            initial={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
          >
            <CheckCircle2 aria-hidden="true" className="size-12 text-success" />
          </motion.div>
          <div>
            <h2 className="font-serif text-2xl font-semibold text-text-primary">
              已导入 {importedCount} 题
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              「{bankTitle}」已更新，可在题库详情中查看新题目。
            </p>
          </div>
          <Button onClick={() => navigate(`/app/manage/banks/${bankId}`)}>
            返回题库详情
          </Button>
        </section>
      ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

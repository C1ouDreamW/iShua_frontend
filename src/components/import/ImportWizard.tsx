import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Upload } from "lucide-react";

import { getTaskStatus, submitImport } from "@/api/aiImport";
import { batchImportQuestions } from "@/api/banks";
import { PreviewQuestionTable } from "@/components/import/PreviewQuestionTable";
import { Button } from "@/components/ui/button";
import {
  createEditableList,
  editableToPreview,
  isParsedReady,
  resolveImportError,
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
};

export function ImportWizard({ bankId, bankTitle }: ImportWizardProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportWizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<EditablePreviewQuestion[]>(
    [],
  );
  const [importedCount, setImportedCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

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
          setError("任务不存在或已过期，请重新上传。");
          setStep("upload");
          return;
        }

        setStatusMessage(status.message ?? null);

        if (status.status === "FAILED") {
          setError(status.message || "解析失败，请检查文件后重试。");
          setStep("upload");
          return;
        }

        if (status.status === "IMPORTED") {
          setImportedCount(status.totalCount ?? status.questions?.length ?? 0);
          setStep("complete");
          return;
        }

        if (isParsedReady(status.status)) {
          setPreviewQuestions(createEditableList(status.questions ?? []));
          setStep("preview");
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
  }, [step, taskId]);

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
      setStep("parsing");
      setStatusMessage("任务已提交，正在排队解析…");
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
    } catch (importError) {
      setError(resolveImportError(importError));
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
    setError(null);
  }

  const stepIndex = STEPS.findIndex((item) => item.id === step);

  return (
    <div className="space-y-8">
      <nav aria-label="导入步骤" className="flex flex-wrap gap-2">
        {STEPS.map((item, index) => (
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
              index <= stepIndex
                ? "border-brand bg-brand-muted text-brand"
                : "text-text-muted",
            )}
            key={item.id}
          >
            <span className="font-medium tabular-nums">{index + 1}</span>
            {item.label}
          </div>
        ))}
      </nav>

      {step === "upload" ? (
        <section className="space-y-4">
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors",
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
              <Link to={`/app/banks/${bankId}`}>返回题库详情</Link>
            </Button>
          </div>
        </section>
      ) : null}

      {step === "parsing" ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl border bg-bg-surface px-6 py-16 text-center">
          <Loader2 aria-hidden="true" className="size-10 animate-spin text-brand" />
          <div>
            <h2 className="font-serif text-xl font-semibold text-text-primary">
              正在解析，请稍候…
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {statusMessage || "AI 正在读取文件并生成题目预览。"}
            </p>
          </div>
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

          <PreviewQuestionTable
            disabled={importing}
            onChange={setPreviewQuestions}
            questions={previewQuestions}
          />

          {error ? (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button disabled={importing} onClick={() => void handleConfirmImport()}>
              {importing ? "导入中…" : "确认导入"}
            </Button>
            <Button disabled={importing} onClick={resetToUpload} variant="outline">
              返回上传
            </Button>
          </div>
        </section>
      ) : null}

      {step === "complete" ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl border bg-bg-surface px-6 py-16 text-center">
          <CheckCircle2 aria-hidden="true" className="size-12 text-success" />
          <div>
            <h2 className="font-serif text-2xl font-semibold text-text-primary">
              已导入 {importedCount} 题
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              「{bankTitle}」已更新，可在题库详情中查看新题目。
            </p>
          </div>
          <Button onClick={() => navigate(`/app/banks/${bankId}`)}>
            返回题库详情
          </Button>
        </section>
      ) : null}
    </div>
  );
}

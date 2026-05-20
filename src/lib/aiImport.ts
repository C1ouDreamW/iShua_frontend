import { ApiError } from "@/api/client";
import type { QuestionPreview } from "@/api/aiImport";
import {
  createEmptyFormState,
  type QuestionFormState,
  type QuestionType,
} from "@/lib/questionForm";

export const ACCEPTED_IMPORT_EXTENSIONS = [".txt", ".pdf", ".docx"];
export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;

export type ImportWizardStep = "upload" | "parsing" | "preview" | "complete";

export type EditablePreviewQuestion = QuestionFormState & {
  key: string;
};

export function resolveImportError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 429) {
      return "导入过于频繁，请稍后再试（每小时上限）。";
    }

    if (error.code === 409) {
      return "正在导入中，请稍候。";
    }

    if (error.code === 403) {
      return "无权限执行 AI 导入，请开通 PREMIUM。";
    }
  }

  return error instanceof Error ? error.message : "操作失败，请重试。";
}

export function isAcceptedImportFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_IMPORT_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

export function validateImportFile(file: File | null) {
  if (!file) {
    return "请选择要导入的文件。";
  }

  if (!isAcceptedImportFile(file)) {
    return "仅支持 .txt、.pdf、.docx 格式。";
  }

  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return "文件大小不能超过 10MB。";
  }

  return null;
}

export function previewToEditable(
  question: QuestionPreview,
  index: number,
): EditablePreviewQuestion {
  const questionType = (question.questionType ?? "SINGLE") as QuestionType;

  return {
    key: `preview-${index}`,
    analysis: question.analysis ?? "",
    answers: question.answer ?? [],
    options:
      questionType === "JUDGE"
        ? question.options?.length
          ? question.options
          : ["正确", "错误"]
        : question.options?.length
          ? question.options
          : ["", ""],
    questionType,
    sortNo: "",
    stem: question.stem ?? "",
  };
}

export function editableToPreview(question: EditablePreviewQuestion): QuestionPreview {
  const options =
    question.questionType === "JUDGE"
      ? question.options.length > 0
        ? question.options
        : ["正确", "错误"]
      : question.options.map((item) => item.trim()).filter(Boolean);

  return {
    analysis: question.analysis.trim() || undefined,
    answer: question.answers,
    options,
    questionType: question.questionType,
    stem: question.stem.trim(),
  };
}

export function createEditableList(questions: QuestionPreview[]) {
  return questions.map((item, index) => previewToEditable(item, index));
}

export function formatAnswerSummary(answers: string[] | undefined) {
  if (!answers?.length) {
    return "—";
  }

  return answers.join("、");
}

export function isTerminalImportStatus(status: string | undefined) {
  return status === "IMPORTED" || status === "FAILED";
}

export function isParsedReady(status: string | undefined) {
  return status === "PARSED";
}

export function createEmptyPreviewRow(): EditablePreviewQuestion {
  return {
    ...createEmptyFormState("SINGLE"),
    key: `preview-new-${Date.now()}`,
  };
}

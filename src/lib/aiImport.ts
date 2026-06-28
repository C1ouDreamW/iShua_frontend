import { ApiError } from "@/api/client";
import { getTaskStatus, type QuestionPreview } from "@/api/aiImport";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import {
  createEmptyFormState,
  type QuestionFormState,
  type QuestionType,
} from "@/lib/questionForm";

export const ACCEPTED_IMPORT_EXTENSIONS = [".txt", ".pdf", ".docx"];
export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;

export type ImportWizardStep = "upload" | "parsing" | "preview" | "complete";

export type ImportTaskStatus =
  | "SUBMITTED"
  | "PROCESSING"
  | "PARSED"
  | "IMPORTING"
  | "IMPORTED"
  | "FAILED"
  | "EXPIRED";

export type AnswerTaskStatus =
  | "SUBMITTED"
  | "PROCESSING"
  | "ANSWERED"
  | "PARTIAL"
  | "FAILED"
  | "IMPORTED";

export type AnswerSource = "ORIGINAL" | "MISSING" | "AI_GENERATED";
export type AnswerConfidence = "HIGH" | "MEDIUM" | "LOW";

export const ANSWER_SOURCE_LABEL: Record<AnswerSource, string> = {
  ORIGINAL: "原文",
  MISSING: "缺答案",
  AI_GENERATED: "AI解答",
};

export const ANSWER_CONFIDENCE_LABEL: Record<AnswerConfidence, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

/** 仅这几类客观题可进入 AI 解答流程。 */
const ANSWERABLE_QUESTION_TYPES = new Set(["SINGLE", "MULTI", "JUDGE"]);

export const IMPORT_EXPIRED_MESSAGE = "任务已过期，请重新上传文件";
export const IMPORT_TASK_MISSING_MESSAGE = "任务不存在或已失效，请重新上传";

const IMPORT_SESSION_KEY_PREFIX = "ishua_ai_import_active:";

export function getImportSessionTaskId(bankId: number) {
  try {
    return sessionStorage.getItem(`${IMPORT_SESSION_KEY_PREFIX}${bankId}`);
  } catch {
    return null;
  }
}

export function setImportSessionTaskId(bankId: number, taskId: string) {
  try {
    sessionStorage.setItem(`${IMPORT_SESSION_KEY_PREFIX}${bankId}`, taskId);
  } catch {
    // private mode / quota
  }
}

export function clearImportSessionTaskId(bankId: number) {
  try {
    sessionStorage.removeItem(`${IMPORT_SESSION_KEY_PREFIX}${bankId}`);
  } catch {
    // ignore
  }
}

export type EditablePreviewQuestion = QuestionFormState & {
  key: string;
  /** 答案来源；透传至批量入库，使后端写入 question.answer_source。 */
  answerSource?: AnswerSource;
  /** 答案置信度；仅 AI_GENERATED 题非空，透传至批量入库。 */
  answerConfidence?: AnswerConfidence;
};

function isExpiredImportMessage(message: string | undefined) {
  if (!message) {
    return false;
  }

  return message.includes("过期") || message.includes("EXPIRED");
}

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

    if (error.code === 400 && isExpiredImportMessage(error.message)) {
      return IMPORT_EXPIRED_MESSAGE;
    }
  }

  if (error instanceof Error && isExpiredImportMessage(error.message)) {
    return IMPORT_EXPIRED_MESSAGE;
  }

  return resolveApiErrorMessage(error, "操作失败，请重试。");
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
    answerConfidence: question.answerConfidence as AnswerConfidence | undefined,
    answerSource: (question.answerSource ?? "ORIGINAL") as AnswerSource,
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
    answerConfidence: question.answerConfidence,
    answerSource: question.answerSource,
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
  return status === "IMPORTED" || status === "FAILED" || status === "EXPIRED";
}

export function isParsedReady(status: string | undefined) {
  return status === "PARSED";
}

export function isInProgressImportStatus(status: string | undefined) {
  return status === "SUBMITTED" || status === "PROCESSING" || status === "IMPORTING";
}

export function isAnswerTerminalStatus(status: string | undefined) {
  return status === "IMPORTED" || status === "FAILED";
}

export function isAnswerInProgressStatus(status: string | undefined) {
  return status === "SUBMITTED" || status === "PROCESSING";
}

export function isAnswerReadyStatus(status: string | undefined) {
  return status === "ANSWERED" || status === "PARTIAL";
}

export function isAnswerFailedStatus(status: string | undefined) {
  return status === "FAILED";
}

export function isLowConfidenceAiQuestion(
  source?: string | null,
  confidence?: string | null,
) {
  return (
    normalizeAnswerSource(source) === "AI_GENERATED" &&
    confidence?.toUpperCase() === "LOW"
  );
}

export function normalizeAnswerSource(value: string | null | undefined): AnswerSource {
  if (value === "MISSING" || value === "AI_GENERATED") {
    return value;
  }
  return "ORIGINAL";
}

/**
 * 是否为可被 AI 解答的客观题：题型为 SINGLE/MULTI/JUDGE 且 answerSource=MISSING。
 * 简答题（SHORT_ANSWER）不进入解答流程。
 */
export function isAnswerableMissingQuestion(question: {
  questionType?: string;
  answerSource?: string;
}) {
  const qtype = question.questionType?.toUpperCase();
  return (
    !!qtype &&
    ANSWERABLE_QUESTION_TYPES.has(qtype) &&
    normalizeAnswerSource(question.answerSource) === "MISSING"
  );
}

export function countMissingAnswerable(
  questions: EditablePreviewQuestion[],
): number {
  return questions.filter(isAnswerableMissingQuestion).length;
}

/**
 * 将 AI 解答结果合并回预览列表：按 stem + questionType 匹配并替换答案相关字段。
 * 未匹配到的题目（非解答范围）保持不变；失败题（answerSource 仍为 MISSING）也会被回填。
 */
export function mergeAiAnswerResults(
  previews: EditablePreviewQuestion[],
  answered: QuestionPreview[],
): EditablePreviewQuestion[] {
  const answeredByKey = new Map<string, QuestionPreview>();
  for (const item of answered) {
    const key = mergeKey(item.questionType, item.stem);
    if (!answeredByKey.has(key)) {
      answeredByKey.set(key, item);
    }
  }

  return previews.map((preview) => {
    const key = mergeKey(preview.questionType, preview.stem);
    const matched = answeredByKey.get(key);

    if (!matched) {
      return preview;
    }

    return {
      ...preview,
      analysis: matched.analysis ?? preview.analysis,
      answerConfidence: matched.answerConfidence as AnswerConfidence | undefined,
      answerSource: normalizeAnswerSource(matched.answerSource),
      answers: matched.answer ?? preview.answers,
    };
  });
}

function mergeKey(questionType: string | undefined, stem: string | undefined) {
  return `${(questionType ?? "").toUpperCase()}\u0000${(stem ?? "").trim()}`;
}

export async function fetchPreviewQuestionsForTask(
  taskId: string,
  summaryQuestions?: QuestionPreview[],
) {
  if (summaryQuestions?.length) {
    return summaryQuestions;
  }

  const status = await getTaskStatus(taskId);

  if (!status) {
    throw new Error(IMPORT_TASK_MISSING_MESSAGE);
  }

  if (status.status === "EXPIRED") {
    throw new Error(IMPORT_EXPIRED_MESSAGE);
  }

  if (!isParsedReady(status.status)) {
    throw new Error(
      status.message ?? `任务当前状态不可预览：${status.status ?? "未知"}`,
    );
  }

  return status.questions ?? [];
}

export function createEmptyPreviewRow(): EditablePreviewQuestion {
  return {
    ...createEmptyFormState("SINGLE"),
    answerSource: "ORIGINAL",
    key: `preview-new-${Date.now()}`,
  };
}

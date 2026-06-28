import { request } from "@/api/client";
import type { PageResult } from "@/api/banks";
import type { components } from "@/types/api";

export type AiImportSubmitResult = components["schemas"]["AiImportSubmitVO"];
export type AiImportTaskStatus = components["schemas"]["AiImportTaskStatusVO"];
export type AiImportTaskSummary = components["schemas"]["AiImportTaskSummaryVO"];
export type QuestionPreview = components["schemas"]["QuestionPreviewVO"];

export type AiAnswerSubmitResult = components["schemas"]["AiAnswerSubmitVO"];
export type AiAnswerTaskStatus = components["schemas"]["AiAnswerTaskStatusVO"];
export type AiAnswerMetrics = components["schemas"]["AiAnswerMetricsVO"];
export type AiAnswerCreatePayload = components["schemas"]["AiAnswerCreateDTO"];

export type PageMyImportTasksQuery = {
  current: number;
  pageSize: number;
  bankId?: number;
  /** 逗号分隔，如 PARSED,PROCESSING */
  status?: string;
  includePreview?: boolean;
};

export const RECOVERABLE_IMPORT_STATUSES = "PARSED,PROCESSING,SUBMITTED";

export function submitImport(bankId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bankId", String(bankId));

  return request<AiImportSubmitResult>("/api/v1/ai-import/submit", {
    body: formData,
    method: "POST",
    query: { bankId },
  });
}

export function getTaskStatus(taskId: string) {
  return request<AiImportTaskStatus | null>(
    `/api/v1/ai-import/tasks/${taskId}/status`,
  );
}

export function pageMyImportTasks(query: PageMyImportTasksQuery) {
  return request<PageResult<AiImportTaskSummary>>("/api/v1/ai-import/tasks", {
    query,
  });
}

export function createAiAnswerTask(
  taskId: string,
  payload: AiAnswerCreatePayload,
) {
  return request<AiAnswerSubmitResult>(
    `/api/v1/ai-import/tasks/${taskId}/ai-answer`,
    {
      body: payload,
      method: "POST",
    },
  );
}

export function getAiAnswerTaskStatus(taskId: string, answerTaskId: string) {
  return request<AiAnswerTaskStatus | null>(
    `/api/v1/ai-import/tasks/${taskId}/ai-answer/${answerTaskId}/status`,
  );
}

export function getAiAnswerTaskResult(taskId: string, answerTaskId: string) {
  return request<AiAnswerTaskStatus | null>(
    `/api/v1/ai-import/tasks/${taskId}/ai-answer/${answerTaskId}/result`,
  );
}

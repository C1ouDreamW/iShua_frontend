import { request } from "@/api/client";
import type { components } from "@/types/api";

export type AiImportSubmitResult = components["schemas"]["AiImportSubmitVO"];
export type AiImportTaskStatus = components["schemas"]["AiImportTaskStatusVO"];
export type QuestionPreview = components["schemas"]["QuestionPreviewVO"];

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

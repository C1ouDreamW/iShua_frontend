import { request } from "@/api/client";
import type { components } from "@/types/api";

export type QuestionBank = components["schemas"]["QuestionBankVO"];
export type Question = components["schemas"]["QuestionVO"];
export type QuestionBankDetailBundle =
  components["schemas"]["QuestionBankDetailBundleVO"];
export type QuestionBankCreatePayload =
  components["schemas"]["QuestionBankCreateDTO"];
export type QuestionBankUpdatePayload =
  components["schemas"]["QuestionBankUpdateDTO"];
export type BatchImportPayload = components["schemas"]["BatchImportRequestDTO"];

export type PageResult<T> = {
  total?: number;
  records?: T[];
} | null;

export function pagePublicBanks(params: {
  current: number;
  pageSize: number;
}) {
  return request<PageResult<QuestionBank>>("/api/v1/question-banks/public", {
    query: params,
  });
}

export function getHotPracticeDetail(bankId: number) {
  return request<QuestionBankDetailBundle>(
    `/api/v1/question-banks/${bankId}/hot-practice-detail`,
  );
}

export function pageMyBanks(params: { current: number; pageSize: number }) {
  return request<PageResult<QuestionBank>>("/api/v1/question-banks", {
    query: params,
  });
}

export function createBank(payload: QuestionBankCreatePayload) {
  return request<number>("/api/v1/question-banks", {
    body: payload,
    method: "POST",
  });
}

export function updateBank(bankId: number, payload: QuestionBankUpdatePayload) {
  return request<null>(`/api/v1/question-banks/${bankId}`, {
    body: payload,
    method: "PUT",
  });
}

export function deleteBank(bankId: number) {
  return request<null>(`/api/v1/question-banks/${bankId}`, {
    method: "DELETE",
  });
}

export async function findMyBank(bankId: number) {
  const data = await pageMyBanks({ current: 1, pageSize: 100 });
  return data?.records?.find((bank) => bank.id === bankId) ?? null;
}

export function batchImportQuestions(bankId: number, payload: BatchImportPayload) {
  return request<null>(`/api/v1/question-banks/${bankId}/questions/batch`, {
    body: payload,
    method: "POST",
  });
}

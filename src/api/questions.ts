import { request } from "@/api/client";
import type { components } from "@/types/api";
import type { PageResult } from "@/api/banks";

export type Question = components["schemas"]["QuestionVO"];
export type QuestionPayload = components["schemas"]["QuestionUpdateDTO"];

export function pageQuestionsInBank(
  bankId: number,
  params: {
    current: number;
    pageSize: number;
    keyword?: string;
  },
) {
  return request<PageResult<Question>>(
    `/api/v1/bank-nodes/${bankId}/questions`,
    { query: params },
  );
}

export function createQuestionInBank(bankId: number, payload: QuestionPayload) {
  return request<number>(`/api/v1/bank-nodes/${bankId}/questions`, {
    body: payload,
    method: "POST",
  });
}

export function getQuestion(id: number) {
  return request<Question>(`/api/v1/questions/${id}`);
}

export function updateQuestion(id: number, payload: QuestionPayload) {
  return request<null>(`/api/v1/questions/${id}`, {
    body: payload,
    method: "PUT",
  });
}

export function deleteQuestion(id: number) {
  return request<null>(`/api/v1/questions/${id}`, {
    method: "DELETE",
  });
}

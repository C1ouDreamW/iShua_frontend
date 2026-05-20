import { request } from "@/api/client";
import type { components } from "@/types/api";
import type { PracticeQuestion } from "@/api/practice";

export type WrongQuestion = components["schemas"]["WrongQuestionVO"];

export type WrongQuestionPageResult = {
  total?: number;
  records?: WrongQuestion[];
} | null;

export function pageWrongQuestions(params: {
  current: number;
  pageSize: number;
  bankId?: number;
}) {
  return request<WrongQuestionPageResult>("/api/v1/wrong-questions", {
    query: params,
  });
}

export function listWrongPractice(bankId?: number) {
  return request<PracticeQuestion[] | null>("/api/v1/wrong-questions/practice", {
    query: bankId ? { bankId } : undefined,
  });
}

export function removeWrongQuestion(id: number) {
  return request<null>(`/api/v1/wrong-questions/${id}`, {
    method: "DELETE",
  });
}

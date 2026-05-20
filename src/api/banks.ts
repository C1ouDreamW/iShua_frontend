import { request } from "@/api/client";
import type { components } from "@/types/api";

export type QuestionBank = components["schemas"]["QuestionBankVO"];
export type Question = components["schemas"]["QuestionVO"];
export type QuestionBankDetailBundle =
  components["schemas"]["QuestionBankDetailBundleVO"];

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

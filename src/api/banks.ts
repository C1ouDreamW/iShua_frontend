/**
 * @deprecated 兼容层。新代码请使用 `@/api/bankNodes` 与 `@/api/questions`。
 */
import {
  batchImportQuestions as batchImportToNode,
  getBankNode,
  getHotPracticeDetail as getNodeHotPracticeDetail,
  isLeafNode,
} from "@/api/bankNodes";
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

/** @deprecated 使用 `pagePublicBankRoots`（`@/api/bankNodes`） */
export function pagePublicBanks(params: {
  current: number;
  pageSize: number;
}) {
  return request<PageResult<QuestionBank>>("/api/v1/question-banks/public", {
    query: params,
  });
}

/** @deprecated 使用 `getHotPracticeDetail`（`@/api/bankNodes`） */
export function getHotPracticeDetail(bankId: number) {
  return getNodeHotPracticeDetail(bankId);
}

/** @deprecated 使用 `pageMyBankRoots` 或 `listMyBankTree` */
export function pageMyBanks(params: { current: number; pageSize: number }) {
  return request<PageResult<QuestionBank>>("/api/v1/question-banks", {
    query: params,
  });
}

/** @deprecated 使用 `createBankNode` */
export function createBank(payload: QuestionBankCreatePayload) {
  return request<number>("/api/v1/question-banks", {
    body: payload,
    method: "POST",
  });
}

/** @deprecated 使用 `updateBankNode` */
export function updateBank(bankId: number, payload: QuestionBankUpdatePayload) {
  return request<null>(`/api/v1/question-banks/${bankId}`, {
    body: payload,
    method: "PUT",
  });
}

/** @deprecated 使用 `deleteBankNode` */
export function deleteBank(bankId: number) {
  return request<null>(`/api/v1/question-banks/${bankId}`, {
    method: "DELETE",
  });
}

/** @deprecated 使用 `getBankNode` */
export async function findMyBank(bankId: number) {
  try {
    const node = await getBankNode(bankId);
    if (!isLeafNode(node)) {
      return null;
    }
    return {
      description: node.description ?? undefined,
      id: node.id,
      isPublic: node.isPublic,
      title: node.title,
    } satisfies QuestionBank;
  } catch {
    return null;
  }
}

/** @deprecated 使用 `batchImportQuestions`（`@/api/bankNodes`） */
export function batchImportQuestions(bankId: number, payload: BatchImportPayload) {
  return batchImportToNode(bankId, payload);
}

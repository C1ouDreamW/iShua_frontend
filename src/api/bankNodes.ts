import { request } from "@/api/client";
import type { components } from "@/types/api";

export type PageResult<T> = {
  total?: number;
  records?: T[];
} | null;

export type BankNodeKind = "FOLDER" | "LEAF";

export type BankNode = {
  id?: number;
  userId?: number;
  parentId?: number | null;
  nodeKind?: BankNodeKind | string;
  title?: string;
  description?: string | null;
  isPublic?: number;
  sortNo?: number;
  questionCount?: number;
  childCount?: number;
  descendantLeafCount?: number;
  hasPublicDescendant?: boolean;
  createTime?: string;
  updateTime?: string;
};

export type BankNodeCreatePayload = {
  parentId?: number | null;
  nodeKind: BankNodeKind;
  title: string;
  description?: string;
  isPublic?: number;
  sortNo?: number;
};

export type BankNodeUpdatePayload = {
  title: string;
  description?: string;
  isPublic?: number;
  sortNo?: number;
};

export type BankNodeMovePayload = {
  newParentId?: number | null;
  newSortNo?: number;
};

export type QuestionBankDetailBundle =
  components["schemas"]["QuestionBankDetailBundleVO"];

export type BatchImportPayload =
  components["schemas"]["BatchImportRequestDTO"];

export type BankTreeScope = "public" | "mine";

export function listPublicBankTree(params?: { rootId?: number }) {
  return request<BankNode[]>("/api/v1/bank-nodes/public/tree", { query: params });
}

export function listMyBankTree(params?: { rootId?: number }) {
  return request<BankNode[]>("/api/v1/bank-nodes/mine/tree", { query: params });
}

export function pagePublicBankRoots(params: {
  current: number;
  pageSize: number;
}) {
  return request<PageResult<BankNode>>("/api/v1/bank-nodes/public/roots", {
    query: params,
  });
}

export function pageMyBankRoots(params: {
  current: number;
  pageSize: number;
}) {
  return request<PageResult<BankNode>>("/api/v1/bank-nodes/mine/roots", {
    query: params,
  });
}

export function getBankNode(nodeId: number) {
  return request<BankNode>(`/api/v1/bank-nodes/${nodeId}`);
}

export function createBankNode(payload: BankNodeCreatePayload) {
  return request<number>("/api/v1/bank-nodes", {
    body: payload,
    method: "POST",
  });
}

export function updateBankNode(nodeId: number, payload: BankNodeUpdatePayload) {
  return request<null>(`/api/v1/bank-nodes/${nodeId}`, {
    body: payload,
    method: "PUT",
  });
}

export function deleteBankNode(nodeId: number) {
  return request<null>(`/api/v1/bank-nodes/${nodeId}`, {
    method: "DELETE",
  });
}

export function moveBankNode(nodeId: number, payload: BankNodeMovePayload) {
  return request<null>(`/api/v1/bank-nodes/${nodeId}/move`, {
    body: payload,
    method: "PATCH",
  });
}

export function getHotPracticeDetail(nodeId: number) {
  return request<QuestionBankDetailBundle>(
    `/api/v1/bank-nodes/${nodeId}/hot-practice-detail`,
  );
}

export function batchImportQuestions(
  nodeId: number,
  payload: BatchImportPayload,
) {
  return request<null>(`/api/v1/bank-nodes/${nodeId}/questions/batch`, {
    body: payload,
    method: "POST",
  });
}

export function isLeafNode(node: BankNode | null | undefined): node is BankNode & {
  nodeKind: "LEAF";
} {
  return node?.nodeKind === "LEAF";
}

export function isFolderNode(node: BankNode | null | undefined): node is BankNode & {
  nodeKind: "FOLDER";
} {
  return node?.nodeKind === "FOLDER";
}

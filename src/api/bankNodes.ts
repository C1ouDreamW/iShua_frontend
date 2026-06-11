import { request } from "@/api/client";
import type { PageResult } from "@/api/banks";

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

export type BankTreeScope = "public" | "mine";

export function listBankTree(params: {
  scope: BankTreeScope;
  rootId?: number;
}) {
  return request<BankNode[]>("/api/v1/bank-nodes/tree", { query: params });
}

export function pageBankRoots(params: {
  scope: BankTreeScope;
  current: number;
  pageSize: number;
}) {
  return request<PageResult<BankNode>>("/api/v1/bank-nodes/roots", {
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

import { request } from "@/api/client";
import type { PageResult } from "@/api/banks";
import type { components } from "@/types/api";

export type AdminUser = components["schemas"]["AdminUserVO"];
export type AdminUserRoleUpdatePayload =
  components["schemas"]["AdminUserRoleUpdateDTO"];
export type AdminAiImportCleanupPayload =
  components["schemas"]["AdminAiImportCleanupDTO"];
export type AdminAiImportCleanupResult =
  components["schemas"]["AdminAiImportCleanupResultVO"];

export type AdminAiImportStatusStat = {
  status?: string;
  count?: number;
  avgParseSeconds?: number;
};

export type AdminAiImportStats = {
  periodDays?: number;
  periodStart?: string;
  periodEnd?: string;
  totalTasks?: number;
  statusStats?: AdminAiImportStatusStat[];
  dailyAvgSubmitCount?: number;
  avgPipelineSeconds?: number;
  avgMineruSeconds?: number;
  avgLlmSeconds?: number;
  avgParseSeconds?: number;
  avgQuestionCount?: number;
  failureRate?: number;
};

export function pageAdminUsers(params: { current: number; pageSize: number }) {
  return request<PageResult<AdminUser>>("/api/v1/admin/users", {
    query: params,
  });
}

export function updateAdminUserRole(
  userId: number,
  payload: AdminUserRoleUpdatePayload,
) {
  return request<null>(`/api/v1/admin/users/${userId}/role`, {
    body: payload,
    method: "PUT",
  });
}

export function getAdminAiImportStats(days = 30) {
  return request<AdminAiImportStats>("/api/v1/admin/ai-import/stats", {
    query: { days },
  });
}

export function cleanupAdminAiImportTasks(
  payload: AdminAiImportCleanupPayload,
) {
  return request<AdminAiImportCleanupResult>(
    "/api/v1/admin/ai-import/tasks/cleanup",
    {
      body: payload,
      method: "POST",
    },
  );
}

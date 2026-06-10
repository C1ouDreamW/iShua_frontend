import { request } from "@/api/client";

export type AdminAiImportStatusStat = {
  status?: string;
  count?: number;
  avgParseSeconds?: number | null;
};

export type AdminAiImportStats = {
  periodDays?: number;
  periodStart?: string;
  periodEnd?: string;
  totalTasks?: number;
  statusStats?: AdminAiImportStatusStat[];
  dailyAvgSubmitCount?: number | null;
  avgParseSeconds?: number | null;
  avgQuestionCount?: number | null;
  failureRate?: number | null;
};

export type GetAiImportStatsQuery = {
  /** 统计窗口天数，默认 30，范围 1~365 */
  days?: number;
};

export function getAiImportStats(query: GetAiImportStatsQuery = {}) {
  return request<AdminAiImportStats>("/api/v1/admin/ai-import/stats", {
    query,
  });
}

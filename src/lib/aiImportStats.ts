import type { AdminAiImportStatusStat } from "@/api/adminAiImport";
import type { ImportTaskStatus } from "@/lib/aiImport";

const STATUS_LABELS: Record<ImportTaskStatus, string> = {
  SUBMITTED: "已提交",
  PROCESSING: "解析中",
  PARSED: "待确认",
  IMPORTING: "导入中",
  IMPORTED: "已导入",
  FAILED: "失败",
  EXPIRED: "已过期",
};

const STATUS_ORDER: ImportTaskStatus[] = [
  "SUBMITTED",
  "PROCESSING",
  "PARSED",
  "IMPORTING",
  "IMPORTED",
  "FAILED",
  "EXPIRED",
];

export function getImportStatusLabel(status: string | undefined) {
  if (!status) {
    return "未知";
  }

  return STATUS_LABELS[status as ImportTaskStatus] ?? status;
}

export function sortStatusStats(stats: AdminAiImportStatusStat[] | undefined) {
  if (!stats?.length) {
    return [];
  }

  const orderMap = new Map(STATUS_ORDER.map((status, index) => [status, index]));

  return [...stats].sort((left, right) => {
    const leftOrder = orderMap.get(left.status as ImportTaskStatus) ?? 99;
    const rightOrder = orderMap.get(right.status as ImportTaskStatus) ?? 99;
    return leftOrder - rightOrder;
  });
}

export function formatDurationSeconds(seconds: number | null | undefined) {
  if (seconds == null || Number.isNaN(seconds)) {
    return "—";
  }

  if (seconds < 60) {
    return `${seconds.toFixed(1)} 秒`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainSeconds = Math.round(seconds % 60);

  if (minutes < 60) {
    return remainSeconds > 0 ? `${minutes} 分 ${remainSeconds} 秒` : `${minutes} 分`;
  }

  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return remainMinutes > 0 ? `${hours} 小时 ${remainMinutes} 分` : `${hours} 小时`;
}

export function formatPercent(rate: number | null | undefined, digits = 1) {
  if (rate == null || Number.isNaN(rate)) {
    return "—";
  }

  return `${(rate * 100).toFixed(digits)}%`;
}

export function formatNumber(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) {
    return "—";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

export function formatDateTime(value: string | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

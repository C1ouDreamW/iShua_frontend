import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  cleanupAdminAiImportTasks,
  getAdminAiImportStats,
  type AdminAiImportCleanupResult,
  type AdminAiImportStats,
} from "@/api/admin";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppToast } from "@/hooks/useAppToast";
import { resolveApiErrorMessage } from "@/lib/apiErrors";

const aiImportStatusLabels: Record<string, string> = {
  SUBMITTED: "已提交",
  PROCESSING: "解析中",
  PARSED: "待确认",
  IMPORTING: "导入中",
  IMPORTED: "已导入",
  FAILED: "失败",
  EXPIRED: "已过期",
};

const aiImportStatusOrder = [
  "SUBMITTED",
  "PROCESSING",
  "PARSED",
  "IMPORTING",
  "IMPORTED",
  "FAILED",
  "EXPIRED",
];

function formatNumber(value: number | undefined, fractionDigits = 0) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return "--";
  }

  return value.toLocaleString("zh-CN", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

function formatSeconds(value: number | undefined) {
  return value === undefined || value === null || Number.isNaN(value)
    ? "--"
    : `${formatNumber(value, 1)} 秒`;
}

function formatPercent(value: number | undefined) {
  return value === undefined || value === null || Number.isNaN(value)
    ? "--"
    : `${formatNumber(value * 100, 1)}%`;
}

function StatMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border border-border bg-bg-sheet px-4 py-4 text-center">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}

function StatusCountPill({ count }: { count: number }) {
  return (
    <span className="inline-flex min-w-10 items-center justify-center rounded-full border border-brand/30 bg-brand-muted px-2.5 py-1 text-xs font-medium tabular-nums text-brand">
      {formatNumber(count)}
    </span>
  );
}

export function AdminAiImportPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [stats, setStats] = useState<AdminAiImportStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [cleanupDays, setCleanupDays] = useState("7");
  const [cleanupMaxBatch, setCleanupMaxBatch] = useState("200");
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] =
    useState<AdminAiImportCleanupResult | null>(null);
  const { error, success } = useAppToast();

  useEffect(() => {
    let ignore = false;

    async function loadStats() {
      setStatsLoading(true);
      setStatsError(null);

      try {
        const data = await getAdminAiImportStats(30);

        if (!ignore) {
          setStats(data);
          setStatsError(null);
          setStatsLoading(false);
        }
      } catch (loadError) {
        if (!ignore) {
          setStats(null);
          setStatsError(
            resolveApiErrorMessage(loadError, "AI 导入统计加载失败。"),
          );
          setStatsLoading(false);
        }
      }
    }

    void loadStats();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const statusStats = useMemo(() => {
    const statsByStatus = new Map(
      (stats?.statusStats ?? [])
        .filter((item) => item.status)
        .map((item) => [item.status as string, item]),
    );

    const orderedRows = aiImportStatusOrder.map((status) => ({
      avgParseSeconds: statsByStatus.get(status)?.avgParseSeconds,
      count: statsByStatus.get(status)?.count ?? 0,
      status,
    }));
    const extraRows = [...statsByStatus.entries()]
      .filter(([status]) => !aiImportStatusOrder.includes(status))
      .map(([status, item]) => ({
        avgParseSeconds: item.avgParseSeconds,
        count: item.count ?? 0,
        status,
      }));

    return [...orderedRows, ...extraRows];
  }, [stats]);

  function refresh() {
    setReloadKey((key) => key + 1);
  }

  async function handleCleanup(dryRun: boolean) {
    const olderThanDays = Number(cleanupDays);
    const maxBatch = Number(cleanupMaxBatch);

    if (!Number.isInteger(olderThanDays) || olderThanDays < 1) {
      error("清理天数至少为 1。");
      return;
    }

    if (!Number.isInteger(maxBatch) || maxBatch < 1) {
      error("单次处理上限至少为 1。");
      return;
    }

    setCleanupLoading(true);

    try {
      const result = await cleanupAdminAiImportTasks({
        deleteFiles: false,
        dryRun,
        maxBatch,
        olderThanDays,
      });

      setCleanupResult(result);
      success(dryRun ? "预检完成" : "清理完成");
      refresh();
    } catch (cleanupError) {
      error(resolveApiErrorMessage(cleanupError, "清理任务提交失败。"));
    } finally {
      setCleanupLoading(false);
    }
  }

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-text-primary">
            AI 导入管理
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            查看 AI 导入任务表现，并清理长时间未确认的过期任务。
          </p>
        </div>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="size-4" />
          刷新
        </Button>
      </header>

      {statsLoading ? (
        <div className="paper-panel flex flex-col gap-6 p-6">
          <div className="h-5 w-32 animate-pulse rounded bg-bg-sheet" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                className="h-20 animate-pulse border border-border bg-bg-sheet"
                key={index}
              />
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                className="h-12 animate-pulse rounded-md bg-bg-sheet"
                key={index}
              />
            ))}
          </div>
        </div>
      ) : null}

      {!statsLoading && statsError ? (
        <ErrorState message={statsError} onRetry={refresh} />
      ) : null}

      {!statsLoading && !statsError ? (
        <div className="paper-panel flex flex-col gap-6 p-6">
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              任务统计
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              近 {stats?.periodDays ?? 30} 天的提交、耗时和状态分布。
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatMetric
              label="任务总数"
              value={formatNumber(stats?.totalTasks)}
            />
            <StatMetric
              label="平均耗时"
              value={formatSeconds(
                stats?.avgPipelineSeconds ?? stats?.avgParseSeconds,
              )}
            />
            <StatMetric
              label="失败率"
              value={formatPercent(stats?.failureRate)}
            />
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-text-primary">状态分布</h3>
            <div className="overflow-hidden rounded-lg border border-border">
              <div className="hidden grid-cols-[1.2fr_0.7fr_0.9fr] border-b border-border bg-bg-sheet px-4 py-3 text-xs font-medium text-text-muted md:grid">
                <span>状态</span>
                <span>任务数</span>
                <span>平均耗时</span>
              </div>
              <div className="divide-y divide-border">
                {statusStats.map((item) => (
                  <article
                    className="grid gap-2 px-4 py-3 text-sm md:grid-cols-[1.2fr_0.7fr_0.9fr] md:items-center"
                    key={item.status}
                  >
                    <p className="font-medium text-text-primary">
                      {aiImportStatusLabels[item.status] ?? item.status}
                    </p>
                    <div className="flex items-center justify-between gap-3 md:justify-start">
                      <span className="text-xs text-text-muted md:hidden">
                        任务数
                      </span>
                      <StatusCountPill count={item.count} />
                    </div>
                    <div className="flex items-center justify-between gap-3 md:justify-end">
                      <span className="text-xs text-text-muted md:hidden">
                        平均耗时
                      </span>
                      <p className="text-text-secondary">
                        {formatSeconds(item.avgParseSeconds)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="paper-panel flex flex-col gap-6 p-6">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            过期任务清理
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            只匹配 PARSED 且超过阈值的任务。建议先预检，确认数量后再执行清理。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-text-primary">超过天数</span>
            <Input
              min={1}
              onChange={(event) => {
                setCleanupDays(event.target.value);
                setCleanupResult(null);
              }}
              type="number"
              value={cleanupDays}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-text-primary">处理上限</span>
            <Input
              min={1}
              onChange={(event) => {
                setCleanupMaxBatch(event.target.value);
                setCleanupResult(null);
              }}
              type="number"
              value={cleanupMaxBatch}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={cleanupLoading}
            onClick={() => void handleCleanup(true)}
            variant="outline"
          >
            {cleanupLoading ? "处理中" : "预检"}
          </Button>
          <Button
            disabled={cleanupLoading}
            onClick={() => void handleCleanup(false)}
            variant="destructive"
          >
            {cleanupLoading ? "处理中" : "执行清理"}
          </Button>
        </div>

        {cleanupResult ? (
          <div className="rounded-lg border border-border bg-bg-sheet px-4 py-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="font-medium text-text-primary">
                {cleanupResult.message ?? "已返回清理结果"}
              </p>
              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs text-text-muted">
                {cleanupResult.dryRun ? "预检" : "已执行"}
              </span>
            </div>
            <dl className="mt-4 grid max-w-md grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-text-muted">匹配任务</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-text-primary">
                  {formatNumber(cleanupResult.matchedCount)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">已处理</dt>
                <dd className="mt-1 text-xl font-semibold tabular-nums text-text-primary">
                  {formatNumber(cleanupResult.processedCount)}
                </dd>
              </div>
            </dl>
            {cleanupResult.sampleTaskIds?.length ? (
              <p className="mt-4 break-all text-xs leading-5 text-text-muted">
                样例：{cleanupResult.sampleTaskIds.join("、")}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-bg-sheet/60 px-4 py-5 text-sm leading-6 text-text-secondary">
            尚未执行预检。先点「预检」查看匹配数量，再决定是否执行清理。
          </div>
        )}
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import {
  getAiImportStats,
  type AdminAiImportStats,
} from "@/api/adminAiImport";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import {
  formatDateTime,
  formatDurationSeconds,
  formatNumber,
  formatPercent,
  getImportStatusLabel,
  sortStatusStats,
} from "@/lib/aiImportStats";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS = [7, 30, 90] as const;

type StatsState = {
  data: AdminAiImportStats | null;
  loading: boolean;
  error: string | null;
};

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "brand" | "error" | "warning";
}) {
  return (
    <article
      className={cn(
        "paper-panel flex flex-col gap-2 p-5",
        accent === "brand" && "paper-panel-accent",
        accent === "error" && "border-error/30 bg-error-bg/40",
        accent === "warning" && "border-warning/30 bg-[color-mix(in_srgb,var(--warning)_8%,var(--bg-surface))]",
      )}
    >
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="font-serif text-3xl font-semibold text-text-primary">{value}</p>
      {hint ? <p className="text-xs leading-5 text-text-muted">{hint}</p> : null}
    </article>
  );
}

export function AdminAiImportStatsPage() {
  const [days, setDays] = useState<(typeof PERIOD_OPTIONS)[number]>(30);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<StatsState>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let ignore = false;

    async function loadStats() {
      setState((prev) => ({ ...prev, error: null, loading: true }));

      try {
        const data = await getAiImportStats({ days });

        if (!ignore) {
          setState({
            data,
            error: null,
            loading: false,
          });
        }
      } catch (error) {
        if (!ignore) {
          setState({
            data: null,
            error: resolveApiErrorMessage(
              error,
              "导入统计加载失败，请稍后再试。",
            ),
            loading: false,
          });
        }
      }
    }

    void loadStats();

    return () => {
      ignore = true;
    };
  }, [days, reloadKey]);

  function refreshStats() {
    setReloadKey((key) => key + 1);
  }

  const stats = state.data;
  const sortedStatusStats = sortStatusStats(stats?.statusStats);
  const maxStatusCount = Math.max(
    ...sortedStatusStats.map((item) => item.count ?? 0),
    1,
  );

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-text-primary">
            AI 导入统计
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            基于近 N 天导入任务聚合数据，查看提交量、解析耗时、失败率与各状态分布，支撑导入流水线运维决策。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <Button
              aria-pressed={days === option}
              key={option}
              onClick={() => setDays(option)}
              size="sm"
              variant={days === option ? "default" : "outline"}
            >
              近 {option} 天
            </Button>
          ))}
          <Button
            aria-label="刷新统计"
            disabled={state.loading}
            onClick={refreshStats}
            size="sm"
            variant="ghost"
          >
            <RefreshCw className={cn("size-4", state.loading && "animate-spin")} />
            刷新
          </Button>
        </div>
      </header>

      {state.loading ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="paper-panel h-28 animate-pulse" key={index} />
            ))}
          </div>
          <div className="paper-panel h-72 animate-pulse" />
        </>
      ) : null}

      {!state.loading && state.error ? (
        <ErrorState message={state.error} onRetry={refreshStats} />
      ) : null}

      {!state.loading && !state.error && stats ? (
        <>
          <p className="text-sm text-text-secondary">
            统计周期：
            <span className="text-text-primary">
              {formatDateTime(stats.periodStart)} ~ {formatDateTime(stats.periodEnd)}
            </span>
            {stats.periodDays ? `（近 ${stats.periodDays} 天）` : null}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              accent="brand"
              hint="窗口内提交的任务总数"
              label="任务总数"
              value={formatNumber(stats.totalTasks, 0)}
            />
            <StatCard
              hint={`totalTasks / ${stats.periodDays ?? days} 天`}
              label="日均提交量"
              value={formatNumber(stats.dailyAvgSubmitCount)}
            />
            <StatCard
              hint="parsed_at − submitted_at 平均值"
              label="平均解析耗时"
              value={formatDurationSeconds(stats.avgParseSeconds)}
            />
            <StatCard
              hint="question_count 非空记录的平均值"
              label="平均题目数"
              value={formatNumber(stats.avgQuestionCount)}
            />
            <StatCard
              accent={
                stats.failureRate != null && stats.failureRate >= 0.1
                  ? "error"
                  : stats.failureRate != null && stats.failureRate >= 0.05
                    ? "warning"
                    : undefined
              }
              hint="FAILED / 任务总数"
              label="失败率"
              value={formatPercent(stats.failureRate)}
            />
          </div>

          <section className="paper-panel overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-serif text-xl font-semibold text-text-primary">
                任务状态分布
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                各状态任务数量及该状态下的平均解析耗时。
              </p>
            </div>

            {sortedStatusStats.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-text-secondary">
                当前统计窗口内暂无导入任务。
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedStatusStats.map((item) => {
                  const count = item.count ?? 0;
                  const widthPercent = Math.max((count / maxStatusCount) * 100, 4);

                  return (
                    <div
                      className="grid gap-3 px-5 py-4 sm:grid-cols-[9rem_minmax(0,1fr)_8rem_8rem] sm:items-center"
                      key={item.status ?? count}
                    >
                      <div>
                        <p className="font-medium text-text-primary">
                          {getImportStatusLabel(item.status)}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-text-muted">
                          {item.status}
                        </p>
                      </div>

                      <div className="hidden sm:block">
                        <div className="h-2 overflow-hidden rounded-full bg-brand-muted">
                          <div
                            className="h-full rounded-full bg-brand transition-[width] duration-200"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>

                      <p className="text-sm text-text-secondary sm:text-right">
                        <span className="font-serif text-lg font-semibold text-text-primary">
                          {formatNumber(count, 0)}
                        </span>
                        <span className="ml-1">个</span>
                      </p>

                      <p className="text-sm text-text-secondary sm:text-right">
                        均耗 {formatDurationSeconds(item.avgParseSeconds)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}

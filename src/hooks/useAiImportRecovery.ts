import { useCallback, useEffect, useMemo, useState } from "react";

import {
  pageMyImportTasks,
  RECOVERABLE_IMPORT_STATUSES,
  type AiImportTaskSummary,
} from "@/api/aiImport";
import { getImportSessionTaskId, resolveImportError } from "@/lib/aiImport";

type UseAiImportRecoveryOptions = {
  bankId: number;
  enabled?: boolean;
};

export function useAiImportRecovery({
  bankId,
  enabled = true,
}: UseAiImportRecoveryOptions) {
  const [tasks, setTasks] = useState<AiImportTaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const refreshTasks = useCallback(
    async (options?: { includePreview?: boolean }) => {
      if (!Number.isFinite(bankId)) {
        setTasks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setListError(null);

      try {
        const page = await pageMyImportTasks({
          bankId,
          current: 1,
          pageSize: 10,
          status: RECOVERABLE_IMPORT_STATUSES,
          includePreview: options?.includePreview ?? false,
        });

        setTasks(page?.records ?? []);
      } catch (error) {
        setListError(resolveImportError(error));
        setTasks([]);

        const fallbackTaskId = getImportSessionTaskId(bankId);
        if (fallbackTaskId) {
          setListError(
            `${resolveImportError(error)} 可尝试刷新页面；若刚提交过文件，解析可能仍在进行。`,
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [bankId],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void refreshTasks();
  }, [enabled, refreshTasks]);

  const parsedTasks = useMemo(
    () => tasks.filter((task) => task.status === "PARSED"),
    [tasks],
  );

  const inProgressTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "SUBMITTED" || task.status === "PROCESSING",
      ),
    [tasks],
  );

  const findTaskById = useCallback(
    (taskId: string) => tasks.find((task) => task.taskId === taskId) ?? null,
    [tasks],
  );

  return {
    tasks,
    parsedTasks,
    inProgressTasks,
    loading,
    listError,
    refreshTasks,
    findTaskById,
  };
}

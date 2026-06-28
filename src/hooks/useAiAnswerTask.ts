import { useCallback, useEffect, useRef, useState } from "react";

import {
  createAiAnswerTask,
  getAiAnswerTaskStatus,
  type AiAnswerTaskStatus,
} from "@/api/aiImport";
import { ApiError } from "@/api/client";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import {
  isAnswerFailedStatus,
  isAnswerInProgressStatus,
  isAnswerReadyStatus,
  isAnswerTerminalStatus,
  mergeAiAnswerResults,
  type EditablePreviewQuestion,
} from "@/lib/aiImport";

const POLL_INTERVAL_MS = 3000;

export type AiAnswerPhase = "idle" | "creating" | "polling" | "ready" | "failed";

export type UseAiAnswerTaskResult = {
  phase: AiAnswerPhase;
  answerTaskId: string | null;
  status: AiAnswerTaskStatus | null;
  error: string | null;
  create: (taskId: string) => Promise<void>;
  reset: () => void;
};

export function useAiAnswerTask(
  previewQuestions: EditablePreviewQuestion[],
  onMerged: (merged: EditablePreviewQuestion[]) => void,
): UseAiAnswerTaskResult {
  const [phase, setPhase] = useState<AiAnswerPhase>("idle");
  const [answerTaskId, setAnswerTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<AiAnswerTaskStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parentTaskIdRef = useRef<string | null>(null);
  const mergedRef = useRef(false);

  const reset = useCallback(() => {
    setPhase("idle");
    setAnswerTaskId(null);
    setStatus(null);
    setError(null);
    parentTaskIdRef.current = null;
    mergedRef.current = false;
  }, []);

  const create = useCallback(
    async (taskId: string) => {
      setPhase("creating");
      setError(null);
      setStatus(null);
      mergedRef.current = false;
      parentTaskIdRef.current = taskId;

      try {
        const result = await createAiAnswerTask(taskId, { filter: "MISSING" });

        if (!result?.answerTaskId) {
          throw new Error("未返回解答任务 ID。");
        }

        setAnswerTaskId(result.answerTaskId);
        setPhase("polling");
      } catch (createError) {
        setError(resolveAiAnswerError(createError));
        setPhase("failed");
      }
    },
    [],
  );

  const applyReadyStatus = useCallback(
    (snapshot: AiAnswerTaskStatus) => {
      setStatus(snapshot);
      mergedRef.current = true;
      onMerged(
        mergeAiAnswerResults(previewQuestions, snapshot.questions ?? []),
      );
      setPhase("ready");
    },
    [onMerged, previewQuestions],
  );

  useEffect(() => {
    if (phase !== "polling" || !answerTaskId || !parentTaskIdRef.current) {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;
    const parentTaskId = parentTaskIdRef.current;

    async function poll() {
      try {
        const snapshot = await getAiAnswerTaskStatus(
          parentTaskId!,
          answerTaskId!,
        );

        if (cancelled) {
          return;
        }

        if (!snapshot) {
          setError("解答任务不存在或已失效。");
          setPhase("failed");
          return;
        }

        setStatus(snapshot);

        if (isAnswerTerminalStatus(snapshot.status)) {
          if (isAnswerFailedStatus(snapshot.status)) {
            setError(snapshot.message || "AI 解答失败，请稍后重试。");
            setPhase("failed");
          } else {
            setPhase("ready");
          }
          return;
        }

        if (isAnswerReadyStatus(snapshot.status)) {
          applyReadyStatus(snapshot);
          return;
        }

        if (isAnswerInProgressStatus(snapshot.status)) {
          timer = window.setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }

        timer = window.setTimeout(poll, POLL_INTERVAL_MS);
      } catch (pollError) {
        if (!cancelled) {
          setError(resolveAiAnswerError(pollError));
          setPhase("failed");
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [answerTaskId, applyReadyStatus, phase]);

  return {
    phase,
    answerTaskId,
    status,
    error,
    create,
    reset,
  };
}

function resolveAiAnswerError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 400) {
      return error.message || "无可解答的题目，请检查预览中的缺答案客观题。";
    }
    if (error.code === 403) {
      return "无权触发 AI 解答。";
    }
    if (error.code === 404) {
      return "导入任务不存在，请重新上传。";
    }
  }
  return resolveApiErrorMessage(error, "AI 解答失败，请重试。");
}

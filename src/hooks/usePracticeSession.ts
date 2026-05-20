import { useCallback, useEffect, useMemo, useState } from "react";

import { getHotPracticeDetail } from "@/api/banks";
import { ApiError } from "@/api/client";
import {
  listPracticeQuestions,
  submitAnswer,
  type PracticeQuestion,
} from "@/api/practice";
import { isObjectiveQuestionType } from "@/lib/practiceQuestion";

export type PracticeAnswerRecord = {
  answer: string[];
  submitted: boolean;
  correct: boolean | null;
  needsManualGrading?: boolean;
  answerJson?: string | null;
  analysis?: string | null;
  submitting?: boolean;
};

export type PracticeSessionStatus = "loading" | "ready" | "complete" | "error";

function createEmptyRecords(questions: PracticeQuestion[]) {
  return questions.map<PracticeAnswerRecord>(() => ({
    answer: [],
    correct: null,
    submitted: false,
  }));
}

function resolveLoadError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 403) {
      return "无权访问该题库，请返回大厅。";
    }

    if (error.code === 404) {
      return "题库不存在或暂无题目。";
    }
  }

  return error instanceof Error ? error.message : "刷题数据加载失败。";
}

export function usePracticeSession(bankId: number) {
  const [status, setStatus] = useState<PracticeSessionStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [bankTitle, setBankTitle] = useState("题库练习");
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<PracticeAnswerRecord[]>([]);
  const [showWrongToast, setShowWrongToast] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!Number.isFinite(bankId)) {
      setStatus("error");
      setError("题库 ID 不正确。");
      setQuestions([]);
      setRecords([]);
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const [questionList, detail] = await Promise.all([
        listPracticeQuestions(bankId),
        getHotPracticeDetail(bankId).catch(() => null),
      ]);

      const items = questionList ?? [];

      setQuestions(items);
      setRecords(createEmptyRecords(items));
      setCurrentIndex(0);
      setBankTitle(detail?.bank?.title ?? "题库练习");
      setStatus("ready");
      setSubmitError(null);
    } catch (loadError) {
      setQuestions([]);
      setRecords([]);
      setStatus("error");
      setError(resolveLoadError(loadError));
    }
  }, [bankId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stats = useMemo(() => {
    const correctCount = records.filter((item) => item.correct === true).length;
    const wrongCount = records.filter((item) => item.correct === false).length;
    const unansweredCount = records.filter((item) => !item.submitted).length;

    return { correctCount, unansweredCount, wrongCount };
  }, [records]);

  const updateAnswer = useCallback(
    (value: string) => {
      const question = questions[currentIndex];
      const record = records[currentIndex];

      if (!question || !record || record.submitted) {
        return;
      }

      setRecords((items) =>
        items.map((item, index) => {
          if (index !== currentIndex) {
            return item;
          }

          if (question.questionType === "MULTI") {
            const hasValue = item.answer.includes(value);
            return {
              ...item,
              answer: hasValue
                ? item.answer.filter((answer) => answer !== value)
                : [...item.answer, value],
            };
          }

          return { ...item, answer: [value] };
        }),
      );
    },
    [currentIndex, questions, records],
  );

  const submitCurrent = useCallback(async () => {
    const question = questions[currentIndex];
    const record = records[currentIndex];

    if (!question?.id || !record || record.answer.length === 0 || record.submitted) {
      return;
    }

    if (!isObjectiveQuestionType(question.questionType)) {
      return;
    }

    setSubmitError(null);
    setRecords((items) =>
      items.map((item, index) =>
        index === currentIndex ? { ...item, submitting: true } : item,
      ),
    );

    try {
      const result = await submitAnswer(bankId, question.id, record.answer);

      setRecords((items) =>
        items.map((item, index) =>
          index === currentIndex
            ? {
                ...item,
                analysis: result.analysis ?? null,
                answerJson: result.answerJson ?? null,
                correct: result.correct ?? false,
                needsManualGrading: result.needsManualGrading,
                submitted: true,
                submitting: false,
              }
            : item,
        ),
      );

      if (result.correct === false && !result.needsManualGrading) {
        setShowWrongToast(true);
      }
    } catch (error) {
      setRecords((items) =>
        items.map((item, index) =>
          index === currentIndex ? { ...item, submitting: false } : item,
        ),
      );

      setSubmitError(
        error instanceof Error ? error.message : "提交失败，请重试。",
      );
    }
  }, [bankId, currentIndex, questions, records]);

  const restart = useCallback(() => {
    setRecords(createEmptyRecords(questions));
    setCurrentIndex(0);
    setStatus("ready");
    setShowWrongToast(false);
    setError(null);
    setSubmitError(null);
  }, [questions]);

  const complete = useCallback(() => {
    setStatus("complete");
    setShowWrongToast(false);
  }, []);

  const dismissWrongToast = useCallback(() => {
    setShowWrongToast(false);
  }, []);

  return {
    bankTitle,
    complete,
    currentIndex,
    dismissWrongToast,
    error,
    questions,
    records,
    reload,
    restart,
    setCurrentIndex,
    showWrongToast,
    stats,
    status,
    submitCurrent,
    submitError,
    updateAnswer,
  };
}

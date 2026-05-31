import { useCallback, useEffect, useMemo, useState } from "react";

import {
  revealReferenceAnswer,
  submitAnswer,
  type PracticeQuestion,
} from "@/api/practice";
import { listWrongPractice } from "@/api/wrong";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { isObjectiveQuestionType } from "@/lib/practiceQuestion";
import type { PracticeAnswerRecord } from "@/hooks/usePracticeSession";

export type WrongPracticeSessionStatus =
  | "loading"
  | "ready"
  | "complete"
  | "error";

function createEmptyRecords(questions: PracticeQuestion[]) {
  return questions.map<PracticeAnswerRecord>(() => ({
    answer: [],
    correct: null,
    submitted: false,
  }));
}

export function useWrongPracticeSession(filterBankId?: number) {
  const [status, setStatus] = useState<WrongPracticeSessionStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [records, setRecords] = useState<PracticeAnswerRecord[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const questionList = await listWrongPractice(filterBankId);
      const items = questionList ?? [];

      setQuestions(items);
      setRecords(createEmptyRecords(items));
      setCurrentIndex(0);
      setStatus("ready");
      setSubmitError(null);
    } catch (loadError) {
      setQuestions([]);
      setRecords([]);
      setStatus("error");
      setError(resolveApiErrorMessage(loadError, "错题重刷数据加载失败。"));
    }
  }, [filterBankId]);

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

          if (question.questionType === "SHORT_ANSWER") {
            return { ...item, answer: value.trim() ? [value] : [] };
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
    const bankId = question?.questionBankId;

    if (
      !question?.id ||
      !bankId ||
      !record ||
      record.answer.length === 0 ||
      record.submitted
    ) {
      return;
    }

    setSubmitError(null);
    setRecords((items) =>
      items.map((item, index) =>
        index === currentIndex ? { ...item, submitting: true } : item,
      ),
    );

    try {
      if (!isObjectiveQuestionType(question.questionType)) {
        const result = await revealReferenceAnswer(bankId, question.id);

        setRecords((items) =>
          items.map((item, index) =>
            index === currentIndex
              ? {
                  ...item,
                  analysis: result.analysis ?? null,
                  answerJson: result.answerJson ?? null,
                  correct: null,
                  needsManualGrading: true,
                  submitted: true,
                  submitting: false,
                }
              : item,
          ),
        );
        return;
      }

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
    } catch (error) {
      setRecords((items) =>
        items.map((item, index) =>
          index === currentIndex ? { ...item, submitting: false } : item,
        ),
      );

      setSubmitError(resolveApiErrorMessage(error, "提交失败，请重试。"));
    }
  }, [currentIndex, questions, records]);

  const restart = useCallback(() => {
    void reload();
  }, [reload]);

  const complete = useCallback(() => {
    setStatus("complete");
  }, []);

  return {
    complete,
    currentIndex,
    error,
    questions,
    records,
    reload,
    restart,
    setCurrentIndex,
    stats,
    status,
    submitCurrent,
    submitError,
    updateAnswer,
  };
}

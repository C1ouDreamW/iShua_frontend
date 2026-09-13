import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import { getHotPracticeDetail } from "@/api/bankNodes";
import type { QuestionBank } from "@/api/banks";
import type { Question } from "@/api/questions";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PracticeSessionSkeleton } from "@/components/PracticeSessionSkeleton";
import { ContentCrossfade } from "@/components/motion/ContentCrossfade";
import { PracticePlayerCore } from "@/components/PracticePlayerCore";
import { PracticeComplete } from "@/components/PracticeComplete";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import {
  buildLoginRedirect,
  buildPracticePath,
  buildRecitePath,
} from "@/lib/navigation";
import { gradeAnswer } from "@/lib/gradeAnswer";
import {
  clearPracticeProgress,
  clearRecentPractice,
  findFirstUnansweredIndex,
  readPracticeProgress,
  rememberRecentPractice,
  savePracticeProgress,
} from "@/lib/practiceProgress";
import {
  isObjectiveQuestionType,
  parseAnswerPoints,
} from "@/lib/practiceQuestion";

type AnswerRecord = {
  answer: string[];
  submitted: boolean;
  correct: boolean | null;
};

type GuestPracticeState = {
  bank: QuestionBank | null;
  questions: Question[];
  loading: boolean;
  error: string | null;
};

function createEmptyRecords(questions: Question[]) {
  return questions.map<AnswerRecord>(() => ({
    answer: [],
    correct: null,
    submitted: false,
  }));
}

export function GuestPracticePage() {
  const { bankId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const numericBankId = Number(bankId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [state, setState] = useState<GuestPracticeState>({
    bank: null,
    error: null,
    loading: true,
    questions: [],
  });
  const [autoNext, setAutoNext] = useState(false);
  const autoNextRef = useRef(autoNext);
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoNextTimer = useCallback(() => {
    if (autoNextTimerRef.current != null) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    autoNextRef.current = autoNext;
    if (!autoNext) {
      clearAutoNextTimer();
    }

    return clearAutoNextTimer;
  }, [autoNext, clearAutoNextTimer, currentIndex]);

  useEffect(() => {
    if (isAuthenticated) {
      return;
    }

    let ignore = false;

    async function loadDetail() {
      if (!Number.isFinite(numericBankId)) {
        setState({
          bank: null,
          error: "题库 ID 不正确。",
          loading: false,
          questions: [],
        });
        return;
      }

      setState((prev) => ({ ...prev, error: null, loading: true }));

      try {
        const detail = await getHotPracticeDetail(numericBankId);
        const questions = detail.questions ?? [];
        const progress = readPracticeProgress(
          "practice",
          numericBankId,
          questions,
        );

        if (!ignore) {
          setState({
            bank: detail.bank ?? null,
            error: null,
            loading: false,
            questions,
          });
          setAnswers(progress?.records ?? createEmptyRecords(questions));
          setCurrentIndex(progress?.currentIndex ?? 0);
          setAutoNext(progress?.autoNext ?? false);
          setCompleted(false);
        }
      } catch (error) {
        if (!ignore) {
          setState({
            bank: null,
            error: resolveApiErrorMessage(
              error,
              "访客刷题数据加载失败。",
            ),
            loading: false,
            questions: [],
          });
        }
      }
    }

    void loadDetail();

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, numericBankId]);

  useEffect(() => {
    if (completed) {
      clearPracticeProgress("practice", numericBankId);
      clearRecentPractice(numericBankId);
      return;
    }

    if (
      !isAuthenticated &&
      !state.loading &&
      !state.error &&
      state.questions.length > 0
    ) {
      savePracticeProgress("practice", numericBankId, state.questions, {
        autoNext,
        currentIndex,
        records: answers,
      });
      rememberRecentPractice({
        authenticated: false,
        bankId: numericBankId,
        mode: "practice",
        title: state.bank?.title ?? "访客刷题",
      });
    }
  }, [
    answers,
    autoNext,
    currentIndex,
    completed,
    isAuthenticated,
    numericBankId,
    state.bank?.title,
    state.error,
    state.loading,
    state.questions,
  ]);

  const question = state.questions[currentIndex];
  const record = answers[currentIndex];
  const isManualGrading = question
    ? !isObjectiveQuestionType(question.questionType)
    : false;
  const shortAnswerValue = record?.answer[0] ?? "";
  const answerPoints = useMemo(
    () => (question ? parseAnswerPoints(question.answerJson) : []),
    [question],
  );
  const stats = useMemo(() => {
    const correctCount = answers.filter((item) => item.correct === true).length;
    const wrongCount = answers.filter((item) => item.correct === false).length;
    const unansweredCount = answers.filter((item) => !item.submitted).length;

    return { correctCount, unansweredCount, wrongCount };
  }, [answers]);

  const updateCurrentAnswer = useCallback(
    (value: string) => {
      if (!question || record?.submitted) {
        return;
      }

      setAnswers((items) =>
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
    [currentIndex, question, record?.submitted],
  );

  const updateShortAnswer = useCallback(
    (text: string) => {
      if (!question || record?.submitted) {
        return;
      }

      setAnswers((items) =>
        items.map((item, index) =>
          index === currentIndex ? { ...item, answer: [text] } : item,
        ),
      );
    },
    [currentIndex, question, record?.submitted],
  );

  const submitCurrentAnswer = useCallback(() => {
    if (!question || !record) {
      return;
    }

    if (isManualGrading) {
      setAnswers((items) =>
        items.map((item, index) =>
          index === currentIndex ? { ...item, submitted: true } : item,
        ),
      );
      return;
    }

    if (record.answer.length === 0) {
      return;
    }

    const correct = gradeAnswer({
      answerJson: question.answerJson,
      questionType: question.questionType ?? "",
      userAnswer: record.answer,
    });

    setAnswers((items) =>
      items.map((item, index) =>
        index === currentIndex ? { ...item, correct, submitted: true } : item,
      ),
    );

    if (correct && autoNextRef.current) {
      clearAutoNextTimer();
      if (currentIndex >= state.questions.length - 1) {
        autoNextTimerRef.current = setTimeout(() => setCompleted(true), 600);
      } else {
        autoNextTimerRef.current = setTimeout(
          () => setCurrentIndex((index) => index + 1),
          600,
        );
      }
    }
  }, [
    clearAutoNextTimer,
    currentIndex,
    isManualGrading,
    question,
    record,
    state.questions.length,
  ]);

  const restart = useCallback(() => {
    clearAutoNextTimer();
    clearPracticeProgress("practice", numericBankId);
    setAnswers(createEmptyRecords(state.questions));
    setCurrentIndex(0);
    setCompleted(false);
  }, [clearAutoNextTimer, numericBankId, state.questions]);

  const complete = useCallback(() => {
    clearAutoNextTimer();
    clearPracticeProgress("practice", numericBankId);
    setCompleted(true);
  }, [clearAutoNextTimer, numericBankId]);

  const continueUnanswered = useCallback(() => {
    const nextIndex = findFirstUnansweredIndex(answers);
    if (nextIndex < 0) {
      return;
    }

    setCurrentIndex(nextIndex);
    setCompleted(false);
  }, [answers]);

  if (isAuthenticated && Number.isFinite(numericBankId)) {
    return <Navigate replace to={buildPracticePath(numericBankId, true)} />;
  }

  if (completed) {
    return (
      <PracticeComplete
        correctCount={stats.correctCount}
        onContinueUnanswered={continueUnanswered}
        onPrimary={() => navigate("/")}
        onRetry={restart}
        title="访客刷题完成"
        unansweredCount={stats.unansweredCount}
        wrongCount={stats.wrongCount}
      />
    );
  }

  const isInitialLoading = state.loading && !state.bank;
  const viewKey = isInitialLoading
    ? "loading"
    : state.error
      ? "error"
      : !question || state.questions.length === 0
        ? "empty"
        : `content-${numericBankId}`;
  const isAnswerEmpty = isManualGrading
    ? shortAnswerValue.trim().length === 0
    : record?.answer.length === 0;

  return (
    <ContentCrossfade className="min-h-screen" stateKey={viewKey}>
      {isInitialLoading ? (
        <PracticeSessionSkeleton />
      ) : state.error ? (
        <main className="min-h-screen px-6 py-12">
          <div className="mx-auto max-w-3xl">
            <ErrorState backHref="/" message={state.error} />
          </div>
        </main>
      ) : !question || state.questions.length === 0 ? (
        <main className="min-h-screen px-6 py-12">
          <div className="mx-auto max-w-3xl space-y-4">
            <EmptyState
              description="这个公开题库暂时没有可练习的题目。"
              title="暂无题目"
            />
            <div className="flex justify-center">
              <Button asChild variant="outline">
                <Link to="/">返回</Link>
              </Button>
            </div>
          </div>
        </main>
      ) : (
        <PracticePlayerCore
          autoNext={autoNext}
          currentIndex={currentIndex}
          enableKeyboardNav
          exitTo="/"
          headerExtra={
            <div className="flex shrink-0 items-center gap-3 whitespace-nowrap">
              <Link
                className="text-xs text-brand underline-offset-4 hover:underline"
                to={buildRecitePath(numericBankId, false)}
              >
                <span className="sm:hidden">背题</span>
                <span className="hidden sm:inline">切换背题模式</span>
              </Link>
              <Link
                className="text-xs text-text-muted underline-offset-4 hover:underline"
                to={buildLoginRedirect(buildPracticePath(numericBankId, true))}
              >
                <span className="sm:hidden">登录后记录</span>
                <span className="hidden sm:inline">登录后记录错题</span>
              </Link>
            </div>
          }
          isAnswerEmpty={isAnswerEmpty}
          manualAnswerPoints={answerPoints}
          manualTypeLabel="简答"
          onAnswerChange={
            isManualGrading ? updateShortAnswer : updateCurrentAnswer
          }
          onComplete={complete}
          onIndexChange={(index) => setCurrentIndex(index)}
          onRestart={restart}
          onSubmit={submitCurrentAnswer}
          onToggleAutoNext={() => setAutoNext((prev) => !prev)}
          questions={state.questions}
          record={record}
          title={state.bank?.title ?? "访客刷题"}
        />
      )}
    </ContentCrossfade>
  );
}

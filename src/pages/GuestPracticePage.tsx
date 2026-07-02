import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getHotPracticeDetail } from "@/api/bankNodes";
import type { QuestionBank } from "@/api/banks";
import type { Question } from "@/api/questions";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PageTransition } from "@/components/motion/PageTransition";
import { QuestionTransition } from "@/components/motion/QuestionTransition";
import { Reveal } from "@/components/motion/Reveal";
import { PracticeComplete } from "@/components/PracticeComplete";
import { Button } from "@/components/ui/button";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { buildLoginRedirect, buildRecitePath } from "@/lib/navigation";
import { gradeAnswer } from "@/lib/gradeAnswer";
import { parseOptionsJson } from "@/lib/parseOptionsJson";
import {
  isObjectiveQuestionType,
  parseAnswerPoints,
} from "@/lib/practiceQuestion";
import {
  paperSheetClasses,
  practiceAnalysisClasses,
  practiceFooterClasses,
  practiceFooterInnerClasses,
  practiceOptionClasses,
  practiceOptionMarkerClasses,
  practiceTypeBadgeClasses,
} from "@/lib/practiceUi";
import { cn } from "@/lib/utils";

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

const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function getQuestionOptions(question: Question) {
  const parsed = parseOptionsJson(question.optionsJson);

  if (question.questionType === "JUDGE" && parsed.length === 0) {
    return [
      { label: "正确", value: "T" },
      { label: "错误", value: "F" },
    ];
  }

  if (question.questionType === "JUDGE") {
    return parsed.map((label, index) => ({
      label,
      value: index === 0 ? "T" : "F",
    }));
  }

  return parsed.map((label, index) => ({
    label,
    value: OPTION_LETTERS[index] ?? String(index + 1),
  }));
}

function formatAnswer(answerJson: string | null | undefined) {
  try {
    const parsed = JSON.parse(answerJson ?? "[]");
    return Array.isArray(parsed) ? parsed.join("、") : "暂无";
  } catch {
    return "暂无";
  }
}

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
  autoNextRef.current = autoNext;

  useEffect(() => {
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

        if (!ignore) {
          setState({
            bank: detail.bank ?? null,
            error: null,
            loading: false,
            questions,
          });
          setAnswers(createEmptyRecords(questions));
          setCurrentIndex(0);
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
  }, [numericBankId]);

  const question = state.questions[currentIndex];
  const record = answers[currentIndex];
  const options = useMemo(
    () => (question ? getQuestionOptions(question) : []),
    [question],
  );
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

  function updateCurrentAnswer(value: string) {
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
  }

  function updateShortAnswer(text: string) {
    if (!question || record?.submitted) {
      return;
    }

    setAnswers((items) =>
      items.map((item, index) =>
        index === currentIndex ? { ...item, answer: [text] } : item,
      ),
    );
  }

  function submitCurrentAnswer() {
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
      if (currentIndex >= state.questions.length - 1) {
        setTimeout(() => setCompleted(true), 600);
      } else {
        setTimeout(() => setCurrentIndex((index) => index + 1), 600);
      }
    }
  }

  function restart() {
    setAnswers(createEmptyRecords(state.questions));
    setCurrentIndex(0);
    setCompleted(false);
  }

  if (completed) {
    return (
      <PracticeComplete
        correctCount={stats.correctCount}
        onPrimary={() => navigate("/")}
        onRetry={restart}
        title="访客刷题完成"
        unansweredCount={stats.unansweredCount}
        wrongCount={stats.wrongCount}
      />
    );
  }

  if (state.loading) {
    return (
      <main className="min-h-screen px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <div className="h-16 animate-pulse rounded-md border border-border bg-bg-surface" />
          <div className="h-[520px] animate-pulse rounded-lg border border-border bg-bg-sheet" />
        </div>
      </main>
    );
  }

  if (state.error) {
    return (
      <main className="min-h-screen px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <ErrorState backHref="/" message={state.error} />
        </div>
      </main>
    );
  }

  if (!question || state.questions.length === 0) {
    return (
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
    );
  }

  const isMultiple = question.questionType === "MULTI";

  return (
    <PageTransition>
    <main className="min-h-screen pb-practice-footer">
      <header className="sticky top-0 z-10 border-b border-border bg-bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <Button asChild size="sm" variant="ghost">
              <Link to="/">← 退出</Link>
            </Button>
            <h1 className="mt-2 truncate font-serif text-xl font-semibold text-text-primary">
              {state.bank?.title ?? "访客刷题"}
            </h1>
          </div>
          <div className="shrink-0 text-right">
            <p
              aria-live="polite"
              className="font-medium tabular-nums text-text-primary"
            >
              {currentIndex + 1} / {state.questions.length}
            </p>
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs text-text-muted">自动下一题</span>
                <button
                  aria-checked={autoNext}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    autoNext ? "bg-brand" : "bg-border",
                  )}
                  onClick={() => setAutoNext((prev) => !prev)}
                  role="switch"
                  type="button"
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform",
                      autoNext ? "left-[17px]" : "left-0.5",
                    )}
                  />
                </button>
              </div>
              <Link
                className="text-xs text-brand underline-offset-4 hover:underline"
                to={buildRecitePath(numericBankId, false)}
              >
                切换背题模式
              </Link>
              <Link
                className="text-xs text-text-muted underline-offset-4 hover:underline"
                to={buildLoginRedirect(`/practice/guest/${numericBankId}`)}
              >
                登录以同步错题
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        <QuestionTransition
          className={paperSheetClasses()}
          currentIndex={currentIndex}
          questionKey={question.id ?? currentIndex}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className={practiceTypeBadgeClasses()}>
              {isManualGrading
                ? "简答"
                : question.questionType === "MULTI"
                  ? "多选"
                  : question.questionType === "JUDGE"
                    ? "判断"
                    : "单选"}
            </span>
            <span className="text-sm text-text-muted">
              {record?.submitted
                ? isManualGrading
                  ? "已显示参考答案"
                  : "已提交"
                : isManualGrading
                  ? "输入答案后查看参考答案"
                  : "选择后提交查看解析"}
            </span>
          </div>

          <h2 className="mt-6 whitespace-pre-wrap text-[17px] leading-8 text-text-primary">
            {question.stem}
          </h2>

          {isManualGrading ? (
            <div className="mt-8 flex flex-col gap-3">
              <label
                className="text-sm font-medium text-text-secondary"
                htmlFor={`guest-sa-${question.id ?? currentIndex}`}
              >
                我的答案
              </label>
              <textarea
                className="min-h-36 rounded-md border border-border bg-bg-canvas px-4 py-3 text-sm leading-7 text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={record?.submitted}
                id={`guest-sa-${question.id ?? currentIndex}`}
                onChange={(event) => updateShortAnswer(event.target.value)}
                placeholder="在这里写下你的答案要点，再查看参考答案。"
                value={shortAnswerValue}
              />
            </div>
          ) : (
            <div
              aria-label="答案选项"
              className="mt-8 flex flex-col gap-3"
              role={isMultiple ? "group" : "radiogroup"}
            >
              {options.map((option) => {
                const selected = record?.answer.includes(option.value) ?? false;

                return (
                  <button
                    aria-checked={selected}
                    className={practiceOptionClasses(selected)}
                    disabled={record?.submitted}
                    key={option.value}
                    onClick={() => updateCurrentAnswer(option.value)}
                    role={isMultiple ? "checkbox" : "radio"}
                    type="button"
                  >
                    <span className={practiceOptionMarkerClasses(selected)}>
                      {option.value}
                    </span>
                    <span className="leading-7 text-text-primary">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {record?.submitted ? (
            <Reveal as="section" className={practiceAnalysisClasses()}>
              <p
                className={cn(
                  "font-medium",
                  isManualGrading
                    ? "text-text-primary"
                    : record.correct
                      ? "text-success"
                      : "text-error",
                )}
              >
                {isManualGrading
                  ? "已显示参考答案"
                  : record.correct
                    ? "✓ 回答正确"
                    : "✗ 回答错误"}
              </p>
              {isManualGrading ? (
                answerPoints.length > 0 ? (
                  <ul className="mt-2 space-y-1.5 text-sm leading-7 text-text-secondary">
                    {answerPoints.map((point, idx) => (
                      <li className="whitespace-pre-wrap" key={idx}>
                        {point}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-text-muted">暂无参考答案。</p>
                )
              ) : (
                <p className="mt-2 text-sm text-text-secondary">
                  正确答案：{formatAnswer(question.answerJson)}
                </p>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-text-secondary">
                解析：{question.analysis || "暂无解析。"}
              </p>
            </Reveal>
          ) : null}
        </QuestionTransition>
      </section>

      <footer className={practiceFooterClasses()}>
        <div className={practiceFooterInnerClasses()}>
          <Button
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((index) => index - 1)}
            variant="outline"
          >
            上一题
          </Button>
          <Button
            disabled={
              !record ||
              record.submitted ||
              (isManualGrading
                ? shortAnswerValue.trim().length === 0
                : record.answer.length === 0)
            }
            onClick={submitCurrentAnswer}
          >
            {isManualGrading ? "显示答案" : "提交"}
          </Button>
          <Button
            onClick={() => {
              if (currentIndex >= state.questions.length - 1) {
                setCompleted(true);
                return;
              }

              setCurrentIndex((index) => index + 1);
            }}
            variant="outline"
          >
            {currentIndex >= state.questions.length - 1 ? "完成" : "下一题"}
          </Button>
        </div>
      </footer>
    </main>
    </PageTransition>
  );
}

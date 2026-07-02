import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

import type { Question } from "@/api/questions";
import { QuestionTransition } from "@/components/motion/QuestionTransition";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { ReciteMark } from "@/hooks/useReciteSession";
import { buildPracticePath } from "@/lib/navigation";
import {
  formatAnswerJson,
  getCorrectAnswerValues,
  getQuestionOptions,
  isObjectiveQuestionType,
  parseAnswerPoints,
} from "@/lib/practiceQuestion";
import {
  paperSheetClasses,
  practiceAnalysisClasses,
  practiceFooterClasses,
  practiceFooterInnerClasses,
  practiceTypeBadgeClasses,
  reciteOptionClasses,
  reciteOptionMarkerClasses,
  reciteProgressBarClasses,
  reciteProgressFillClasses,
} from "@/lib/practiceUi";
import { cn } from "@/lib/utils";

type RecitePlayerProps = {
  bankId: number;
  bankTitle: string;
  questions: Question[];
  currentIndex: number;
  onMark: (mark: ReciteMark) => void;
  onPrev: () => void;
};

export function RecitePlayer({
  bankId,
  bankTitle,
  questions,
  currentIndex,
  onMark,
  onPrev,
}: RecitePlayerProps) {
  const { isAuthenticated } = useAuth();
  const question = questions[currentIndex];

  const options = useMemo(
    () => (question ? getQuestionOptions(question) : []),
    [question],
  );

  const correctValues = useMemo(
    () =>
      question ? new Set(getCorrectAnswerValues(question.answerJson)) : new Set<string>(),
    [question],
  );

  const answerPoints = useMemo(
    () => (question ? parseAnswerPoints(question.answerJson) : []),
    [question],
  );

  const isManualGrading = question
    ? !isObjectiveQuestionType(question.questionType)
    : false;
  const isMultiple = question?.questionType === "MULTI";
  const total = questions.length;
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onPrev();
        return;
      }

      if (event.key === "1") {
        event.preventDefault();
        onMark("review");
        return;
      }

      if (event.key === "2" || event.key === "Enter") {
        event.preventDefault();
        onMark("known");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onMark, onPrev]);

  if (!question) {
    return null;
  }

  const hasAnalysis = Boolean(question.analysis && question.analysis.trim().length > 0);

  return (
    <main className="min-h-screen pb-practice-footer">
      <header className="sticky top-0 z-10 border-b border-border bg-bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <Button asChild size="sm" variant="ghost">
              <Link to={isAuthenticated ? "/app/banks" : "/"}>← 退出</Link>
            </Button>
            <h1 className="mt-2 truncate font-serif text-xl font-semibold text-text-primary">
              {bankTitle}
            </h1>
          </div>
          <div className="shrink-0 text-right">
            <p
              aria-live="polite"
              className="font-medium tabular-nums text-text-primary"
            >
              <span className="text-text-muted">第 </span>
              {currentIndex + 1}
              <span className="text-text-muted"> / {total} 题</span>
            </p>
            <Link
              className="text-xs text-brand underline-offset-4 hover:underline"
              to={buildPracticePath(bankId, isAuthenticated)}
            >
              切换练习模式
            </Link>
          </div>
        </div>
        <div className={reciteProgressBarClasses()}>
          <div
            className={reciteProgressFillClasses()}
            style={{ width: `${progress}%` }}
          />
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
                ? "主观题"
                : question.questionType === "MULTI"
                  ? "多选"
                  : question.questionType === "JUDGE"
                    ? "判断"
                    : "单选"}
            </span>
            <span className="text-sm text-text-muted">背题模式 · 答案已展开</span>
          </div>

          <h2 className="mt-6 whitespace-pre-wrap text-[17px] leading-8 text-text-primary">
            {question.stem}
          </h2>

          {isManualGrading ? null : (
            <div
              aria-label="答案选项"
              className="mt-8 flex flex-col gap-3"
              role={isMultiple ? "group" : "radiogroup"}
            >
              {options.map((option) => {
                const correct = correctValues.has(option.value.toUpperCase());

                return (
                  <div
                    aria-label={correct ? "正确答案" : undefined}
                    className={reciteOptionClasses(correct)}
                    key={option.value}
                  >
                    <span className={reciteOptionMarkerClasses(correct)}>
                      {option.value}
                    </span>
                    <span className="flex-1 leading-7 text-text-primary">
                      {option.label}
                    </span>
                    {correct ? (
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 size-5 shrink-0 text-success"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <Reveal as="section" className={practiceAnalysisClasses()}>
            <p className="text-sm font-medium text-brand">
              {isManualGrading ? "参考答案" : "正确答案"}
            </p>
            {isManualGrading ? (
              answerPoints.length > 0 ? (
                <ul className="mt-2 space-y-1.5 text-sm leading-7 text-text-secondary">
                  {answerPoints.map((point, index) => (
                    <li className="whitespace-pre-wrap" key={index}>
                      {point}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-text-muted">暂无参考答案。</p>
              )
            ) : (
              <p className="mt-1 text-sm text-text-secondary">
                {formatAnswerJson(question.answerJson)}
              </p>
            )}
            {hasAnalysis ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-text-secondary">
                <span className={cn("font-medium", "text-text-primary")}>解析：</span>
                {question.analysis}
              </p>
            ) : null}
          </Reveal>
        </QuestionTransition>
      </section>

      <footer className={practiceFooterClasses()}>
        <div className={practiceFooterInnerClasses()}>
          <Button
            disabled={currentIndex === 0}
            onClick={onPrev}
            variant="outline"
          >
            上一题
          </Button>
          <Button
            onClick={() => onMark("review")}
            variant="outline"
          >
            没记住
          </Button>
          <Button
            onClick={() => onMark("known")}
          >
            记住了
          </Button>
        </div>
      </footer>
    </main>
  );
}

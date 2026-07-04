import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";

import type { PracticeQuestion } from "@/api/practice";
import { MathRenderer } from "@/components/MathRenderer";
import { QuestionTransition } from "@/components/motion/QuestionTransition";
import { Reveal } from "@/components/motion/Reveal";
import { PracticeToast } from "@/components/PracticeToast";
import type { PracticeAnswerRecord } from "@/hooks/usePracticeSession";
import { useAuth } from "@/hooks/useAuth";
import { buildRecitePath } from "@/lib/navigation";
import {
  formatAnswerJson,
  getQuestionOptions,
  isObjectiveQuestionType,
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PracticePlayerProps = {
  bankId: number;
  bankTitle: string;
  questions: PracticeQuestion[];
  currentIndex: number;
  record: PracticeAnswerRecord | undefined;
  onIndexChange: (index: number) => void;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onComplete: () => void;
  showWrongToast: boolean;
  onDismissWrongToast: () => void;
  autoNext: boolean;
  onToggleAutoNext: () => void;
};

export function PracticePlayer({
  bankId,
  bankTitle,
  questions,
  currentIndex,
  record,
  onIndexChange,
  onAnswerChange,
  onSubmit,
  onComplete,
  showWrongToast,
  onDismissWrongToast,
  autoNext,
  onToggleAutoNext,
}: PracticePlayerProps) {
  const { isAuthenticated } = useAuth();
  const question = questions[currentIndex];
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusedOptionIndex = useRef(0);

  const options = useMemo(
    () => (question ? getQuestionOptions(question) : []),
    [question],
  );

  const isManualGrading = question
    ? !isObjectiveQuestionType(question.questionType)
    : false;
  const isMultiple = question?.questionType === "MULTI";
  const shortAnswerValue = record?.answer[0] ?? "";

  useEffect(() => {
    focusedOptionIndex.current = 0;
    optionRefs.current = [];
  }, [currentIndex, question?.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!question || record?.submitted || isManualGrading) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusedOptionIndex.current = Math.min(
          focusedOptionIndex.current + 1,
          options.length - 1,
        );
        optionRefs.current[focusedOptionIndex.current]?.focus();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusedOptionIndex.current = Math.max(focusedOptionIndex.current - 1, 0);
        optionRefs.current[focusedOptionIndex.current]?.focus();
        return;
      }

      if (event.key === "Enter" && record && record.answer.length > 0) {
        event.preventDefault();
        onSubmit();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isManualGrading, onSubmit, options.length, question, record]);

  if (!question) {
    return null;
  }

  return (
    <main className="min-h-screen pb-practice-footer">
      <PracticeToast
        message="已加入错题本"
        onDismiss={onDismissWrongToast}
        visible={showWrongToast}
      />

      <header className="sticky top-0 z-10 border-b border-border bg-bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <div className="min-w-0">
            <Button asChild size="sm" variant="ghost">
              <Link to="/">← 退出</Link>
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
              <span className="text-text-muted"> / {questions.length} 题</span>
            </p>
            <div className="mt-1 flex items-center justify-end gap-1.5">
              <span className="text-xs text-text-muted">自动下一题</span>
              <button
                aria-checked={autoNext}
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  autoNext ? "bg-brand" : "bg-border",
                )}
                onClick={onToggleAutoNext}
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
              to={buildRecitePath(bankId, isAuthenticated)}
            >
              切换背题模式
            </Link>
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
                ? "主观题"
                : question.questionType === "MULTI"
                  ? "多选"
                  : question.questionType === "JUDGE"
                    ? "判断"
                    : "单选"}
            </span>
            <span className="text-sm text-text-muted">
              {isManualGrading
                ? record?.submitted
                  ? "已显示参考答案"
                  : "作答后可查看参考答案"
                : record?.submitted
                  ? "已提交"
                  : "选择后提交查看解析"}
            </span>
          </div>

          <h2 className="mt-6 whitespace-pre-wrap text-[17px] leading-8 text-text-primary">
            <MathRenderer text={question.stem} />
          </h2>

          {isManualGrading ? (
            <div className="mt-8 flex flex-col gap-3">
              <label
                className="text-sm font-medium text-text-secondary"
                htmlFor={`short-answer-${question.id ?? currentIndex}`}
              >
                我的答案
              </label>
              <textarea
                className="min-h-36 rounded-md border border-border bg-bg-canvas px-4 py-3 text-sm leading-7 text-text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={record?.submitted || record?.submitting}
                id={`short-answer-${question.id ?? currentIndex}`}
                onChange={(event) => onAnswerChange(event.target.value)}
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
              {options.map((option, index) => {
                const selected = record?.answer.includes(option.value) ?? false;

                return (
                  <button
                    aria-checked={selected}
                    className={practiceOptionClasses(selected)}
                    disabled={record?.submitted || record?.submitting}
                    key={option.value}
                    onClick={() => onAnswerChange(option.value)}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    role={isMultiple ? "checkbox" : "radio"}
                    type="button"
                  >
                    <span className={practiceOptionMarkerClasses(selected)}>
                      {option.value}
                    </span>
                    <span className="leading-7 text-text-primary">
                      <MathRenderer text={option.label} />
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
                  record.needsManualGrading
                    ? "text-text-primary"
                    : record.correct
                      ? "text-success"
                      : "text-error",
                )}
              >
                {record.needsManualGrading
                  ? "已显示参考答案"
                  : record.correct
                    ? "✓ 回答正确"
                    : "✗ 回答错误"}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                {record.needsManualGrading ? "参考答案" : "正确答案"}：
                {formatAnswerJson(record.answerJson)}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-text-secondary">
                解析：<MathRenderer text={record.analysis || "暂无解析。"} />
              </p>
            </Reveal>
          ) : null}
        </QuestionTransition>
      </section>

      <footer className={practiceFooterClasses()}>
        <div className={practiceFooterInnerClasses()}>
          <Button
            disabled={currentIndex === 0}
            onClick={() => onIndexChange(currentIndex - 1)}
            variant="outline"
          >
            上一题
          </Button>
          <Button
            disabled={
              !record ||
              record.answer.length === 0 ||
              record.submitted ||
              record.submitting
            }
            onClick={onSubmit}
          >
            {record?.submitting
              ? isManualGrading
                ? "加载中…"
                : "提交中…"
              : isManualGrading
                ? "显示答案"
                : "提交"}
          </Button>
          <Button
            onClick={() => {
              if (currentIndex >= questions.length - 1) {
                onComplete();
                return;
              }

              onIndexChange(currentIndex + 1);
            }}
            variant="outline"
          >
            {currentIndex >= questions.length - 1 ? "完成" : "下一题"}
          </Button>
        </div>
      </footer>
    </main>
  );
}

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { type ReactNode } from "react";

import { MathRenderer } from "@/components/MathRenderer";
import { QuestionTransition } from "@/components/motion/QuestionTransition";
import { Reveal } from "@/components/motion/Reveal";
import { PracticeToast } from "@/components/PracticeToast";
import {
  formatAnswerJson,
  getCorrectAnswerValues,
  getQuestionOptions,
  isObjectiveQuestionType,
  type QuestionLike,
} from "@/lib/practiceQuestion";
import {
  paperSheetClasses,
  practiceAnalysisClasses,
  practiceFooterClasses,
  practiceFooterInnerClasses,
  practiceOptionClasses,
  practiceOptionMarkerClasses,
  practiceTypeBadgeClasses,
  resolvePracticeOptionState,
} from "@/lib/practiceUi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PracticeQuestionLike = QuestionLike & {
  id?: number;
  stem?: string;
  answerJson?: string | null;
  analysis?: string | null;
};

export type PracticeRecordLike = {
  answer: string[];
  submitted: boolean;
  correct: boolean | null;
  submitting?: boolean;
  needsManualGrading?: boolean;
  answerJson?: string | null;
  analysis?: string | null;
};

type PracticePlayerCoreProps = {
  questions: PracticeQuestionLike[];
  currentIndex: number;
  record: PracticeRecordLike | undefined;
  onIndexChange: (index: number) => void;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  onComplete: () => void;
  autoNext: boolean;
  onToggleAutoNext: () => void;
  exitTo: string;
  title: string;
  showWrongToast?: boolean;
  onDismissWrongToast?: () => void;
  headerExtra?: ReactNode;
  enableKeyboardNav?: boolean;
  manualAnswerPoints?: string[];
  manualTypeLabel?: string;
  submitDisabledExtra?: boolean;
  isAnswerEmpty?: boolean;
};

export function PracticePlayerCore({
  questions,
  currentIndex,
  record,
  onIndexChange,
  onAnswerChange,
  onSubmit,
  onComplete,
  autoNext,
  onToggleAutoNext,
  exitTo,
  title,
  showWrongToast = false,
  onDismissWrongToast,
  headerExtra,
  enableKeyboardNav = true,
  manualAnswerPoints,
  manualTypeLabel = "主观题",
  submitDisabledExtra = false,
  isAnswerEmpty = false,
}: PracticePlayerCoreProps) {
  const question = questions[currentIndex];
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const stemRef = useRef<HTMLHeadingElement | null>(null);

  const options = useMemo(
    () => (question ? getQuestionOptions(question) : []),
    [question],
  );

  const isManualGrading = question
    ? !isObjectiveQuestionType(question.questionType)
    : false;
  const isMultiple = question?.questionType === "MULTI";
  const shortAnswerValue = record?.answer[0] ?? "";
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const correctValues = useMemo(
    () => new Set(getCorrectAnswerValues(record?.answerJson ?? question?.answerJson)),
    [question?.answerJson, record?.answerJson],
  );

  // 与 RecitePlayer 一致：换题后在绘制前复位滚动，避免低端设备先画出旧滚动位置再跳顶。
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    if (enableKeyboardNav && !isManualGrading && stemRef.current) {
      stemRef.current.focus();
    }
  }, [currentIndex, question?.id, enableKeyboardNav, isManualGrading]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!question || record?.submitted || isManualGrading) {
        return;
      }

      const target = event.target;
      const focusedOption =
        target instanceof HTMLButtonElement
          ? optionRefs.current.indexOf(target)
          : -1;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target.tagName === "BUTTON" && focusedOption < 0) ||
          target.tagName === "A")
      ) {
        return;
      }

      const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
      const backward = event.key === "ArrowUp" || event.key === "ArrowLeft";
      if (forward || backward) {
        event.preventDefault();
        const nextIndex =
          focusedOption < 0
            ? forward
              ? 0
              : options.length - 1
            : (focusedOption + (forward ? 1 : -1) + options.length) %
              options.length;
        optionRefs.current[nextIndex]?.focus();
        return;
      }

      if (
        event.key === "Enter" &&
        focusedOption < 0 &&
        record &&
        record.answer.length > 0
      ) {
        event.preventDefault();
        onSubmit();
      }
    },
    [isManualGrading, onSubmit, options.length, question, record],
  );

  useEffect(() => {
    if (!enableKeyboardNav) {
      return;
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableKeyboardNav, handleKeyDown]);

  if (!question) {
    return null;
  }

  const submitDisabled =
    !record ||
    isAnswerEmpty ||
    record.submitted ||
    record.submitting ||
    submitDisabledExtra;

  return (
    <main className="min-h-screen pb-practice-footer">
      {showWrongToast && onDismissWrongToast ? (
        <PracticeToast
          message="已加入错题本"
          onDismiss={onDismissWrongToast}
          visible={showWrongToast}
        />
      ) : null}

      <header className="sticky top-0 z-10 border-b border-border bg-bg-surface/95 pt-safe backdrop-blur-sm">
        {/* 窄屏两行布局：第一行操作（退出 + 进度 + 自动下一题），第二行标题 + 辅助链接，
            避免长标题、题数与开关在 320-375px 下互相挤压。 */}
        <div className="mx-auto flex max-w-3xl flex-col gap-1.5 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <Button asChild size="sm" variant="ghost">
              <Link to={exitTo}>← 退出</Link>
            </Button>
            <div className="flex min-w-0 items-center justify-end gap-3">
              <p
                aria-live="polite"
                className="shrink-0 font-medium tabular-nums text-text-primary"
              >
                <span className="text-text-muted">第 </span>
                {currentIndex + 1}
                <span className="text-text-muted"> / {questions.length} 题</span>
              </p>
              <label className="flex shrink-0 items-center gap-1.5 text-xs text-text-muted">
                <span>自动下一题</span>
                <button
                  aria-checked={autoNext}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-canvas",
                    // 视觉尺寸保持 36×20，伪元素把可点击区域扩到 ≥44×44。
                    "before:absolute before:-inset-x-2.5 before:-inset-y-3 before:content-['']",
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
              </label>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <h1 className="min-w-0 truncate font-serif text-lg font-semibold text-text-primary sm:text-xl">
              {title}
            </h1>
            {headerExtra}
          </div>
        </div>
        <div className="h-1 w-full bg-bg-canvas" role="progressbar" aria-label="刷题进度" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={currentIndex + 1}>
          <div
            className="h-full bg-brand transition-[width] duration-200 ease-out"
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
                ? manualTypeLabel
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

          <h2
            className="mt-6 whitespace-pre-wrap text-[17px] leading-8 text-text-primary outline-none"
            ref={stemRef}
            tabIndex={-1}
          >
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
                const optionState = resolvePracticeOptionState({
                  correct: correctValues.has(option.value.toUpperCase()),
                  selected,
                  submitted: record?.submitted ?? false,
                });

                return (
                  <button
                    aria-checked={selected}
                    className={practiceOptionClasses(optionState)}
                    disabled={record?.submitted || record?.submitting}
                    key={option.value}
                    onClick={() => onAnswerChange(option.value)}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    role={isMultiple ? "checkbox" : "radio"}
                    tabIndex={selected || (!record?.answer.length && index === 0) ? 0 : -1}
                    type="button"
                  >
                    <span className={practiceOptionMarkerClasses(optionState)}>
                      {option.value}
                    </span>
                    <span className="min-w-0 flex-1 leading-7 text-text-primary">
                      <MathRenderer text={option.label} />
                    </span>
                    {optionState === "correct" ? (
                      <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-success">
                        <Check aria-hidden="true" className="size-4" />
                        <span className="hidden sm:inline">正确</span>
                        <span className="sr-only sm:hidden">正确答案</span>
                      </span>
                    ) : optionState === "wrong" ? (
                      <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-error">
                        <X aria-hidden="true" className="size-4" />
                        <span className="hidden sm:inline">误选</span>
                        <span className="sr-only sm:hidden">你的错误答案</span>
                      </span>
                    ) : null}
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
              {isManualGrading ? (
                manualAnswerPoints && manualAnswerPoints.length > 0 ? (
                  <ul className="mt-2 space-y-1.5 text-sm leading-7 text-text-secondary">
                    {manualAnswerPoints.map((point, idx) => (
                      <li className="whitespace-pre-wrap" key={idx}>
                        <MathRenderer text={point} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-text-secondary">
                    参考答案：{formatAnswerJson(record.answerJson ?? question.answerJson)}
                  </p>
                )
              ) : (
                <p className="mt-2 text-sm text-text-secondary">
                  正确答案：{formatAnswerJson(record.answerJson ?? question.answerJson)}
                </p>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-text-secondary">
                解析：<MathRenderer text={(record.analysis ?? question.analysis) || "暂无解析。"} />
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
            size="lg"
            variant="outline"
          >
            上一题
          </Button>
          {record?.submitted ? (
            <Button
              className="col-span-2"
              onClick={() => {
                if (currentIndex >= questions.length - 1) {
                  onComplete();
                  return;
                }

                onIndexChange(currentIndex + 1);
              }}
              size="lg"
            >
              {currentIndex >= questions.length - 1 ? "查看结果" : "下一题"}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  if (currentIndex >= questions.length - 1) {
                    onComplete();
                    return;
                  }

                  onIndexChange(currentIndex + 1);
                }}
                size="lg"
                variant="ghost"
              >
                {currentIndex >= questions.length - 1 ? "结束" : "跳过"}
              </Button>
              <Button disabled={submitDisabled} onClick={onSubmit} size="lg">
                {record?.submitting
                  ? isManualGrading
                    ? "加载中…"
                    : "提交中…"
                  : isManualGrading
                    ? "显示答案"
                    : "提交答案"}
              </Button>
            </>
          )}
        </div>
      </footer>
    </main>
  );
}

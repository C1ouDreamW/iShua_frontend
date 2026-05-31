import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";

import type { PracticeQuestion } from "@/api/practice";
import { PracticeToast } from "@/components/PracticeToast";
import type { PracticeAnswerRecord } from "@/hooks/usePracticeSession";
import { usePracticeSheetEnter } from "@/hooks/usePracticeSheetEnter";
import {
  formatAnswerJson,
  getQuestionOptions,
  isObjectiveQuestionType,
} from "@/lib/practiceQuestion";
import {
  paperSheetClasses,
  practiceAnalysisClasses,
  practiceOptionClasses,
  practiceOptionMarkerClasses,
  practiceTypeBadgeClasses,
} from "@/lib/practiceUi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PracticePlayerProps = {
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
};

export function PracticePlayer({
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
}: PracticePlayerProps) {
  const question = questions[currentIndex];
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusedOptionIndex = useRef(0);
  const sheetEnterClass = usePracticeSheetEnter(currentIndex);

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
    <main className="min-h-screen pb-28">
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
          <p
            aria-live="polite"
            className="shrink-0 font-medium tabular-nums text-text-primary"
          >
            <span className="text-text-muted">第 </span>
            {currentIndex + 1}
            <span className="text-text-muted"> / {questions.length} 题</span>
          </p>
        </div>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        <article
          className={paperSheetClasses(sheetEnterClass)}
          key={question.id ?? currentIndex}
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
            {question.stem}
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
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {record?.submitted ? (
            <section className={practiceAnalysisClasses()}>
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
                解析：{record.analysis || "暂无解析。"}
              </p>
            </section>
          ) : null}
        </article>
      </section>

      <footer className="fixed inset-x-0 bottom-0 border-t border-border bg-bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="grid grid-cols-3 gap-3">
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
        </div>
      </footer>
    </main>
  );
}

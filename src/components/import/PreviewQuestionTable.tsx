import { useRef, useState } from "react";

import { MathRenderer } from "@/components/MathRenderer";
import { TagAnswerSource } from "@/components/question/TagAnswerSource";
import { TagQuestionType } from "@/components/question/TagQuestionType";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createEmptyPreviewRow,
  formatAnswerSummary,
  isLowConfidenceAiQuestion,
  type EditablePreviewQuestion,
} from "@/lib/aiImport";
import {
  getOptionLetters,
  toggleMultiAnswer,
  toggleSingleAnswer,
  type QuestionType,
} from "@/lib/questionForm";
import { cn } from "@/lib/utils";

type PreviewQuestionTableProps = {
  questions: EditablePreviewQuestion[];
  onChange: (questions: EditablePreviewQuestion[]) => void;
  disabled?: boolean;
};

export function PreviewQuestionTable({
  questions,
  onChange,
  disabled,
}: PreviewQuestionTableProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const editPanelRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  function updateQuestion(key: string, patch: Partial<EditablePreviewQuestion>) {
    onChange(
      questions.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function updateOption(key: string, index: number, value: string) {
    onChange(
      questions.map((item) => {
        if (item.key !== key) {
          return item;
        }

        return {
          ...item,
          options: item.options.map((option, optionIndex) =>
            optionIndex === index ? value : option,
          ),
        };
      }),
    );
  }

  function toggleExpanded(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b bg-bg-canvas text-text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">序号</th>
              <th className="px-4 py-3 font-medium">题型</th>
              <th className="px-4 py-3 font-medium">题干</th>
              <th className="px-4 py-3 font-medium">答案</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question, index) => {
              const isExpanded = expandedKeys.has(question.key);
              const isLowConfidence = isLowConfidenceAiQuestion(
                question.answerSource,
                question.answerConfidence,
              );
              const letters =
                question.questionType === "JUDGE"
                  ? ["T", "F"]
                  : getOptionLetters(question.options);

              return (
                <FragmentRow
                  expandedContent={
                    isExpanded ? (
                      <EditPanel
                        disabled={disabled}
                        index={index}
                        letters={letters}
                        onChange={onChange}
                        onRemove={() =>
                          onChange(
                            questions.filter(
                              (item) => item.key !== question.key,
                            ),
                          )
                        }
                        question={question}
                        updateOption={updateOption}
                        updateQuestion={updateQuestion}
                      />
                    ) : null
                  }
                  index={index}
                  isExpanded={isExpanded}
                  isLowConfidence={isLowConfidence}
                  key={question.key}
                  onToggle={() => {
                    if (!isExpanded) {
                      requestAnimationFrame(() => {
                        editPanelRefs.current
                          .get(question.key)
                          ?.scrollIntoView({
                            behavior: "smooth",
                            block: "nearest",
                          });
                      });
                    }
                    toggleExpanded(question.key);
                  }}
                  question={question}
                  registerRow={(el) => {
                    if (el) {
                      editPanelRefs.current.set(question.key, el);
                    } else {
                      editPanelRefs.current.delete(question.key);
                    }
                  }}
                  toggleDisabled={disabled}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-text-muted">暂无预览题目。</p>
      ) : null}

      <Button
        disabled={disabled}
        onClick={() => onChange([...questions, createEmptyPreviewRow()])}
        variant="outline"
      >
        添加预览题
      </Button>
    </div>
  );
}

type FragmentRowProps = {
  question: EditablePreviewQuestion;
  index: number;
  isExpanded: boolean;
  isLowConfidence: boolean;
  toggleDisabled?: boolean;
  onToggle: () => void;
  registerRow: (el: HTMLTableRowElement | null) => void;
  expandedContent: React.ReactNode;
};

function FragmentRow({
  question,
  index,
  isExpanded,
  isLowConfidence,
  toggleDisabled,
  onToggle,
  registerRow,
  expandedContent,
}: FragmentRowProps) {
  return (
    <>
      <tr
        className={cn(
          "border-b align-top",
          isLowConfidence && "bg-error/5",
        )}
      >
        <td className="px-4 py-3 tabular-nums">{index + 1}</td>
        <td className="px-4 py-3">
          <TagQuestionType type={question.questionType} />
        </td>
        <td className="max-w-xs px-4 py-3">
          <p className="line-clamp-1 text-text-primary">
            <MathRenderer text={question.stem || "（无题干）"} />
          </p>
          <TagAnswerSource
            className="mt-1"
            confidence={question.answerConfidence}
            source={question.answerSource}
          />
        </td>
        <td className="px-4 py-3 text-text-secondary">
          {formatAnswerSummary(question.answers)}
        </td>
        <td className="px-4 py-3">
          <Button
            aria-expanded={isExpanded}
            disabled={toggleDisabled}
            onClick={onToggle}
            size="sm"
            variant="outline"
          >
            {isExpanded ? "收起" : "展开编辑"}
          </Button>
        </td>
      </tr>
      {isExpanded ? (
        <tr ref={registerRow}>
          <td className="p-0" colSpan={5}>
            {expandedContent}
          </td>
        </tr>
      ) : null}
    </>
  );
}

type EditPanelProps = {
  question: EditablePreviewQuestion;
  index: number;
  letters: string[];
  disabled?: boolean;
  onChange: (questions: EditablePreviewQuestion[]) => void;
  onRemove: () => void;
  updateQuestion: (key: string, patch: Partial<EditablePreviewQuestion>) => void;
  updateOption: (key: string, index: number, value: string) => void;
};

function EditPanel({
  question,
  index,
  letters,
  disabled,
  onRemove,
  updateQuestion,
  updateOption,
}: EditPanelProps) {
  return (
    <section className="paper-panel m-3 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-medium text-text-primary">编辑第 {index + 1} 题</h3>
        <Button
          disabled={disabled}
          onClick={onRemove}
          size="sm"
          variant="ghost"
        >
          移除
        </Button>
      </div>

      <div className="space-y-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">题型</span>
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-bg-canvas"
            disabled={disabled}
            onChange={(event) => {
              const questionType = event.target.value as QuestionType;
              if (questionType === "SHORT_ANSWER") {
                updateQuestion(question.key, {
                  answers: [""],
                  options: [],
                  questionType,
                });
              } else if (questionType === "JUDGE") {
                updateQuestion(question.key, {
                  answers: [],
                  options: ["正确", "错误"],
                  questionType,
                });
              } else {
                updateQuestion(question.key, {
                  answers: [],
                  options:
                    question.questionType === "JUDGE" ||
                    question.questionType === "SHORT_ANSWER"
                      ? ["", ""]
                      : question.options,
                  questionType,
                });
              }
            }}
            value={question.questionType}
          >
            <option value="SINGLE">单选</option>
            <option value="MULTI">多选</option>
            <option value="JUDGE">判断</option>
            <option value="SHORT_ANSWER">简答</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">题干</span>
          <textarea
            className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={disabled}
            onChange={(event) =>
              updateQuestion(question.key, { stem: event.target.value })
            }
            value={question.stem}
          />
        </label>

        {question.questionType === "SHORT_ANSWER" ? (
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium">参考答案要点</span>
            <textarea
              className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={disabled}
              onChange={(event) =>
                updateQuestion(question.key, {
                  answers: event.target.value.split("\n"),
                })
              }
              placeholder="每行一个答案要点"
              value={question.answers.join("\n")}
            />
            <span className="text-xs text-text-muted">
              每行一个参考答案要点，用于刷题作答后展示。
            </span>
          </label>
        ) : (
          <div className="space-y-2">
            <span className="text-sm font-medium">选项与答案</span>
            {question.options.map((option, optionIndex) => {
              const letter = letters[optionIndex] ?? String(optionIndex + 1);
              const selected = question.answers.includes(letter);
              const isJudge = question.questionType === "JUDGE";

              return (
                <div className="flex items-start gap-3 rounded-lg border p-3" key={letter}>
                  <button
                    aria-checked={selected}
                    className={cn(
                      "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      selected
                        ? "border-brand bg-brand-muted text-brand"
                        : "text-text-muted",
                    )}
                    disabled={disabled}
                    onClick={() => {
                      const answers =
                        question.questionType === "MULTI"
                          ? toggleMultiAnswer(question.answers, letter)
                          : toggleSingleAnswer(question.answers, letter);
                      updateQuestion(question.key, { answers });
                    }}
                    type="button"
                  >
                    {letter}
                  </button>
                  <Input
                    className="flex-1"
                    disabled={disabled || isJudge}
                    onChange={(event) =>
                      updateOption(question.key, optionIndex, event.target.value)
                    }
                    value={option}
                  />
                </div>
              );
            })}
          </div>
        )}

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">解析</span>
          <textarea
            className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={disabled}
            onChange={(event) =>
              updateQuestion(question.key, { analysis: event.target.value })
            }
            value={question.analysis}
          />
        </label>
      </div>
    </section>
  );
}

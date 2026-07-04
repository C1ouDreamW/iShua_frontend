import { useState } from "react";

import { Stagger, StaggerItem } from "@/components/motion/Stagger";
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
          <Stagger as="tbody" key={questions.length}>
            {questions.map((question, index) => {
              const isExpanded = expandedKeys.has(question.key);
              const isLowConfidence = isLowConfidenceAiQuestion(
                question.answerSource,
                question.answerConfidence,
              );

              return (
                <StaggerItem
                  as="tr"
                  className={cn(
                    "border-b align-top",
                    isLowConfidence && "bg-error/5",
                  )}
                  key={question.key}
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
                      disabled={disabled}
                      onClick={() => toggleExpanded(question.key)}
                      size="sm"
                      variant="outline"
                    >
                      {isExpanded ? "收起" : "展开编辑"}
                    </Button>
                  </td>
                </StaggerItem>
              );
            })}
          </Stagger>
        </table>
      </div>

      {questions.map((question, index) => {
        if (!expandedKeys.has(question.key)) {
          return null;
        }

        const letters =
          question.questionType === "JUDGE"
            ? ["T", "F"]
            : getOptionLetters(question.options);

        return (
          <section
            className="paper-panel p-4"
            key={`panel-${question.key}`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="font-medium text-text-primary">编辑第 {index + 1} 题</h3>
              <Button
                disabled={disabled}
                onClick={() =>
                  onChange(questions.filter((item) => item.key !== question.key))
                }
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
                  className="h-10 rounded-md border px-3"
                  disabled={disabled}
                  onChange={(event) => {
                    const questionType = event.target.value as QuestionType;
                    updateQuestion(question.key, {
                      answers: [],
                      options:
                        questionType === "JUDGE"
                          ? ["正确", "错误"]
                          : question.questionType === "JUDGE"
                            ? ["", ""]
                            : question.options,
                      questionType,
                    });
                  }}
                  value={question.questionType}
                >
                  <option value="SINGLE">单选</option>
                  <option value="MULTI">多选</option>
                  <option value="JUDGE">判断</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">题干</span>
                <textarea
                  className="min-h-24 rounded-md border px-3 py-2"
                  disabled={disabled}
                  onChange={(event) =>
                    updateQuestion(question.key, { stem: event.target.value })
                  }
                  value={question.stem}
                />
              </label>

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
                          "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
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

              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">解析</span>
                <textarea
                  className="min-h-20 rounded-md border px-3 py-2"
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
      })}

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

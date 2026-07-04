import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  createQuestionInBank,
  getQuestion,
  updateQuestion,
} from "@/api/questions";
import { Button } from "@/components/ui/button";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { setPageFlash } from "@/lib/pageFlash";
import { Input } from "@/components/ui/input";
import {
  createEmptyFormState,
  formToPayload,
  getOptionLetters,
  questionToFormState,
  toggleMultiAnswer,
  toggleSingleAnswer,
  validateQuestionForm,
  type QuestionFormState,
  type QuestionType,
} from "@/lib/questionForm";
import { practiceFooterClasses } from "@/lib/practiceUi";
import { cn } from "@/lib/utils";

export function QuestionFormPage() {
  const { bankId, id } = useParams();
  const navigate = useNavigate();
  const numericBankId = Number(bankId);
  const numericQuestionId = id ? Number(id) : null;
  const isEdit = Boolean(numericQuestionId);
  const detailPath = `/app/manage/banks/${bankId}`;

  const [form, setForm] = useState<QuestionFormState>(() =>
    createEmptyFormState(),
  );
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optionLetters = useMemo(
    () =>
      form.questionType === "JUDGE"
        ? ["T", "F"]
        : getOptionLetters(form.options),
    [form.options, form.questionType],
  );

  useEffect(() => {
    if (!isEdit || !numericQuestionId) {
      return;
    }

    let ignore = false;

    async function loadQuestion() {
      setLoading(true);
      setError(null);

      try {
        const question = await getQuestion(numericQuestionId!);

        if (!ignore) {
          setForm(questionToFormState(question));
        }
      } catch (caught) {
        if (!ignore) {
          setError(resolveApiErrorMessage(caught, "试题加载失败。"));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadQuestion();

    return () => {
      ignore = true;
    };
  }, [isEdit, numericQuestionId]);

  function updateQuestionType(nextType: QuestionType) {
    setForm((prev) => {
      if (nextType === "SHORT_ANSWER") {
        return {
          ...prev,
          answers: [""],
          options: [],
          questionType: nextType,
        };
      }

      if (nextType === "JUDGE") {
        return {
          ...prev,
          answers: [],
          options: ["正确", "错误"],
          questionType: nextType,
        };
      }

      return {
        ...prev,
        answers: [],
        options: prev.questionType === "JUDGE" ? ["", ""] : prev.options,
        questionType: nextType,
      };
    });
  }

  function updateOption(index: number, value: string) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    }));
  }

  function addOption() {
    setForm((prev) => ({ ...prev, options: [...prev.options, ""] }));
  }

  function removeOption(index: number) {
    const letter = optionLetters[index];
    setForm((prev) => ({
      ...prev,
      answers: prev.answers.filter((item) => item !== letter),
      options: prev.options.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function toggleAnswer(letter: string) {
    setForm((prev) => {
      if (prev.questionType === "MULTI") {
        return {
          ...prev,
          answers: toggleMultiAnswer(prev.answers, letter),
        };
      }

      return {
        ...prev,
        answers: toggleSingleAnswer(prev.answers, letter),
      };
    });
  }

  async function handleSave() {
    const validationError = validateQuestionForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!Number.isFinite(numericBankId)) {
      setError("题库 ID 不正确。");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = formToPayload(form);

      if (isEdit && numericQuestionId) {
        await updateQuestion(numericQuestionId, payload);
      } else {
        await createQuestionInBank(numericBankId, payload);
      }

      setPageFlash("保存成功");
      navigate(detailPath);
    } catch (caught) {
      setError(resolveApiErrorMessage(caught, "保存失败，请重试。"));
    } finally {
      setSaving(false);
    }
  }

  if (loading && !form.stem && !form.options.length) {
    return (
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-bg-surface" />
          <div className="h-[480px] animate-pulse rounded-lg border border-border bg-bg-sheet" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-practice-footer">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Button asChild className="mb-6" size="sm" variant="ghost">
          <Link to={detailPath}>← 返回题库详情</Link>
        </Button>

        <header className="mb-8">
          <h1 className="font-serif text-3xl font-semibold text-text-primary">
            {isEdit ? "编辑试题" : "新建试题"}
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            保存后将写入当前题库，选项与答案会以 JSON 字符串提交。
          </p>
        </header>

        <form
          className="paper-panel space-y-6 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-text-primary">题型</span>
            <select
              className="h-10 rounded-md border bg-background px-3"
              disabled={saving}
              onChange={(event) =>
                updateQuestionType(event.target.value as QuestionType)
              }
              value={form.questionType}
            >
              <option value="SINGLE">单选</option>
              <option value="MULTI">多选</option>
              <option value="JUDGE">判断</option>
              <option value="SHORT_ANSWER">简答</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-text-primary">
              题干 <span className="text-error">*</span>
            </span>
            <textarea
              className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={saving}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, stem: event.target.value }))
              }
              value={form.stem}
            />
          </label>

          {form.questionType === "SHORT_ANSWER" ? (
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-text-primary">
                参考答案要点 <span className="text-error">*</span>
              </span>
              <textarea
                className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={saving}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    answers: event.target.value.split("\n"),
                  }))
                }
                placeholder="每行一个答案要点"
                value={form.answers.join("\n")}
              />
              <span className="text-xs text-text-muted">
                每行一个参考答案要点，用于刷题作答后展示。
              </span>
            </label>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-text-primary">选项</span>
                {form.questionType !== "JUDGE" ? (
                  <Button
                    disabled={saving}
                    onClick={addOption}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    添加选项
                  </Button>
                ) : null}
              </div>

              <div className="space-y-3">
                {form.options.map((option, index) => {
                  const letter = optionLetters[index] ?? String(index + 1);
                  const selected = form.answers.includes(letter);
                  const isJudge = form.questionType === "JUDGE";

                  return (
                    <div
                      className="rounded-lg border p-3"
                      key={`${letter}-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          aria-checked={selected}
                          className={cn(
                            "mt-2 flex size-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                            selected
                              ? "border-brand bg-brand-muted text-brand"
                              : "text-text-muted",
                          )}
                          disabled={saving}
                          onClick={() => toggleAnswer(letter)}
                          role={form.questionType === "MULTI" ? "checkbox" : "radio"}
                          type="button"
                        >
                          {letter}
                        </button>
                        <div className="min-w-0 flex-1">
                          <Input
                            disabled={saving || isJudge}
                            onChange={(event) =>
                              updateOption(index, event.target.value)
                            }
                            placeholder={
                              isJudge
                                ? index === 0
                                  ? "正确"
                                  : "错误"
                                : `选项 ${letter}`
                            }
                            value={option}
                          />
                        </div>
                        {!isJudge && form.options.length > 2 ? (
                          <Button
                            disabled={saving}
                            onClick={() => removeOption(index)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            删除
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-text-primary">解析</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={saving}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, analysis: event.target.value }))
              }
              value={form.analysis}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-text-primary">排序号（可选）</span>
            <Input
              disabled={saving}
              inputMode="numeric"
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sortNo: event.target.value }))
              }
              placeholder="例如：1"
              value={form.sortNo}
            />
          </label>

          {error ? (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </div>

      <footer className={cn(practiceFooterClasses(), "lg:left-60")}>
        <div className="mx-auto flex max-w-3xl gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Button asChild className="flex-1" variant="outline">
            <Link to={detailPath}>取消</Link>
          </Button>
          <Button
            className="flex-1"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      </footer>
    </main>
  );
}

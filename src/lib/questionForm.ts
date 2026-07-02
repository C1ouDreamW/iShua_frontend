import type { Question, QuestionPayload } from "@/api/questions";
import { parseOptionsJson } from "@/lib/parseOptionsJson";

export type QuestionType = "SINGLE" | "MULTI" | "JUDGE" | "SHORT_ANSWER";

export type QuestionFormState = {
  questionType: QuestionType;
  stem: string;
  options: string[];
  answers: string[];
  analysis: string;
  sortNo: string;
};

const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const JUDGE_OPTIONS = ["正确", "错误"];

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  SHORT_ANSWER: "简答",
  SINGLE: "单选",
  MULTI: "多选",
  JUDGE: "判断",
};

export function createEmptyFormState(
  questionType: QuestionType = "SINGLE",
): QuestionFormState {
  if (questionType === "SHORT_ANSWER") {
    return {
      analysis: "",
      answers: [""],
      options: [],
      questionType,
      sortNo: "",
      stem: "",
    };
  }

  return {
    analysis: "",
    answers: [],
    options: questionType === "JUDGE" ? [...JUDGE_OPTIONS] : ["", ""],
    questionType,
    sortNo: "",
    stem: "",
  };
}

function parseAnswerJson(answerJson: string | null | undefined) {
  if (!answerJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(answerJson);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function questionToFormState(question: Question): QuestionFormState {
  const questionType = (question.questionType ?? "SINGLE") as QuestionType;

  if (questionType === "SHORT_ANSWER") {
    return {
      analysis: question.analysis ?? "",
      answers: parseAnswerJson(question.answerJson),
      options: [],
      questionType,
      sortNo: question.sortNo != null ? String(question.sortNo) : "",
      stem: question.stem ?? "",
    };
  }

  const parsedOptions = parseOptionsJson(question.optionsJson);
  const options =
    questionType === "JUDGE"
      ? parsedOptions.length > 0
        ? parsedOptions
        : [...JUDGE_OPTIONS]
      : parsedOptions.length > 0
        ? parsedOptions
        : ["", ""];

  return {
    analysis: question.analysis ?? "",
    answers: parseAnswerJson(question.answerJson),
    options,
    questionType,
    sortNo: question.sortNo != null ? String(question.sortNo) : "",
    stem: question.stem ?? "",
  };
}

export function getOptionLetters(options: string[]) {
  return options.map((_, index) => OPTION_LETTERS[index] ?? String(index + 1));
}

export function formToPayload(form: QuestionFormState): QuestionPayload {
  if (form.questionType === "SHORT_ANSWER") {
    return {
      analysis: form.analysis.trim() || undefined,
      answerJson: JSON.stringify(
        form.answers.map((item) => item.trim()).filter(Boolean),
      ),
      optionsJson: "[]",
      questionType: form.questionType,
      sortNo: form.sortNo.trim() ? Number(form.sortNo) : undefined,
      stem: form.stem.trim(),
    };
  }

  const options =
    form.questionType === "JUDGE"
      ? form.options.length > 0
        ? form.options
        : JUDGE_OPTIONS
      : form.options.map((item) => item.trim()).filter(Boolean);

  return {
    analysis: form.analysis.trim() || undefined,
    answerJson: JSON.stringify(form.answers),
    optionsJson: JSON.stringify(options),
    questionType: form.questionType,
    sortNo: form.sortNo.trim() ? Number(form.sortNo) : undefined,
    stem: form.stem.trim(),
  };
}

export function validateQuestionForm(form: QuestionFormState) {
  if (!form.stem.trim()) {
    return "请填写题干。";
  }

  if (form.questionType === "SHORT_ANSWER") {
    const filledAnswers = form.answers
      .map((item) => item.trim())
      .filter(Boolean);

    if (filledAnswers.length === 0) {
      return "请填写参考答案要点。";
    }

    return null;
  }

  if (form.questionType === "JUDGE") {
    if (form.answers.length === 0) {
      return "请选择判断题答案。";
    }

    return null;
  }

  const filledOptions = form.options.map((item) => item.trim()).filter(Boolean);

  if (filledOptions.length < 2) {
    return "请至少填写 2 个选项。";
  }

  if (form.answers.length === 0) {
    return "请选择正确答案。";
  }

  if (form.questionType === "SINGLE" && form.answers.length !== 1) {
    return "单选题只能选择一个答案。";
  }

  return null;
}

export function toggleSingleAnswer(answers: string[], value: string) {
  return answers.includes(value) ? [] : [value];
}

export function toggleMultiAnswer(answers: string[], value: string) {
  return answers.includes(value)
    ? answers.filter((item) => item !== value)
    : [...answers, value];
}

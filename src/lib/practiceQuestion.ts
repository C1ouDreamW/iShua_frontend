import type { PracticeQuestion } from "@/api/practice";
import type { Question } from "@/api/banks";
import { parseOptionsJson } from "@/lib/parseOptionsJson";

const OPTION_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type QuestionLike = Pick<Question | PracticeQuestion, "questionType" | "optionsJson">;

export function isObjectiveQuestionType(questionType: string | undefined) {
  return ["SINGLE", "MULTI", "JUDGE"].includes(questionType ?? "");
}

export function getQuestionOptions(question: QuestionLike) {
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

export function formatAnswerJson(answerJson: string | null | undefined) {
  try {
    const parsed = JSON.parse(answerJson ?? "[]");
    return Array.isArray(parsed) ? parsed.join("、") : "暂无";
  } catch {
    return "暂无";
  }
}

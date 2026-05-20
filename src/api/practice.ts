import { request } from "@/api/client";
import type { components } from "@/types/api";

export type PracticeQuestion = components["schemas"]["PracticeQuestionVO"];
export type AnswerSubmitResult = components["schemas"]["AnswerSubmitResultVO"];

export function listPracticeQuestions(bankId: number) {
  return request<PracticeQuestion[] | null>(
    `/api/v1/practice/banks/${bankId}/questions`,
  );
}

export function submitAnswer(
  bankId: number,
  questionId: number,
  userAnswer: string[],
) {
  return request<AnswerSubmitResult>(
    `/api/v1/practice/banks/${bankId}/questions/${questionId}/submit`,
    {
      body: { userAnswer },
      method: "POST",
    },
  );
}

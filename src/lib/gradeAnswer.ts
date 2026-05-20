export type ObjectiveQuestionType = "SINGLE" | "MULTI" | "JUDGE";

type GradeAnswerInput = {
  questionType: string;
  answerJson: string | null | undefined;
  userAnswer: string[];
};

function normalizeAnswer(answer: string[]) {
  return answer.map((item) => item.trim().toUpperCase()).filter(Boolean);
}

function parseAnswerJson(answerJson: string | null | undefined) {
  if (!answerJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(answerJson);
    return Array.isArray(parsed)
      ? normalizeAnswer(
          parsed.filter((item): item is string => typeof item === "string"),
        )
      : [];
  } catch {
    return [];
  }
}

function sameSet(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((item) => rightSet.has(item));
}

export function gradeAnswer({
  questionType,
  answerJson,
  userAnswer,
}: GradeAnswerInput) {
  const normalizedType = questionType.toUpperCase();

  if (!["SINGLE", "MULTI", "JUDGE"].includes(normalizedType)) {
    return false;
  }

  return sameSet(normalizeAnswer(userAnswer), parseAnswerJson(answerJson));
}

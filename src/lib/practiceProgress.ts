type QuestionIdentity = { id?: number };

export function findFirstUnansweredIndex(
  records: Array<{ submitted: boolean }>,
) {
  return records.findIndex((record) => !record.submitted);
}

export function findNextUnmarkedIndex(
  activeIndices: number[],
  marks: Array<unknown | null>,
  currentIndex: number,
) {
  return activeIndices.findIndex(
    (index, position) => position !== currentIndex && marks[index] === null,
  );
}

export function summarizePracticeRecords(
  records: Array<{ submitted: boolean; correct: boolean | null }>,
) {
  return {
    correctCount: records.filter((record) => record.correct === true).length,
    reviewedCount: records.filter(
      (record) => record.submitted && record.correct === null,
    ).length,
    unansweredCount: records.filter((record) => !record.submitted).length,
    wrongCount: records.filter((record) => record.correct === false).length,
  };
}

export type PersistedPracticeRecord = {
  answer: string[];
  submitted: boolean;
  correct: boolean | null;
  needsManualGrading?: boolean;
  answerJson?: string | null;
  analysis?: string | null;
  submitting?: boolean;
};

export type PracticeProgress = {
  currentIndex: number;
  autoNext: boolean;
  records: PersistedPracticeRecord[];
};

export type RecentPractice = {
  bankId: number;
  title: string;
  mode: "practice" | "recite";
  authenticated: boolean;
};

const PROGRESS_PREFIX = "ishua_practice_progress_v1";
const RECENT_KEY = "ishua_recent_practice_v1";

function questionIds(questions: QuestionIdentity[]) {
  return questions.map((question, index) => question.id ?? index);
}

function isNullableString(value: unknown) {
  return value == null || typeof value === "string";
}

function isRecord(value: unknown): value is PersistedPracticeRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.answer) &&
    record.answer.every((answer) => typeof answer === "string") &&
    typeof record.submitted === "boolean" &&
    (record.correct === null || typeof record.correct === "boolean") &&
    (record.needsManualGrading === undefined ||
      typeof record.needsManualGrading === "boolean") &&
    isNullableString(record.answerJson) &&
    isNullableString(record.analysis)
  );
}

export function parsePracticeProgress(
  raw: string | null,
  questions: QuestionIdentity[],
): PracticeProgress | null {
  if (!raw || questions.length === 0) {
    return null;
  }

  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const expectedIds = questionIds(questions);
    if (
      value.version !== 1 ||
      !Array.isArray(value.questionIds) ||
      value.questionIds.length !== expectedIds.length ||
      value.questionIds.some((id, index) => id !== expectedIds[index]) ||
      !Number.isInteger(value.currentIndex) ||
      (value.currentIndex as number) < 0 ||
      (value.currentIndex as number) >= questions.length ||
      typeof value.autoNext !== "boolean" ||
      !Array.isArray(value.records) ||
      value.records.length !== questions.length ||
      !value.records.every(isRecord)
    ) {
      return null;
    }

    return {
      autoNext: value.autoNext,
      currentIndex: value.currentIndex as number,
      records: value.records,
    };
  } catch {
    return null;
  }
}

export function readPracticeProgress(
  scope: string,
  bankId: number,
  questions: QuestionIdentity[],
) {
  try {
    return parsePracticeProgress(
      window.localStorage.getItem(`${PROGRESS_PREFIX}:${scope}:${bankId}`),
      questions,
    );
  } catch {
    return null;
  }
}

export function savePracticeProgress(
  scope: string,
  bankId: number,
  questions: QuestionIdentity[],
  progress: PracticeProgress,
) {
  if (questions.length === 0 || progress.records.length !== questions.length) {
    return;
  }

  try {
    window.localStorage.setItem(
      `${PROGRESS_PREFIX}:${scope}:${bankId}`,
      JSON.stringify({
        ...progress,
        questionIds: questionIds(questions),
        records: progress.records.map((record) => ({
          analysis: record.analysis,
          answer: record.answer,
          answerJson: record.answerJson,
          correct: record.correct,
          needsManualGrading: record.needsManualGrading,
          submitted: record.submitted,
        })),
        version: 1,
      }),
    );
  } catch {
    // 私密浏览或空间不足时退化为当前页面内存状态。
  }
}

export function savePracticePosition(
  scope: string,
  bankId: number,
  questions: QuestionIdentity[],
  currentIndex: number,
) {
  const previous = readPracticeProgress(scope, bankId, questions);
  savePracticeProgress(scope, bankId, questions, {
    autoNext: previous?.autoNext ?? false,
    currentIndex,
    records:
      previous?.records ??
      questions.map(() => ({ answer: [], correct: null, submitted: false })),
  });
}

export function clearPracticeProgress(scope: string, bankId: number) {
  try {
    window.localStorage.removeItem(`${PROGRESS_PREFIX}:${scope}:${bankId}`);
  } catch {
    // Ignore storage errors.
  }
}

export function rememberRecentPractice(value: RecentPractice) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage errors.
  }
}

export function clearRecentPractice(bankId: number) {
  try {
    if (readRecentPractice()?.bankId === bankId) {
      window.localStorage.removeItem(RECENT_KEY);
    }
  } catch {
    // Ignore storage errors.
  }
}

export function readRecentPractice(): RecentPractice | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "null") as
      | Record<string, unknown>
      | null;
    if (
      !value ||
      !Number.isFinite(value.bankId) ||
      typeof value.title !== "string" ||
      (value.mode !== "practice" && value.mode !== "recite") ||
      typeof value.authenticated !== "boolean"
    ) {
      return null;
    }

    return value as RecentPractice;
  } catch {
    return null;
  }
}

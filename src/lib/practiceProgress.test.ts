import { describe, expect, it } from "vitest";

import {
  findFirstUnansweredIndex,
  parsePracticeProgress,
  summarizePracticeRecords,
} from "./practiceProgress";

const questions = [{ id: 10 }, { id: 11 }];
const progress = JSON.stringify({
  version: 1,
  questionIds: [10, 11],
  currentIndex: 1,
  autoNext: true,
  records: [
    { answer: ["A"], submitted: true, correct: true },
    { answer: [], submitted: false, correct: null },
  ],
});

describe("parsePracticeProgress", () => {
  it("恢复题目未变化的合法进度", () => {
    expect(parsePracticeProgress(progress, questions)?.currentIndex).toBe(1);
  });

  it("题目变化或缓存损坏时从头开始", () => {
    expect(parsePracticeProgress(progress, [{ id: 10 }, { id: 12 }])).toBeNull();
    expect(parsePracticeProgress("{", questions)).toBeNull();
  });
});

it("找到第一道未答题", () => {
  expect(
    findFirstUnansweredIndex([
      { submitted: true },
      { submitted: false },
      { submitted: false },
    ]),
  ).toBe(1);
  expect(findFirstUnansweredIndex([{ submitted: true }])).toBe(-1);
});

it("将主观题计入已看解析而不是答错", () => {
  expect(
    summarizePracticeRecords([
      { submitted: true, correct: true },
      { submitted: true, correct: false },
      { submitted: true, correct: null },
      { submitted: false, correct: null },
    ]),
  ).toEqual({
    correctCount: 1,
    reviewedCount: 1,
    unansweredCount: 1,
    wrongCount: 1,
  });
});

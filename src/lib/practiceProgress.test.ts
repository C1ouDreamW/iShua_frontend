import { describe, expect, it } from "vitest";

import { parsePracticeProgress } from "./practiceProgress";

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

import { describe, expect, it } from "vitest";

import { resolvePracticeOptionState } from "./practiceUi";

describe("resolvePracticeOptionState", () => {
  it("提交后同时标出正确项和误选项", () => {
    expect(
      resolvePracticeOptionState({ correct: true, selected: false, submitted: true }),
    ).toBe("correct");
    expect(
      resolvePracticeOptionState({ correct: false, selected: true, submitted: true }),
    ).toBe("wrong");
  });

  it("提交前只显示选择状态", () => {
    expect(
      resolvePracticeOptionState({ correct: true, selected: false, submitted: false }),
    ).toBe("idle");
    expect(
      resolvePracticeOptionState({ correct: false, selected: true, submitted: false }),
    ).toBe("selected");
  });
});

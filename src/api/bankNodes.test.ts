import { describe, expect, it } from "vitest";

import { ApiError } from "@/api/client";
import { isHotPracticeUnavailableError } from "@/api/bankNodes";

function apiError(code: number) {
  return new ApiError({ code, data: null, message: "测试错误" }, new Response());
}

describe("isHotPracticeUnavailableError", () => {
  it("只识别公开聚合接口的 403 不可用响应", () => {
    expect(isHotPracticeUnavailableError(apiError(403))).toBe(true);
    expect(isHotPracticeUnavailableError(apiError(404))).toBe(false);
    expect(isHotPracticeUnavailableError(new Error("失败"))).toBe(false);
  });
});

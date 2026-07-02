import { useCallback, useEffect, useMemo, useState } from "react";

import { getBankNode, getHotPracticeDetail } from "@/api/bankNodes";
import { pageQuestionsInBank, type Question } from "@/api/questions";
import { ApiError } from "@/api/client";
import { resolveApiErrorMessage } from "@/lib/apiErrors";

export type ReciteMark = "known" | "review";

export type ReciteSessionStatus = "loading" | "ready" | "complete" | "error";

export type ReciteStats = {
  knownCount: number;
  reviewCount: number;
  unansweredCount: number;
  total: number;
};

type ReciteMarkState = ReciteMark | null;

async function loadFromPrivateBank(
  bankId: number,
): Promise<{ bankTitle: string; questions: Question[] }> {
  const pageSize = 200;
  const records: Question[] = [];

  for (let current = 1; current <= 100; current += 1) {
    const page = await pageQuestionsInBank(bankId, { current, pageSize });
    const items = page?.records ?? [];

    records.push(...items);

    if (items.length < pageSize) {
      break;
    }
  }

  let bankTitle = "背题模式";
  try {
    const node = await getBankNode(bankId);
    bankTitle = node.title ?? bankTitle;
  } catch {
    // 忽略：仅用于标题展示。
  }

  return { bankTitle, questions: records };
}

export function useReciteSession(
  bankId: number,
  isAuthenticated: boolean,
) {
  const [status, setStatus] = useState<ReciteSessionStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [bankTitle, setBankTitle] = useState("背题模式");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const [marks, setMarks] = useState<ReciteMarkState[]>([]);
  const [workingIndex, setWorkingIndex] = useState(0);

  const reload = useCallback(async () => {
    if (!Number.isFinite(bankId)) {
      setStatus("error");
      setError("题库 ID 不正确。");
      setAllQuestions([]);
      setActiveIndices([]);
      setMarks([]);
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const bundle = await getHotPracticeDetail(bankId);
      const questions = bundle.questions ?? [];

      setAllQuestions(questions);
      setActiveIndices(questions.map((_, index) => index));
      setMarks(questions.map(() => null));
      setBankTitle(bundle.bank?.title ?? "背题模式");
      setWorkingIndex(0);
      setStatus("ready");
    } catch (publicError) {
      // 公开聚合接口对私有题库返回 404；登录用户（题库所有者 / ADMIN）回退到分页接口。
      const isPrivateBank =
        publicError instanceof ApiError && publicError.code === 404;

      if (!isAuthenticated || !isPrivateBank) {
        setAllQuestions([]);
        setActiveIndices([]);
        setMarks([]);
        setStatus("error");
        setError(
          resolveApiErrorMessage(
            publicError,
            "背题数据加载失败。背题模式仅支持公开题库。",
          ),
        );
        return;
      }

      try {
        const { bankTitle: title, questions } = await loadFromPrivateBank(
          bankId,
        );

        setAllQuestions(questions);
        setActiveIndices(questions.map((_, index) => index));
        setMarks(questions.map(() => null));
        setBankTitle(title);
        setWorkingIndex(0);
        setStatus("ready");
      } catch (fallbackError) {
        setAllQuestions([]);
        setActiveIndices([]);
        setMarks([]);
        setStatus("error");
        setError(
          resolveApiErrorMessage(
            fallbackError,
            "该题库暂不支持背题模式。背题模式仅支持公开题库或你拥有的题库。",
          ),
        );
      }
    }
  }, [bankId, isAuthenticated]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const questions = useMemo(
    () => activeIndices.map((index) => allQuestions[index]).filter(Boolean),
    [activeIndices, allQuestions],
  );

  const stats = useMemo<ReciteStats>(() => {
    let knownCount = 0;
    let reviewCount = 0;
    let unansweredCount = 0;

    activeIndices.forEach((index) => {
      const mark = marks[index];
      if (mark === "known") {
        knownCount += 1;
      } else if (mark === "review") {
        reviewCount += 1;
      } else {
        unansweredCount += 1;
      }
    });

    return {
      knownCount,
      reviewCount,
      unansweredCount,
      total: activeIndices.length,
    };
  }, [activeIndices, marks]);

  const markCurrent = useCallback(
    (mark: ReciteMark) => {
      const allIndex = activeIndices[workingIndex];

      if (allIndex == null) {
        return;
      }

      setMarks((items) =>
        items.map((item, index) => (index === allIndex ? mark : item)),
      );

      if (workingIndex >= activeIndices.length - 1) {
        setStatus("complete");
        return;
      }

      setWorkingIndex((index) => index + 1);
    },
    [activeIndices, workingIndex],
  );

  const goPrev = useCallback(() => {
    setWorkingIndex((index) => Math.max(0, index - 1));
  }, []);

  const goNext = useCallback(() => {
    setWorkingIndex((index) =>
      Math.min(activeIndices.length - 1, index + 1),
    );
  }, [activeIndices.length]);

  const restart = useCallback(
    (filter?: "review") => {
      let nextActive: number[];

      if (filter === "review") {
        const reviewOnly = allQuestions
          .map((_, index) => index)
          .filter((index) => marks[index] === "review");

        nextActive = reviewOnly.length > 0 ? reviewOnly : allQuestions.map((_, index) => index);
      } else {
        nextActive = allQuestions.map((_, index) => index);
      }

      setActiveIndices(nextActive);
      setMarks(allQuestions.map(() => null));
      setWorkingIndex(0);
      setStatus("ready");
    },
    [allQuestions, marks],
  );

  const complete = useCallback(() => {
    setStatus("complete");
  }, []);

  return {
    bankTitle,
    complete,
    error,
    goNext,
    goPrev,
    markCurrent,
    questions,
    reload,
    restart,
    stats,
    status,
    workingIndex,
  };
}

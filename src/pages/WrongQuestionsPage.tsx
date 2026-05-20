import { useEffect, useMemo, useState } from "react";

import { pagePublicBanks } from "@/api/banks";
import {
  pageWrongQuestions,
  removeWrongQuestion,
  type WrongQuestion,
} from "@/api/wrong";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PaginationBar } from "@/components/PaginationBar";
import {
  WrongQuestionList,
  type BankFilterOption,
} from "@/components/WrongQuestionList";
const PAGE_SIZE = 10;

export function WrongQuestionsPage() {
  const [bankFilter, setBankFilter] = useState<number | undefined>();
  const [current, setCurrent] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [publicBankLabels, setPublicBankLabels] = useState<Record<number, string>>(
    {},
  );
  const [records, setRecords] = useState<WrongQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadPublicBanks() {
      try {
        const data = await pagePublicBanks({ current: 1, pageSize: 100 });
        const labels: Record<number, string> = {};

        for (const bank of data?.records ?? []) {
          if (bank.id) {
            labels[bank.id] = bank.title ?? `题库 ${bank.id}`;
          }
        }

        if (!ignore) {
          setPublicBankLabels(labels);
        }
      } catch {
        // 筛选项降级为 ID 展示
      }
    }

    void loadPublicBanks();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadWrongQuestions() {
      setLoading(true);
      setError(null);

      try {
        const data = await pageWrongQuestions({
          bankId: bankFilter,
          current,
          pageSize: PAGE_SIZE,
        });

        if (!ignore) {
          setRecords(data?.records ?? []);
          setTotal(data?.total ?? 0);
          setLoading(false);
        }
      } catch (loadError) {
        if (!ignore) {
          setRecords([]);
          setTotal(0);
          setLoading(false);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "错题本加载失败，请稍后再试。",
          );
        }
      }
    }

    void loadWrongQuestions();

    return () => {
      ignore = true;
    };
  }, [bankFilter, current, reloadKey]);

  const bankOptions = useMemo(() => {
    const map = new Map<number, string>();

    Object.entries(publicBankLabels).forEach(([id, label]) => {
      map.set(Number(id), label);
    });

    for (const item of records) {
      if (item.questionBankId && !map.has(item.questionBankId)) {
        map.set(
          item.questionBankId,
          publicBankLabels[item.questionBankId] ?? `题库 ${item.questionBankId}`,
        );
      }
    }

    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((left, right) => left.label.localeCompare(right.label, "zh-CN"));
  }, [publicBankLabels, records]);

  async function handleRemove(id: number) {
    await removeWrongQuestion(id);
    setReloadKey((key) => key + 1);
  }

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-serif text-3xl font-semibold text-text-primary">
          错题本
        </h1>
        <p className="text-sm text-text-secondary">
          答错的题目会收录在此，可重刷巩固或移出。
        </p>
      </header>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-24 animate-pulse rounded-xl border bg-bg-surface"
              key={index}
            />
          ))}
        </div>
      ) : null}

      {!loading && error ? (
        <ErrorState
          message={error}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      ) : null}

      {!loading && !error && records.length === 0 ? (
        <EmptyState
          description="答错题目后会出现在这里，先去大厅刷题试试吧。"
          title="暂无错题"
        />
      ) : null}

      {!loading && !error && records.length > 0 ? (
        <>
          <WrongQuestionList
            bankFilter={bankFilter}
            bankOptions={bankOptions}
            onBankFilterChange={(nextBankId) => {
              setBankFilter(nextBankId);
              setCurrent(1);
            }}
            onRemove={handleRemove}
            records={records}
          />
          <PaginationBar
            current={current}
            itemLabel="道错题"
            onPageChange={setCurrent}
            pageSize={PAGE_SIZE}
            total={total}
          />
        </>
      ) : null}
    </section>
  );
}

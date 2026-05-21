import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { deleteBank, findMyBank, type QuestionBank } from "@/api/banks";
import { pageQuestionsInBank, type Question } from "@/api/questions";
import { BankFormDrawer } from "@/components/bank/BankFormDrawer";
import { DeleteBankDialog } from "@/components/bank/DeleteBankDialog";
import {
  DeleteQuestionDialog,
  deleteQuestionWithOptionalConfirm,
} from "@/components/question/DeleteQuestionDialog";
import { QuestionList } from "@/components/question/QuestionList";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PaginationBar } from "@/components/PaginationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAppToast } from "@/hooks/useAppToast";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { consumePageFlash } from "@/lib/pageFlash";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

export function BankDetailPage() {
  const { bankId } = useParams();
  const navigate = useNavigate();
  const numericBankId = Number(bankId);

  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [bankError, setBankError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebouncedValue(keyword, 300);
  const [current, setCurrent] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteBankOpen, setDeleteBankOpen] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const { error: showError, success } = useAppToast();

  useEffect(() => {
    const flash = consumePageFlash();
    if (flash) {
      success(flash);
    }
  }, [success]);

  useEffect(() => {
    setCurrent(1);
  }, [debouncedKeyword]);

  useEffect(() => {
    if (!Number.isFinite(numericBankId)) {
      setBankLoading(false);
      setBankError("题库 ID 不正确。");
      return;
    }

    let ignore = false;

    async function loadBank() {
      setBankLoading(true);
      setBankError(null);

      try {
        const result = await findMyBank(numericBankId);

        if (!ignore) {
          if (!result) {
            setBank(null);
            setBankError("题库不存在或无权访问。");
          } else {
            setBank(result);
          }
        }
      } catch (error) {
        if (!ignore) {
          setBankError(
            resolveApiErrorMessage(error, "题库信息加载失败。"),
          );
        }
      } finally {
        if (!ignore) {
          setBankLoading(false);
        }
      }
    }

    void loadBank();

    return () => {
      ignore = true;
    };
  }, [numericBankId, reloadKey]);

  useEffect(() => {
    if (!Number.isFinite(numericBankId) || bankError) {
      return;
    }

    let ignore = false;

    async function loadQuestions() {
      setListLoading(true);
      setListError(null);

      try {
        const data = await pageQuestionsInBank(numericBankId, {
          current,
          keyword: debouncedKeyword.trim() || undefined,
          pageSize: PAGE_SIZE,
        });

        if (!ignore) {
          setQuestions(data?.records ?? []);
          setTotal(data?.total ?? 0);
        }
      } catch (error) {
        if (!ignore) {
          setQuestions([]);
          setTotal(0);
          setListError(
            resolveApiErrorMessage(error, "试题列表加载失败。"),
          );
        }
      } finally {
        if (!ignore) {
          setListLoading(false);
        }
      }
    }

    void loadQuestions();

    return () => {
      ignore = true;
    };
  }, [bankError, current, debouncedKeyword, numericBankId, reloadKey]);

  function refreshAll() {
    setReloadKey((key) => key + 1);
  }

  async function handleDeleteQuestion(question: Question) {
    try {
      await deleteQuestionWithOptionalConfirm(
        question,
        () => {
          refreshAll();
          success("已删除");
        },
        setDeletingQuestion,
      );
    } catch (error) {
      showError(resolveApiErrorMessage(error, "删除失败，请重试。"));
    }
  }

  if (bankLoading) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="h-64 animate-pulse rounded-xl border bg-bg-surface" />
      </section>
    );
  }

  if (bankError || !bank) {
    return (
      <section className="mx-auto max-w-4xl space-y-4 px-6 py-10">
        <ErrorState message={bankError ?? "题库不存在。"} onRetry={refreshAll} />
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/app/manage/banks">返回管理题库</Link>
          </Button>
        </div>
      </section>
    );
  }

  const isPublic = bank.isPublic === 1;

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="space-y-4">
        <Button asChild size="sm" variant="ghost">
          <Link to="/app/manage/banks">← 返回管理题库</Link>
        </Button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  isPublic
                    ? "bg-brand-muted text-brand"
                    : "border text-text-secondary",
                )}
              >
                {isPublic ? "公开" : "私有"}
              </span>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-text-primary">
              {bank.title ?? "未命名题库"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              {bank.description || "暂无描述。"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={`/app/practice/${numericBankId}`}>开始刷题</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/app/manage/banks/${numericBankId}/import`}>AI 导入</Link>
            </Button>
            <Button onClick={() => setFormOpen(true)} variant="outline">
              编辑题库
            </Button>
            <Button
              onClick={() => setDeleteBankOpen(true)}
              variant="ghost"
            >
              删除题库
            </Button>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-text-primary">
              试题列表
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              共 {total} 条 · 支持题干关键词搜索
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={`/app/manage/banks/${numericBankId}/questions/new`}>
                添加题目
              </Link>
            </Button>
          </div>
        </div>

        <Input
          aria-label="搜索题干"
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索题干关键词…"
          value={keyword}
        />

        {listLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                className="h-20 animate-pulse rounded-xl border bg-bg-surface"
                key={index}
              />
            ))}
          </div>
        ) : null}

        {!listLoading && listError ? (
          <ErrorState
            message={listError}
            onRetry={() => setReloadKey((key) => key + 1)}
          />
        ) : null}

        {!listLoading && !listError && questions.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              description="可以手动添加题目，或使用 AI 导入批量录入。"
              title="还没有题目"
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to={`/app/manage/banks/${numericBankId}/questions/new`}>
                  添加题目
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/app/manage/banks/${numericBankId}/import`}>AI 导入</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {!listLoading && !listError && questions.length > 0 ? (
          <>
            <QuestionList
              bankId={numericBankId}
              onDelete={(question) => void handleDeleteQuestion(question)}
              questions={questions}
            />
            <PaginationBar
              ariaLabel="试题分页"
              current={current}
              itemLabel="条试题"
              onPageChange={setCurrent}
              pageSize={PAGE_SIZE}
              total={total}
            />
          </>
        ) : null}
      </section>

      <BankFormDrawer
        bank={bank}
        onOpenChange={setFormOpen}
        onSaved={() => {
          refreshAll();
          success("题库已更新");
        }}
        open={formOpen}
      />

      <DeleteBankDialog
        bank={bank}
        onDeleted={() => {
          success("已删除题库");
          navigate("/app/manage/banks");
        }}
        onOpenChange={setDeleteBankOpen}
        open={deleteBankOpen}
      />

      <DeleteQuestionDialog
        onDeleted={() => {
          refreshAll();
          success("已删除");
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingQuestion(null);
          }
        }}
        open={Boolean(deletingQuestion)}
        question={deletingQuestion}
      />
    </section>
  );
}

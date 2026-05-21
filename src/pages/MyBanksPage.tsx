import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { pageMyBanks, type QuestionBank } from "@/api/banks";
import { BankFormDrawer } from "@/components/bank/BankFormDrawer";
import { DeleteBankDialog } from "@/components/bank/DeleteBankDialog";
import { BankCard } from "@/components/BankCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PaginationBar } from "@/components/PaginationBar";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/useAppToast";
import { useResponsivePageSize } from "@/hooks/useResponsivePageSize";
import { resolveApiErrorMessage } from "@/lib/apiErrors";

type MyBanksState = {
  banks: QuestionBank[];
  total: number;
  loading: boolean;
  error: string | null;
};

export function MyBanksPage() {
  const navigate = useNavigate();
  const pageSize = useResponsivePageSize();
  const [current, setCurrent] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<MyBanksState>({
    banks: [],
    error: null,
    loading: true,
    total: 0,
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [deletingBank, setDeletingBank] = useState<QuestionBank | null>(null);
  const { success } = useAppToast();

  useEffect(() => {
    let ignore = false;

    async function loadBanks() {
      setState((prev) => ({ ...prev, error: null, loading: true }));

      try {
        const data = await pageMyBanks({ current, pageSize });

        if (!ignore) {
          setState({
            banks: data?.records ?? [],
            error: null,
            loading: false,
            total: data?.total ?? 0,
          });
        }
      } catch (error) {
        if (!ignore) {
          setState({
            banks: [],
            error: resolveApiErrorMessage(
              error,
              "我的题库加载失败，请稍后再试。",
            ),
            loading: false,
            total: 0,
          });
        }
      }
    }

    void loadBanks();

    return () => {
      ignore = true;
    };
  }, [current, pageSize, reloadKey]);

  function refreshList() {
    setReloadKey((key) => key + 1);
  }

  function openCreate() {
    setEditingBank(null);
    setFormOpen(true);
  }

  function openEdit(bank: QuestionBank) {
    setEditingBank(bank);
    setFormOpen(true);
  }

  function handleSaved(bankId?: number) {
    refreshList();
    success("保存成功");

    if (bankId) {
      navigate(`/app/manage/banks/${bankId}`);
    }
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-text-primary">
            管理题库
          </h1>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            创建、编辑公开或私有题库，并在详情中管理试题与 AI 导入。
          </p>
        </div>
        <Button onClick={openCreate}>新建题库</Button>
      </header>

      {state.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(pageSize, 6) }).map((_, index) => (
            <div
              className="min-h-56 animate-pulse rounded-xl border bg-bg-surface"
              key={index}
            />
          ))}
        </div>
      ) : null}

      {!state.loading && state.error ? (
        <ErrorState message={state.error} onRetry={refreshList} />
      ) : null}

      {!state.loading && !state.error && state.banks.length === 0 ? (
        <EmptyState
          description="点击「新建题库」创建第一个题库，随后可添加试题或开启 AI 导入。"
          title="还没有题库"
        />
      ) : null}

      {!state.loading && !state.error && state.banks.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {state.banks.map((bank) => (
              <BankCard
                bank={bank}
                key={bank.id ?? bank.title}
                onDelete={() => setDeletingBank(bank)}
                onEdit={() => openEdit(bank)}
                variant="owned"
              />
            ))}
          </div>
          <PaginationBar
            ariaLabel="管理题库分页"
            current={current}
            itemLabel="个题库"
            onPageChange={setCurrent}
            pageSize={pageSize}
            total={state.total}
          />
        </>
      ) : null}

      <BankFormDrawer
        bank={editingBank}
        onOpenChange={setFormOpen}
        onSaved={handleSaved}
        open={formOpen}
      />

      <DeleteBankDialog
        bank={deletingBank}
        onDeleted={() => {
          refreshList();
          success("已删除题库");
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingBank(null);
          }
        }}
        open={Boolean(deletingBank)}
      />
    </section>
  );
}

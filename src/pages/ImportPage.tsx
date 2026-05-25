import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { findMyBank } from "@/api/banks";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { ImportWizard } from "@/components/import/ImportWizard";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";

export function ImportPage() {
  const { bankId } = useParams();
  const [searchParams] = useSearchParams();
  const numericBankId = Number(bankId);
  const initialTaskId = searchParams.get("taskId");
  const [bankTitle, setBankTitle] = useState("题库");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(numericBankId)) {
      setError("题库 ID 不正确。");
      setLoading(false);
      return;
    }

    let ignore = false;

    async function loadBank() {
      setLoading(true);
      setError(null);

      try {
        const bank = await findMyBank(numericBankId);

        if (!ignore) {
          if (!bank) {
            setError("题库不存在或无权访问。");
          } else {
            setBankTitle(bank.title ?? "题库");
          }
        }
      } catch (loadError) {
        if (!ignore) {
          setError(resolveApiErrorMessage(loadError, "题库加载失败。"));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadBank();

    return () => {
      ignore = true;
    };
  }, [numericBankId]);

  if (loading) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="h-64 animate-pulse rounded-xl border bg-bg-surface" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-4xl space-y-4 px-6 py-10">
        <ErrorState message={error} />
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/app/manage/banks">返回管理题库</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 space-y-2">
        <Button asChild size="sm" variant="ghost">
          <Link to={`/app/manage/banks/${numericBankId}`}>← 返回题库详情</Link>
        </Button>
        <h1 className="font-serif text-3xl font-semibold text-text-primary">
          AI 智能导入
        </h1>
        <p className="text-sm text-text-secondary">
          为「{bankTitle}」上传文档，解析后预览确认再批量入库。
        </p>
      </header>

      <ImportWizard
        bankId={numericBankId}
        bankTitle={bankTitle}
        initialTaskId={initialTaskId}
      />
    </section>
  );
}

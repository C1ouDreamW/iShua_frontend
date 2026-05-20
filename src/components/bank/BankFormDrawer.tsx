import { useEffect, useState } from "react";
import { X } from "lucide-react";

import {
  createBank,
  updateBank,
  type QuestionBank,
  type QuestionBankCreatePayload,
} from "@/api/banks";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/useAppToast";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type BankFormDrawerProps = {
  open: boolean;
  bank?: QuestionBank | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (bankId?: number) => void;
};

type FormState = {
  title: string;
  description: string;
  isPublic: boolean;
};

function toFormState(bank?: QuestionBank | null): FormState {
  return {
    description: bank?.description ?? "",
    isPublic: bank?.isPublic === 1,
    title: bank?.title ?? "",
  };
}

function toPayload(form: FormState): QuestionBankCreatePayload {
  return {
    description: form.description.trim() || undefined,
    isPublic: form.isPublic ? 1 : 0,
    title: form.title.trim(),
  };
}

export function BankFormDrawer({
  open,
  bank,
  onOpenChange,
  onSaved,
}: BankFormDrawerProps) {
  const isEdit = Boolean(bank?.id);
  const [form, setForm] = useState<FormState>(() => toFormState(bank));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useAppToast();

  useEffect(() => {
    if (open) {
      setForm(toFormState(bank));
      setError(null);
    }
  }, [bank, open]);

  async function handleSave() {
    if (!form.title.trim()) {
      setError("请填写题库名称。");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = toPayload(form);

      if (isEdit && bank?.id) {
        await updateBank(bank.id, payload);
        onOpenChange(false);
        onSaved();
        return;
      }

      const bankId = await createBank(payload);
      onOpenChange(false);
      onSaved(bankId);
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.code === 403) {
          setError("当前账号无权限操作题库。");
          return;
        }

        if (caught.code === 404) {
          showError(caught.message || "题库不存在或已删除。");
          onOpenChange(false);
          onSaved();
          return;
        }
      }

      setError(resolveApiErrorMessage(caught, "保存失败，请重试。"));
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
        <button
          aria-label="关闭表单"
          className="absolute inset-0 bg-black/40"
          onClick={() => !saving && onOpenChange(false)}
          type="button"
        />
        <section
          aria-labelledby="bank-form-title"
          className="relative flex h-full w-full max-w-md flex-col border-l bg-bg-surface shadow-xl"
          role="dialog"
        >
          <header className="flex items-start justify-between gap-4 border-b px-6 py-5">
            <div>
              <h2
                className="font-serif text-xl font-semibold text-text-primary"
                id="bank-form-title"
              >
                {isEdit ? "编辑题库" : "新建题库"}
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {isEdit ? "更新题库信息后将同步到列表。" : "创建后可进入详情管理试题。"}
              </p>
            </div>
            <Button
              aria-label="关闭"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              size="icon"
              variant="ghost"
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </header>

          <form
            className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave();
            }}
          >
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-text-primary">
                题库名称 <span className="text-error">*</span>
              </span>
              <Input
                disabled={saving}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="例如：2026 计算机网络期末必刷"
                value={form.title}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-text-primary">题库描述</span>
              <textarea
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                disabled={saving}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="简要说明题库用途或适用人群"
                value={form.description}
              />
            </label>

            <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">公开题库</p>
                <p className="mt-1 text-xs text-text-secondary">
                  开启后出现在公开大厅，访客也可刷题。
                </p>
              </div>
              <button
                aria-checked={form.isPublic}
                className={cn(
                  "relative h-7 w-12 rounded-full transition-colors",
                  form.isPublic ? "bg-brand" : "bg-border",
                  saving && "opacity-50",
                )}
                disabled={saving}
                onClick={() =>
                  setForm((prev) => ({ ...prev, isPublic: !prev.isPublic }))
                }
                role="switch"
                type="button"
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform",
                    form.isPublic ? "left-[22px]" : "left-0.5",
                  )}
                />
              </button>
            </div>

            {error ? (
              <p className="text-sm text-error" role="alert">
                {error}
              </p>
            ) : null}
          </form>

          <footer className="flex gap-3 border-t px-6 py-4">
            <Button
              className="flex-1"
              disabled={saving}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              取消
            </Button>
            <Button
              className="flex-1"
              disabled={saving || !form.title.trim()}
              onClick={() => void handleSave()}
              type="button"
            >
              {saving ? "保存中…" : "保存"}
            </Button>
          </footer>
        </section>
      </div>
  );
}

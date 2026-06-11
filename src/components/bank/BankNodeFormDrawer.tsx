import { useEffect, useState } from "react";
import { X } from "lucide-react";

import {
  createBankNode,
  updateBankNode,
  type BankNode,
  type BankNodeCreatePayload,
  type BankNodeKind,
} from "@/api/bankNodes";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/useAppToast";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type BankNodeFormDrawerProps = {
  open: boolean;
  node?: BankNode | null;
  parentId?: number | null;
  fixedKind?: BankNodeKind;
  onOpenChange: (open: boolean) => void;
  onSaved: (nodeId?: number) => void;
};

type FormState = {
  nodeKind: BankNodeKind;
  title: string;
  description: string;
  isPublic: boolean;
};

function toFormState(
  node?: BankNode | null,
  defaultKind: BankNodeKind = "LEAF",
): FormState {
  return {
    description: node?.description ?? "",
    isPublic: node?.isPublic === 1,
    nodeKind:
      node?.nodeKind === "FOLDER" || node?.nodeKind === "LEAF"
        ? node.nodeKind
        : defaultKind,
    title: node?.title ?? "",
  };
}

function toCreatePayload(
  form: FormState,
  parentId?: number | null,
): BankNodeCreatePayload {
  return {
    description: form.description.trim() || undefined,
    isPublic: form.isPublic ? 1 : 0,
    nodeKind: form.nodeKind,
    parentId: parentId ?? undefined,
    title: form.title.trim(),
  };
}

export function BankNodeFormDrawer({
  open,
  node,
  parentId = null,
  fixedKind = "LEAF",
  onOpenChange,
  onSaved,
}: BankNodeFormDrawerProps) {
  const isEdit = Boolean(node?.id);
  const [form, setForm] = useState<FormState>(() =>
    toFormState(node, fixedKind),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { error: showError } = useAppToast();

  useEffect(() => {
    if (open) {
      setForm(toFormState(node, fixedKind));
      setError(null);
    }
  }, [fixedKind, node, open]);

  async function handleSave() {
    if (!form.title.trim()) {
      setError("请填写名称。");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEdit && node?.id) {
        await updateBankNode(node.id, {
          description: form.description.trim() || undefined,
          isPublic: form.isPublic ? 1 : 0,
          title: form.title.trim(),
        });
        onOpenChange(false);
        onSaved();
        return;
      }

      const nodeId = await createBankNode(toCreatePayload(form, parentId));
      onOpenChange(false);
      onSaved(nodeId);
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.code === 403) {
          setError("当前账号无权限操作题库。");
          return;
        }

        if (caught.code === 404) {
          showError(caught.message || "节点不存在或已删除。");
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

  const kindLabel = form.nodeKind === "FOLDER" ? "文件夹" : "题库";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="关闭表单"
        className="absolute inset-0 bg-black/40"
        onClick={() => !saving && onOpenChange(false)}
        type="button"
      />
      <section
        aria-labelledby="bank-node-form-title"
        className="relative flex h-full w-full max-w-md flex-col border-l bg-bg-surface shadow-xl"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b px-6 py-5">
          <div>
            <h2
              className="font-serif text-xl font-semibold text-text-primary"
              id="bank-node-form-title"
            >
              {isEdit ? `编辑${kindLabel}` : `新建${kindLabel}`}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {isEdit
                ? "更新节点信息后将同步到树结构。"
                : form.nodeKind === "FOLDER"
                  ? "文件夹用于组织子节点，不可直接录题。"
                  : "题库节点可录题、导入与刷题。"}
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
          {!isEdit ? (
            <p className="rounded-md border border-border bg-bg-sheet px-3 py-2 text-sm text-text-secondary">
              类型：
              <span className="ml-1 font-medium text-text-primary">
                {form.nodeKind === "FOLDER" ? "文件夹" : "题库"}
              </span>
            </p>
          ) : null}

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-text-primary">
              名称 <span className="text-error">*</span>
            </span>
            <Input
              disabled={saving}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder={
                form.nodeKind === "FOLDER"
                  ? "例如：高等数学"
                  : "例如：第一章 极限与连续"
              }
              value={form.title}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-text-primary">描述</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              disabled={saving}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="简要说明用途或适用人群"
              value={form.description}
            />
          </label>

          {form.nodeKind === "LEAF" || isEdit ? (
            <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text-primary">公开</p>
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
                disabled={saving || (isEdit && node?.nodeKind === "FOLDER")}
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
          ) : null}

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

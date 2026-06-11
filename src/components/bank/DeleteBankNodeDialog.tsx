import { useEffect, useState } from "react";

import { deleteBankNode, isFolderNode, type BankNode } from "@/api/bankNodes";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type DeleteBankNodeDialogProps = {
  node: BankNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
};

export function DeleteBankNodeDialog({
  node,
  open,
  onOpenChange,
  onDeleted,
}: DeleteBankNodeDialogProps) {
  const [confirmTitle, setConfirmTitle] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedTitle = node?.title ?? "";
  const isFolder = isFolderNode(node);

  useEffect(() => {
    if (open) {
      setConfirmTitle("");
      setError(null);
    }
  }, [node?.id, open]);

  const canDelete =
    confirmTitle.trim() === expectedTitle && Boolean(node?.id) && !deleting;

  async function handleDelete() {
    if (!node?.id || !canDelete) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteBankNode(node.id);
      onOpenChange(false);
      onDeleted();
    } catch (caught) {
      setError(resolveApiErrorMessage(caught, "删除失败，请重试。"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent showCloseButton={!deleting}>
        <DialogHeader>
          <DialogTitle>
            {isFolder ? "确认删除文件夹" : "确认删除题库"}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-left text-sm leading-6 text-text-secondary">
              <p>此操作不可恢复。</p>
              {isFolder ? (
                <p>
                  将<strong className="text-text-primary">同时删除所有子节点与题目</strong>
                  ，请谨慎操作。
                </p>
              ) : null}
              <p>
                请输入名称「
                <strong className="text-text-primary">{expectedTitle}</strong>
                」以确认。
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <Input
          aria-label="确认节点名称"
          disabled={deleting}
          onChange={(event) => setConfirmTitle(event.target.value)}
          placeholder={expectedTitle}
          value={confirmTitle}
        />
        {error ? (
          <p className="text-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            disabled={deleting}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            取消
          </Button>
          <Button
            disabled={!canDelete}
            onClick={() => void handleDelete()}
            variant="destructive"
          >
            {deleting ? "删除中…" : "删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

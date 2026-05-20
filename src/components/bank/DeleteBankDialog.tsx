import { useEffect, useState } from "react";

import { deleteBank, type QuestionBank } from "@/api/banks";
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

type DeleteBankDialogProps = {
  bank: QuestionBank | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
};

export function DeleteBankDialog({
  bank,
  open,
  onOpenChange,
  onDeleted,
}: DeleteBankDialogProps) {
  const [confirmTitle, setConfirmTitle] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expectedTitle = bank?.title ?? "";

  useEffect(() => {
    if (open) {
      setConfirmTitle("");
      setError(null);
    }
  }, [open, bank?.id]);

  const canDelete =
    confirmTitle.trim() === expectedTitle && Boolean(bank?.id) && !deleting;

  async function handleDelete() {
    if (!bank?.id || !canDelete) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteBank(bank.id);
      onOpenChange(false);
      onDeleted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "删除失败，请重试。");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent showCloseButton={!deleting}>
        <DialogHeader>
          <DialogTitle>确认删除题库</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-left text-sm leading-6 text-text-secondary">
              <p>此操作不可恢复。</p>
              <p>
                请输入题库名称「
                <strong className="text-text-primary">{expectedTitle}</strong>
                」以确认。
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <Input
          aria-label="确认题库名称"
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

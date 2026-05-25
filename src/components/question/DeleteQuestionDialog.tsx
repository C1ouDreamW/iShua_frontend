import { useState } from "react";

import { deleteQuestion, type Question } from "@/api/questions";
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

export const SKIP_DELETE_QUESTION_CONFIRM_KEY =
  "ishua_skip_delete_question_confirm";

export function shouldSkipDeleteQuestionConfirm() {
  try {
    return window.localStorage.getItem(SKIP_DELETE_QUESTION_CONFIRM_KEY) === "1";
  } catch {
    return false;
  }
}

type DeleteQuestionDialogProps = {
  question: Question | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
};

export function DeleteQuestionDialog({
  question,
  open,
  onOpenChange,
  onDeleted,
}: DeleteQuestionDialogProps) {
  const [skipNextTime, setSkipNextTime] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!question?.id) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      if (skipNextTime) {
        window.localStorage.setItem(SKIP_DELETE_QUESTION_CONFIRM_KEY, "1");
      }

      await deleteQuestion(question.id);
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
          <DialogTitle>删除这道题目？</DialogTitle>
          <DialogDescription>删除后不可恢复。</DialogDescription>
        </DialogHeader>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            checked={skipNextTime}
            disabled={deleting}
            onChange={(event) => setSkipNextTime(event.target.checked)}
            type="checkbox"
          />
          不再提示
        </label>
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
            disabled={deleting}
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

export async function deleteQuestionWithOptionalConfirm(
  question: Question,
  onDeleted: () => void,
  openDialog: (question: Question) => void,
) {
  if (shouldSkipDeleteQuestionConfirm() && question.id) {
    await deleteQuestion(question.id);
    onDeleted();
    return;
  }

  openDialog(question);
}

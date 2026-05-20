import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type RemoveWrongQuestionDialogProps = {
  open: boolean;
  stem?: string;
  removing?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function RemoveWrongQuestionDialog({
  open,
  stem,
  removing,
  onOpenChange,
  onConfirm,
}: RemoveWrongQuestionDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent showCloseButton={!removing}>
        <DialogHeader>
          <DialogTitle>移出错题？</DialogTitle>
          <DialogDescription>
            {stem
              ? `确定将「${stem.slice(0, 40)}${stem.length > 40 ? "…" : ""}」移出错题本吗？`
              : "移出后该题将不再出现在错题本中。"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={removing}
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            取消
          </Button>
          <Button disabled={removing} onClick={onConfirm} variant="destructive">
            {removing ? "移出中…" : "移出"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

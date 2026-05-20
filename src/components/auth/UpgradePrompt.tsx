import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/useAppToast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UPGRADE_CONTACT_EMAIL } from "@/lib/rbac";

type UpgradePromptProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UpgradePrompt({ open, onOpenChange }: UpgradePromptProps) {
  const { error, success } = useAppToast();

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(UPGRADE_CONTACT_EMAIL);
      success("已复制");
    } catch {
      error("复制失败，请手动复制邮箱");
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>需要高级权限</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 text-left text-sm leading-6 text-text-secondary">
                <p>
                  创建和管理题库、AI 导入题目等功能需要{" "}
                  <strong className="text-text-primary">PREMIUM</strong>{" "}
                  权限。请联系管理员开通。
                </p>
                <p>
                  联系邮箱：
                  <span className="font-medium text-text-primary">
                    {UPGRADE_CONTACT_EMAIL}
                  </span>
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button onClick={() => void copyEmail()} variant="outline">
              复制邮箱
            </Button>
            <Button onClick={() => onOpenChange(false)}>知道了</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  );
}

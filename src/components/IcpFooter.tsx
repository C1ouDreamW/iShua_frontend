import { cn } from "@/lib/utils";

export function IcpFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("py-3 text-center", className)}>
      <a
        className="text-xs text-text-muted transition-colors hover:text-text-secondary"
        href="https://beian.miit.gov.cn/"
        rel="noreferrer"
        target="_blank"
      >
        豫ICP备2025156751号-2
      </a>
    </footer>
  );
}

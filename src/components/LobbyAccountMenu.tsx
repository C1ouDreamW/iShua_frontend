import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LogOut, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LobbyAccountMenuProps = {
  displayName: string;
  onLogout: () => void;
};

export function LobbyAccountMenu({
  displayName,
  onLogout,
}: LobbyAccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <Button
        aria-expanded={open}
        aria-haspopup="menu"
        className="gap-1.5"
        onClick={() => setOpen((value) => !value)}
        variant="outline"
      >
        <span className="max-w-[8rem] truncate">{displayName}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 transition-transform", open && "rotate-180")}
        />
      </Button>

      {open ? (
        <div
          className="absolute right-0 z-20 mt-2 min-w-44 rounded-lg border bg-bg-surface py-1 shadow-lg"
          role="menu"
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-muted"
            disabled
            role="menuitem"
            type="button"
          >
            <User aria-hidden="true" className="size-4 shrink-0" />
            用户资料（即将推出）
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-brand-muted/60"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            role="menuitem"
            type="button"
          >
            <LogOut aria-hidden="true" className="size-4 shrink-0" />
            退出登录
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function LobbyAuthenticatedActions({
  displayName,
  onLogout,
}: LobbyAccountMenuProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button asChild>
        <Link to="/app/banks">进入学习</Link>
      </Button>
      <LobbyAccountMenu displayName={displayName} onLogout={onLogout} />
    </div>
  );
}

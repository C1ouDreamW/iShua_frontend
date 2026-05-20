import { Link, Outlet } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function AppShell() {
  return (
    <div className="min-h-screen bg-bg-canvas text-text-primary">
      <header className="border-b bg-bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link className="font-serif text-xl font-semibold text-brand" to="/">
            iShua
          </Link>
          <nav aria-label="主导航" className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to="/">发现</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/app/wrong-questions">错题本</Link>
            </Button>
            <Button asChild>
              <Link to="/app/banks">我的题库</Link>
            </Button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function AdminPlaceholderPage() {
  return (
    <section className="mx-auto flex max-w-lg flex-col items-center gap-6 px-6 py-16 text-center">
      <div
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-xl bg-brand-muted text-lg font-semibold text-brand/60"
      >
        刷
      </div>
      <div>
        <h1 className="font-serif text-3xl font-semibold text-text-primary">
          管理功能
        </h1>
        <p className="mt-3 text-sm leading-7 text-text-secondary">
          用户与权限管理功能开发中，敬请期待。
        </p>
      </div>
      <Button asChild variant="outline">
        <Link to="/app/wrong-questions">返回应用</Link>
      </Button>
    </section>
  );
}

import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function DiscoverPage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-brand">发现</p>
        <h1 className="font-serif text-3xl font-semibold text-text-primary">
          发现功能开发中
        </h1>
        <p className="max-w-xl text-sm leading-6 text-text-secondary">
          探索与推荐能力将在后续版本开放。日常刷题请从「题库」选择公开或私有题库开始练习。
        </p>
      </div>
      <Button asChild>
        <Link to="/app/banks">前往题库</Link>
      </Button>
    </section>
  );
}

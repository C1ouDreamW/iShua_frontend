import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

type PageStubProps = {
  title: string;
  description?: string;
};

export function PageStub({ title, description }: PageStubProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-brand">iShua</p>
        <h1 className="font-serif text-3xl font-semibold text-text-primary">
          {title}
        </h1>
        <p className="max-w-xl text-text-secondary">
          {description ?? "该页面已注册路由，后续阶段接入真实业务。"}
        </p>
      </div>
      <Button asChild>
        <Link to="/">返回大厅</Link>
      </Button>
    </main>
  );
}

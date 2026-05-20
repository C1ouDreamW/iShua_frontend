import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function HomePage() {
  return (
    <main className="min-h-screen bg-bg-canvas">
      <section className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-6 rounded-xl border bg-bg-surface p-8 shadow-sm">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-brand text-2xl font-semibold text-white">
                刷
              </div>
              <div>
                <h1 className="font-serif text-4xl font-semibold text-text-primary">
                  iShua
                </h1>
                <p className="mt-2 text-lg text-text-secondary">
                  一页一题，沉浸刷完
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-2" aria-label="访客导航">
              <Button asChild variant="ghost">
                <Link to="/login">登录</Link>
              </Button>
              <Button asChild>
                <Link to="/register">注册</Link>
              </Button>
            </nav>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              aria-label="搜索题库占位"
              placeholder="搜索公开题库（P1 接入）"
              readOnly
            />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">查看基建状态</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>P0 项目基建已就绪</DialogTitle>
                  <DialogDescription>
                    React Router、Tailwind token、shadcn Button/Input/Dialog
                    与 API client 骨架已接入。
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {["公开大厅", "访客刷题", "登录后业务"].map((title) => (
            <article
              className="rounded-xl border bg-bg-surface p-5 shadow-sm"
              key={title}
            >
              <h2 className="font-serif text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                P0 先提供路由与视觉基调，业务数据将在后续阶段接入。
              </p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

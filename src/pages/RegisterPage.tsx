import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { ApiError } from "@/api/client";
import { AuthForm } from "@/components/AuthForm";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { resolveApiErrorMessage } from "@/lib/apiErrors";

export function RegisterPage() {
  const { isAuthenticated, loading: authLoading, register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!authLoading && isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  async function handleRegister(values: {
    username: string;
    password: string;
    nickname: string;
  }) {
    setLoading(true);
    setError(null);

    try {
      await register({
        nickname: values.nickname || undefined,
        password: values.password,
        username: values.username,
      });
      navigate("/login", { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 409) {
        setError("用户名已被使用。");
      } else {
        setError(resolveApiErrorMessage(caught, "注册失败。"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <PageTransition className="w-full max-w-5xl">
      <section className="paper-panel grid w-full gap-8 p-6 md:grid-cols-[1fr_420px] md:p-8">
        <div className="flex min-h-72 flex-col justify-between rounded-lg border border-brand/20 bg-brand-muted p-8 shadow-paper">
          <div>
            <Button asChild variant="outline">
              <Link to="/">返回大厅</Link>
            </Button>
          </div>
          <div>
            <p className="text-sm font-medium text-brand">iShua</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold text-text-primary">
              今天，也刷一点
            </h1>
            <p className="mt-4 max-w-md leading-7 text-text-secondary">
              注册后默认获得 USER 权限，可在后续阶段同步错题与练习记录。
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-8 px-2 py-4">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-text-primary">
              注册
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              服务端会固定创建 USER 账号。
            </p>
          </div>
          <AuthForm
            error={error}
            loading={loading}
            mode="register"
            onSubmit={handleRegister}
          />
        </div>
      </section>
      </PageTransition>
    </main>
  );
}

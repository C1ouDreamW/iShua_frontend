import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { ApiError } from "@/api/client";
import { RoleFeatureCompare } from "@/components/auth/RoleFeatureCompare";
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
    email: string;
    code: string;
  }) {
    setLoading(true);
    setError(null);

    try {
      await register({
        code: values.code,
        email: values.email.trim(),
        nickname: values.nickname || undefined,
        password: values.password,
        username: values.username,
      });
      navigate("/login", { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 409) {
        setError(resolveApiErrorMessage(caught, "用户名或邮箱已被使用。"));
      } else {
        setError(resolveApiErrorMessage(caught, "注册失败。"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-3 py-8 sm:px-6 sm:py-12">
      <PageTransition className="w-full max-w-5xl">
        <section className="paper-panel grid w-full gap-6 p-4 sm:p-6 md:grid-cols-[1fr_420px] md:gap-8 md:p-8">
          <div className="flex flex-col justify-center gap-8 py-2 sm:px-2 sm:py-4 md:order-2">
            <div className="md:hidden">
              <Button asChild variant="outline">
                <Link to="/">返回大厅</Link>
              </Button>
            </div>
            <div>
              <h2 className="font-serif text-3xl font-semibold text-text-primary">
                注册
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                验证邮箱后即可创建普通用户账号。
              </p>
            </div>
            <AuthForm
              error={error}
              loading={loading}
              mode="register"
              onSubmit={handleRegister}
            />
          </div>

          <div className="flex flex-col gap-6 rounded-lg bg-brand p-6 text-white shadow-paper sm:min-h-72 sm:justify-between sm:p-8 md:order-1">
            <div className="hidden md:block">
              <Button asChild variant="secondary">
                <Link to="/">返回大厅</Link>
              </Button>
            </div>

            <RoleFeatureCompare className="order-2 md:order-none" tone="onBrand" />

            <div className="order-1 md:order-none">
              <h1 className="font-serif text-4xl font-semibold">
                今天，也刷一点
              </h1>
              <p className="mt-4 max-w-md leading-7 text-white/90">
                注册后即可使用公开题库，并同步错题与练习记录。
              </p>
            </div>
          </div>
        </section>
      </PageTransition>
    </main>
  );
}

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "@/api/client";
import { AuthForm } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

function getDefaultLanding(role: string | undefined) {
  return role === "PREMIUM" || role === "ADMIN" ? "/app/banks" : "/";
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(values: {
    username: string;
    password: string;
    nickname: string;
  }) {
    setLoading(true);
    setError(null);

    try {
      const result = await login({
        password: values.password,
        username: values.username,
      });
      const redirect = searchParams.get("redirect");
      navigate(redirect || getDefaultLanding(result.role), { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 401) {
        setError("用户名或密码错误。");
      } else {
        setError(caught instanceof Error ? caught.message : "登录失败。");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-canvas px-6 py-12">
      <section className="grid w-full max-w-5xl gap-8 rounded-3xl border bg-bg-surface p-6 shadow-sm md:grid-cols-[1fr_420px] md:p-8">
        <div className="flex min-h-72 flex-col justify-between rounded-2xl bg-brand p-8 text-white">
          <div>
            <Button asChild variant="secondary">
              <Link to="/">返回大厅</Link>
            </Button>
          </div>
          <div>
            <p className="text-sm opacity-80">iShua</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold">
              今天，也刷一点
            </h1>
            <p className="mt-4 max-w-md leading-7 opacity-90">
              登录后可以同步练习记录，并在后续阶段使用错题本。
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-8 px-2 py-4">
          <div>
            <h2 className="font-serif text-3xl font-semibold text-text-primary">
              登录
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              使用账号密码进入 iShua。
            </p>
          </div>
          <AuthForm
            error={error}
            loading={loading}
            mode="login"
            onSubmit={handleLogin}
          />
        </div>
      </section>
    </main>
  );
}

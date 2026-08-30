import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { ApiError } from "@/api/client";
import { AuthForm } from "@/components/AuthForm";
import { PageTransition } from "@/components/motion/PageTransition";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/useAppToast";
import { useAuth } from "@/hooks/useAuth";
import { resolveApiErrorMessage } from "@/lib/apiErrors";
import { consumeAuthFlash } from "@/lib/authFlash";
import { sanitizeRedirect } from "@/lib/navigation";

function getDefaultLanding() {
  return "/app/banks";
}

export function LoginPage() {
  const { isAuthenticated, loading: authLoading, login, user } = useAuth();
  const { error: showToastError } = useAppToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const flash = consumeAuthFlash();
    if (flash) {
      showToastError(flash, 4000);
    }
  }, [showToastError]);

  if (!authLoading && isAuthenticated) {
    const redirect = sanitizeRedirect(searchParams.get("redirect"));
    return (
      <Navigate
        replace
        to={redirect || getDefaultLanding()}
      />
    );
  }

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
      const redirect = sanitizeRedirect(searchParams.get("redirect"));
      navigate(redirect || getDefaultLanding(), { replace: true });
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 401) {
        setError("用户名或密码错误。");
      } else {
        setError(resolveApiErrorMessage(caught, "登录失败。"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <PageTransition className="w-full max-w-5xl">
      <section className="paper-panel grid w-full grid-cols-1 gap-8 p-6 md:grid-cols-[1fr_420px] md:p-8">
        <div className="flex flex-col gap-6 rounded-lg bg-brand p-6 text-white shadow-paper sm:min-h-72 sm:justify-between sm:p-8">
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
      </PageTransition>
    </main>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { sendRegisterEmailCode } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveApiErrorMessage } from "@/lib/apiErrors";

const REGISTER_EMAIL_CODE_COOLDOWN_SECONDS = 60;

type AuthFormValues = {
  username: string;
  password: string;
  nickname: string;
  email: string;
  code: string;
};

type AuthFormProps = {
  mode: "login" | "register";
  error: string | null;
  loading: boolean;
  onSubmit: (values: AuthFormValues) => Promise<void>;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function AuthForm({ mode, error, loading, onSubmit }: AuthFormProps) {
  const [values, setValues] = useState<AuthFormValues>({
    code: "",
    email: "",
    nickname: "",
    password: "",
    username: "",
  });
  const [codeError, setCodeError] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const isLogin = mode === "login";

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function handleSendCode() {
    const email = values.email.trim();

    if (!email) {
      setCodeError("请先填写邮箱。");
      return;
    }

    if (!isValidEmail(email)) {
      setCodeError("邮箱格式不正确。");
      return;
    }

    setSendingCode(true);
    setCodeError(null);

    try {
      await sendRegisterEmailCode({ email });
      setCooldown(REGISTER_EMAIL_CODE_COOLDOWN_SECONDS);
    } catch (caught) {
      setCodeError(resolveApiErrorMessage(caught, "验证码发送失败，请稍后重试。"));
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(values);
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary" htmlFor="username">
          用户名
        </label>
        <Input
          autoComplete="username"
          disabled={loading}
          id="username"
          minLength={3}
          maxLength={64}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, username: event.target.value }))
          }
          placeholder="请输入用户名"
          required
          value={values.username}
        />
      </div>

      {!isLogin ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-primary" htmlFor="email">
            邮箱
          </label>
          <Input
            autoComplete="email"
            disabled={loading}
            id="email"
            maxLength={254}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, email: event.target.value }))
            }
            placeholder="请输入邮箱"
            required
            type="email"
            value={values.email}
          />
        </div>
      ) : null}

      {!isLogin ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-primary" htmlFor="code">
            验证码
          </label>
          <div className="flex gap-2">
            <Input
              autoComplete="one-time-code"
              className="min-w-0 flex-1"
              disabled={loading}
              id="code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  code: event.target.value.replace(/\D/g, ""),
                }))
              }
              placeholder="6 位数字"
              required
              value={values.code}
            />
            <Button
              className="shrink-0"
              disabled={loading || sendingCode || cooldown > 0}
              onClick={() => void handleSendCode()}
              type="button"
              variant="outline"
            >
              {sendingCode
                ? "发送中..."
                : cooldown > 0
                  ? `${cooldown}s`
                  : "发送验证码"}
            </Button>
          </div>
          {codeError ? (
            <p className="text-sm text-error">{codeError}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary" htmlFor="password">
          密码
        </label>
        <Input
          autoComplete={isLogin ? "current-password" : "new-password"}
          disabled={loading}
          id="password"
          minLength={6}
          maxLength={64}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, password: event.target.value }))
          }
          placeholder="请输入密码"
          required
          type="password"
          value={values.password}
        />
      </div>

      {!isLogin ? (
        <div className="flex flex-col gap-2">
          <label
            className="text-sm font-medium text-text-primary"
            htmlFor="nickname"
          >
            昵称
          </label>
          <Input
            autoComplete="nickname"
            disabled={loading}
            id="nickname"
            maxLength={64}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, nickname: event.target.value }))
            }
            placeholder="可选"
            value={values.nickname}
          />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error">
          {error}
        </p>
      ) : null}

      <Button disabled={loading} type="submit">
        {loading ? "请稍候..." : isLogin ? "登录" : "注册"}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        {isLogin ? "还没有账号？" : "已有账号？"}
        <Link
          className="ml-1 text-brand underline-offset-4 hover:underline"
          to={isLogin ? "/register" : "/login"}
        >
          {isLogin ? "去注册" : "去登录"}
        </Link>
      </p>
    </form>
  );
}

import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthFormValues = {
  username: string;
  password: string;
  nickname: string;
};

type AuthFormProps = {
  mode: "login" | "register";
  error: string | null;
  loading: boolean;
  onSubmit: (values: AuthFormValues) => Promise<void>;
};

export function AuthForm({ mode, error, loading, onSubmit }: AuthFormProps) {
  const [values, setValues] = useState<AuthFormValues>({
    nickname: "",
    password: "",
    username: "",
  });
  const isLogin = mode === "login";

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

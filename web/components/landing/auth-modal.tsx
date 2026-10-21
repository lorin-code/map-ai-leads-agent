"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

type AuthEntryProps = {
  children: ReactNode;
  className: string;
  ariaLabel?: string;
};

function TargetIcon() {
  return (
    <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2.4" />
      <path d="M12 3.8v3" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
      <path d="M12 17.2v3" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
      <path d="M3.8 12h3" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
      <path d="M17.2 12h3" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <rect height="14" rx="2.6" stroke="currentColor" strokeWidth="2" width="18" x="3" y="5" />
      <path d="m4.8 7.6 6.1 5.2c.7.6 1.5.6 2.2 0l6.1-5.2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <rect height="10" rx="2.4" stroke="currentColor" strokeWidth="2" width="16" x="4" y="10" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M20.2 4.6 10.8 14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      <path d="m20.2 4.6-5.9 16-3.5-6.6-6.6-3.5 16-5.9Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

export function AuthEntry({ children, className, ariaLabel }: AuthEntryProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const show = () => {
    setOpen(true);
    window.requestAnimationFrame(() => setVisible(true));
  };

  const close = () => {
    setVisible(false);
    window.setTimeout(() => setOpen(false), 300);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("请输入账号和密码");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(String(payload.error || "登录失败，请检查账号和密码"));
        return;
      }

      window.localStorage.setItem("aimapleads:landing-auth", payload.user?.username || username.trim());
      router.push("/app");
    } catch {
      setError("无法连接服务器，请确认本地服务已启动");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button aria-label={ariaLabel} className={className} onClick={show} type="button">
        {children}
      </button>
      {mounted && open
        ? createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto px-4 py-8">
          <button
            aria-label="关闭登录弹窗"
            className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
            onClick={close}
            type="button"
          />
          <div
            className={`relative my-auto w-[90%] max-w-md rounded-[32px] border border-white bg-white/95 p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] backdrop-blur-3xl transition-all duration-300 sm:p-12 ${
              visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <button
              aria-label="关闭"
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl font-normal leading-none text-slate-600 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
              onClick={close}
              type="button"
            >
              ×
            </button>
            <div className="mb-10 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-900 text-white shadow-xl shadow-slate-200 transition-transform duration-500 hover:rotate-6">
                <TargetIcon />
              </div>
              <h3 className="mb-2 text-2xl font-black tracking-tight text-slate-900">开启智能获客</h3>
              <p className="px-4 text-sm font-medium text-slate-400">登录以同步您的查找历史并解锁高效筛选功能</p>
            </div>
            <form className="space-y-5" onSubmit={submit}>
              <label className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 focus-within:border-indigo-400 focus-within:bg-white focus-within:text-indigo-600 focus-within:ring-4 focus-within:ring-indigo-50">
                <MailIcon />
                <span className="sr-only">输入账号</span>
                <input
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-slate-900 outline-none placeholder:text-slate-500"
                  autoComplete="username"
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="邮箱或手机号"
                  type="text"
                  value={username}
                />
              </label>
              <label className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 focus-within:border-indigo-400 focus-within:bg-white focus-within:text-indigo-600 focus-within:ring-4 focus-within:ring-indigo-50">
                <LockIcon />
                <span className="sr-only">输入密码</span>
                <input
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-slate-900 outline-none placeholder:text-slate-500"
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="密码"
                  type="password"
                  value={password}
                />
              </label>
              {error ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">{error}</p>
              ) : (
                <p className="px-1 text-xs font-medium leading-5 text-slate-400">首次使用该账号会自动创建工作台账户。</p>
              )}
              <button
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-4 text-[15px] font-bold text-white shadow-[0_8px_20px_-4px_rgba(79,70,229,0.4)] transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-[0_12px_25px_-4px_rgba(79,70,229,0.5)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                disabled={busy}
                type="submit"
              >
                {busy ? "登录中" : "账号密码登录"} <SendIcon />
              </button>
            </form>
            <div className="mt-10 text-center text-xs font-medium leading-relaxed text-slate-400">
              继续操作即表示您同意我们的
              <br />
              <Link className="font-bold text-indigo-600 transition-colors hover:text-indigo-700" href="/terms">服务条款</Link>
              <span className="mx-2">与</span>
              <Link className="font-bold text-indigo-600 transition-colors hover:text-indigo-700" href="/privacy">隐私政策</Link>
            </div>
          </div>
        </div>,
          document.body,
        )
        : null}
    </>
  );
}

import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[color:var(--accent-deep)]">
        404
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]">
        页面不存在
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-[color:var(--muted)]">
        你访问的页面不存在，可能已经被移动或删除。可以返回首页或直接进入工作台继续操作。
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent-deep)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[color:var(--accent)]"
          href="/"
        >
          返回首页
        </Link>
        <Link
          className="inline-flex items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-6 py-3 text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
          href="/app"
        >
          进入工作台
        </Link>
      </div>
    </main>
  );
}

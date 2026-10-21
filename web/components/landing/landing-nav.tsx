"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthEntry } from "./auth-modal";
import { SparkIcon } from "./landing-icons";

type LandingNavProps = {
  active?: "home" | "features" | "pricing" | "blog" | "contact" | "faq";
};

const navItems = [
  { label: "首页", href: "/", key: "home" },
  { label: "功能介绍", href: "/features", key: "features" },
  { label: "价格方案", href: "/pricing", key: "pricing" },
  { label: "博客洞察", href: "/blog", key: "blog" },
  { label: "联系我们", href: "/contact", key: "contact" },
  { label: "常见问题", href: "/faq", key: "faq" },
];

export function LandingNav({ active }: LandingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrolled = () => {
      setScrolled(window.scrollY > 24);
    };

    updateScrolled();
    window.addEventListener("scroll", updateScrolled, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolled);
  }, []);

  return (
    <nav
      className={`landing-nav fixed left-1/2 z-50 w-[92%] max-w-6xl -translate-x-1/2 transition-all duration-500 ${
        scrolled ? "top-2 sm:top-3" : "top-4 sm:top-6"
      }`}
    >
      <div className={`nav-capsule flex items-center justify-between rounded-full px-2 py-2 ${scrolled ? "is-scrolled" : ""}`}>
        <Link className="flex min-w-0 items-center space-x-2 pl-3 sm:space-x-3 sm:pl-4" href="/">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
            <SparkIcon />
          </div>
          <span className="truncate text-[15px] font-extrabold tracking-tight text-slate-800 sm:text-[17px]">
            AI 线索助手
          </span>
        </Link>
        <div className="hidden items-center space-x-5 text-[13px] font-semibold text-slate-500 lg:flex xl:space-x-6 xl:text-[14px]">
          {navItems.map((item) => {
            const isActive = Boolean(item.key && item.key === active);
            return (
              <Link
                className={`${isActive ? "font-bold text-indigo-600" : "hover:text-indigo-600"} transition-colors`}
                href={item.href}
                key={item.label}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center space-x-2">
          <AuthEntry className="hidden px-4 text-[14px] font-semibold text-slate-600 transition-colors hover:text-indigo-600 sm:block">
            工作台登录
          </AuthEntry>
          <AuthEntry className="rounded-full bg-indigo-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-200 sm:px-6 sm:text-[14px]">
            免费试用
          </AuthEntry>
          <button
            aria-expanded={mobileMenuOpen}
            aria-label="打开导航菜单"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 lg:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            type="button"
          >
            <span className="flex flex-col gap-1.5">
              <span className={`h-0.5 w-4 rounded-full bg-current transition ${mobileMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-4 rounded-full bg-current transition ${mobileMenuOpen ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-4 rounded-full bg-current transition ${mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>
      {mobileMenuOpen ? (
        <div className="mt-3 rounded-[1.5rem] border border-white/80 bg-white/92 p-2 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-2xl lg:hidden">
          <div className="grid gap-1">
            {navItems.map((item) => {
              const isActive = Boolean(item.key && item.key === active);
              return (
                <Link
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition ${
                    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                  }`}
                  href={item.href}
                  key={item.label}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <AuthEntry className="mt-2 flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 sm:hidden">
            工作台登录
          </AuthEntry>
        </div>
      ) : null}
    </nav>
  );
}

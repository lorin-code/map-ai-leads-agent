import Link from "next/link";

import { SparkIcon } from "./landing-icons";

const footerLinks = [
  { label: "功能介绍", href: "/features" },
  { label: "价格方案", href: "/pricing" },
  { label: "博客洞察", href: "/blog" },
  { label: "联系我们", href: "/contact" },
  { label: "常见问题", href: "/faq" },
  { label: "服务协议", href: "/terms" },
  { label: "隐私政策", href: "/privacy" },
];

export function LandingFooter() {
  return (
    <footer className="relative z-10 mt-10 border-t border-slate-200/60 bg-white/50 px-6 py-12 text-center backdrop-blur-md sm:text-left">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-sm md:flex-row">
        <Link className="flex items-center space-x-2" href="/">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-800 text-white shadow-sm">
            <SparkIcon className="landing-icon h-3 w-3" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-800">AI 线索助手</span>
        </Link>
        <div className="font-normal text-slate-500">
          © 2026 AI 线索助手 <span className="mx-2 text-slate-300">|</span> 基于高德地图公开数据
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 font-medium text-slate-500">
          {footerLinks.map((link) => (
            <Link className="transition-colors hover:text-slate-900" href={link.href} key={link.label}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

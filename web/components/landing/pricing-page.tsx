import Link from "next/link";

import { AuthEntry } from "./auth-modal";
import { ArrowIcon, CheckIcon, ExportIcon, SearchIcon, SparkIcon } from "./landing-icons";
import { LandingFooter } from "./landing-footer";
import { LandingNav } from "./landing-nav";
import { ScrollEffects } from "./scroll-effects";

const plans = [
  {
    name: "基础版",
    price: "¥0",
    suffix: "/ 永久免费",
    desc: "适合先验证工作流，用真实需求体验自然语言查找、多轮筛选和导出。",
    cta: "免费开始",
    tone: "light",
    items: ["每日免费查找额度", "支持多轮对话筛选", "支持 CSV / JSON 导出", "查找记录自动保存"],
  },
  {
    name: "专业版",
    price: "¥99",
    suffix: "/ 月",
    desc: "适合持续使用本地线索查找，把结果整理、筛选和导出纳入日常工作。",
    cta: "升级专业版",
    tone: "featured",
    items: ["更高查找额度", "更高导出额度", "历史查找记录保留", "适合个人或小团队使用"],
  },
  {
    name: "团队版",
    price: "定制",
    suffix: "",
    desc: "适合多人协作、额度共享或需要确认行业场景和支持方式的团队。",
    cta: "联系咨询",
    tone: "light",
    items: ["团队席位与额度共享", "按业务场景评估额度", "使用支持与问题排查", "适合销售或招商团队"],
  },
];

const usageNotes = [
  {
    title: "先用真实需求试一次",
    desc: "直接说出想找的行业、区域和筛选条件，更容易判断结果是否适合您的业务。",
    icon: SearchIcon,
  },
  {
    title: "结果可继续筛选",
    desc: "查到名单后，可以继续补充只看有电话、换个区域、下载当前名单等操作。",
    icon: SparkIcon,
  },
  {
    title: "导出前可先确认字段",
    desc: "名单会聚焦名称、类型、区域、地址、电话、网站和评分等跟进信息。",
    icon: ExportIcon,
  },
];

const pricingFaqs = [
  ["免费版可以做什么？", "可以体验核心查找流程，包括自然语言发起查找、多轮筛选、查看结果和导出。"],
  ["专业版适合谁？", "适合需要持续查找和导出本地线索的个人或小团队，重点是提升日常查找效率。"],
  ["团队版怎么确认？", "如果涉及多人使用、额度共享或更具体的行业场景，可以通过联系页面说明需求后再确认方案。"],
  ["价格会影响数据字段吗？", "页面展示和导出字段保持一致。不同方案主要区别在额度、使用规模和支持方式。"],
];

export function PricingPage() {
  return (
    <main className="index-landing relative min-h-screen">
      <ScrollEffects />
      <div className="mesh-bg">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>

      <LandingNav active="pricing" />

      <section className="relative overflow-hidden px-4 pb-16 pt-40 sm:px-6">
        <div className="bg-grid-pattern" />
        <div className="mx-auto max-w-5xl text-center">
          <div className="reveal active inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            价格方案
          </div>
          <h1 className="reveal active mt-7 text-4xl font-black leading-[1.08] tracking-tighter text-slate-900 sm:text-5xl md:text-6xl">
            先试用，再按
            <br />
            <span className="text-gradient">查找强度升级</span>
          </h1>
          <p className="reveal active mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-500">
            从一次真实查找开始，确认线索质量、字段和导出方式后，再选择适合个人或团队的使用方案。
          </p>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan, index) => {
            const featured = plan.tone === "featured";
            return (
              <article
                className={`glass-card reveal delay-${Math.min(index, 2) * 100} relative flex flex-col overflow-hidden p-7 sm:p-8 ${
                  featured ? "border-indigo-200 bg-white/90 shadow-[0_24px_80px_rgba(79,70,229,0.16)] lg:-translate-y-4" : "bg-white/78"
                }`}
                key={plan.name}
              >
                {featured ? (
                  <div className="absolute right-0 top-0 rounded-bl-2xl bg-indigo-600 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                    常用
                  </div>
                ) : null}
                <div className={featured ? "text-sm font-extrabold text-indigo-600" : "text-sm font-extrabold text-slate-500"}>{plan.name}</div>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight text-slate-900">{plan.price}</span>
                  {plan.suffix ? <span className="pb-1 text-sm font-semibold text-slate-500">{plan.suffix}</span> : null}
                </div>
                <p className="mt-5 text-sm font-medium leading-7 text-slate-500">{plan.desc}</p>
                <ul className="mt-7 flex-1 space-y-4">
                  {plan.items.map((item) => (
                    <li className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-700" key={item}>
                      <CheckIcon className={`landing-icon mt-1 h-4 w-4 shrink-0 ${featured ? "text-indigo-600" : "text-green-600"}`} />
                      {item}
                    </li>
                  ))}
                </ul>
                <AuthEntry
                  className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all hover:-translate-y-1 ${
                    featured
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"
                      : "border border-slate-200 bg-white/85 text-slate-700 shadow-sm hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  {plan.cta} <ArrowIcon />
                </AuthEntry>
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="reveal">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">How to Choose</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">怎么选更合适</h2>
            <p className="mt-5 text-base leading-8 text-slate-500">
              价格方案不需要先猜。建议先跑一次您真实关心的区域和行业，看结果是否能支持后续跟进，再决定是否升级。
            </p>
            <Link
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:text-indigo-600"
              href="/contact"
            >
              联系我们 <ArrowIcon />
            </Link>
          </div>
          <div className="grid gap-4">
            {usageNotes.map((note, index) => {
              const Icon = note.icon;
              return (
                <article className={`glass-card reveal delay-${Math.min(index, 2) * 100} bg-white/78 p-5`} key={note.title}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-indigo-600 shadow-sm">
                      <Icon className="landing-icon h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{note.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-500">{note.desc}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center reveal">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">Pricing FAQ</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">价格常见问题</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {pricingFaqs.map(([question, answer], index) => (
              <article className={`glass-card reveal delay-${Math.min(index, 3) * 100} bg-white/75 p-6`} key={question}>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-indigo-600 shadow-sm">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900 p-10 text-center reveal md:p-16">
          <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">从免费试用开始</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            用一句真实需求测试查找、筛选和导出流程，再决定是否升级到更适合的方案。
          </p>
          <AuthEntry className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-bold text-slate-900 shadow-lg transition-all hover:-translate-y-1 hover:bg-slate-100">
            进入工作台 <ArrowIcon />
          </AuthEntry>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}

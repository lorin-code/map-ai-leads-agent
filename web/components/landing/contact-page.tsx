import Link from "next/link";

import { AuthEntry } from "./auth-modal";
import { ArrowIcon, CheckIcon, ExportIcon, SearchIcon, SparkIcon } from "./landing-icons";
import { LandingFooter } from "./landing-footer";
import { LandingNav } from "./landing-nav";
import { ScrollEffects } from "./scroll-effects";

const contactCards = [
  {
    title: "产品咨询",
    desc: "想确认系统是否适合您的行业、城市范围或线索采集方式，可以先描述目标线索场景。",
    value: "适合评估试用前需求",
    icon: SearchIcon,
  },
  {
    title: "数据与导出",
    desc: "如果您关心可导出字段、CSV / JSON 格式、中文编码或历史任务保存方式，可以在这里集中确认。",
    value: "适合确认交付口径",
    icon: ExportIcon,
  },
  {
    title: "使用支持",
    desc: "遇到任务长时间执行、会话结果显示异常、二次筛选不符合预期时，请带上查找条件和时间。",
    value: "适合排查具体问题",
    icon: SparkIcon,
  },
];

const supportNotes = ["请尽量提供城市、区域、行业和筛选条件", "如涉及任务问题，请附上大致执行时间", "不要在消息中提交无关敏感个人信息"];

const contactMethods = [
  {
    label: "邮箱",
    title: "hello@aimapleads.com",
    desc: "适合产品咨询、合作沟通和账号相关问题。",
    href: "mailto:hello@aimapleads.com",
    marker: "@",
  },
  {
    label: "X",
    title: "@aimapleads",
    desc: "适合关注产品更新、反馈建议或发送公开消息。",
    href: "https://x.com/aimapleads",
    marker: "𝕏",
  },
  {
    label: "FAQ",
    title: "联系前常见问题",
    desc: "先了解回复时间、需要提供的信息和适合咨询的问题。",
    href: "#contact-faq",
    marker: "?",
  },
];

const contactFaqs = [
  ["我们多久会回复？", "通常会在 1 个工作日内回复邮件。涉及具体任务排查时，如果需要核对日志或会话记录，可能需要更长时间。"],
  ["联系时需要提供什么？", "请尽量提供城市、区域、行业、筛选条件和大致执行时间。如果是页面显示问题，可以附上截图或描述看到的状态。"],
  ["哪些问题适合发邮件？", "产品咨询、数据字段确认、导出问题、账号相关问题、合作沟通，以及需要附带较多上下文的任务排查都适合邮件沟通。"],
  ["X 更适合用来做什么？", "X 更适合关注产品更新、提交轻量反馈或公开交流。涉及账号、任务记录或较具体的问题，建议优先使用邮箱。"],
];

export function ContactPage() {
  return (
    <main className="index-landing relative min-h-screen">
      <ScrollEffects />
      <div className="mesh-bg">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>

      <LandingNav active="contact" />

      <section className="relative overflow-hidden px-4 pb-20 pt-40 sm:px-6">
        <div className="bg-grid-pattern" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="reveal active relative z-10">
            <div className="mb-6 inline-flex items-center space-x-2 rounded-full border border-slate-200/60 bg-white/80 px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm backdrop-blur-md">
              <SparkIcon className="landing-icon text-indigo-500" />
              <span>联系与支持</span>
            </div>
            <h1 className="text-4xl font-black leading-[1.1] tracking-tighter text-slate-900 sm:text-5xl md:text-6xl">
              告诉我们您的
              <br />
              <span className="text-gradient">线索查找需求</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-slate-500">
              无论是试用前确认字段、评估行业适配，还是排查一次具体查找任务，都可以从这里开始。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <AuthEntry className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-slate-800">
                进入工作台 <ArrowIcon />
              </AuthEntry>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 px-7 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:text-indigo-600"
                href="/features"
              >
                查看功能说明
              </Link>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {contactMethods.map((method) => (
                <Link
                  className="group rounded-2xl border border-slate-200 bg-white/75 p-4 text-left shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:border-indigo-200 hover:bg-white"
                  href={method.href}
                  key={method.label}
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{method.label}</span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                      {method.marker}
                    </span>
                  </div>
                  <div className="truncate text-[13px] font-extrabold leading-5 text-slate-900">{method.title}</div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{method.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="glass-card reveal delay-100 relative z-10 overflow-hidden bg-white/80 p-6 sm:p-8">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-indigo-100/70 blur-[48px]" />
            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">Contact Brief</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">先留下关键背景</h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
                  <SearchIcon className="landing-icon h-5 w-5" />
                </div>
              </div>
              <div className="grid gap-4">
                {["您的目标行业，例如：餐饮招商、新能源车销售", "目标区域，例如：上海浦东新区", "需要的字段或筛选，例如：只看有电话、导出 Excel"].map((placeholder) => (
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 text-sm font-medium text-slate-400 shadow-sm" key={placeholder}>
                    {placeholder}
                  </div>
                ))}
                <div className="min-h-32 rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-sm font-medium leading-6 text-slate-400 shadow-sm">
                  简要描述您希望系统帮您完成的查找或当前遇到的问题。
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-sm font-bold text-indigo-700">
                <span>当前页面为联系入口展示，实际提交可从工作台继续。</span>
                <CheckIcon className="landing-icon h-5 w-5 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 md:grid-cols-3">
            {contactCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <article className={`glass-card reveal delay-${Math.min(index, 2) * 100} bg-white/75 p-7`} key={card.title}>
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-indigo-600 shadow-sm">
                    <Icon className="landing-icon h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{card.desc}</p>
                  <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-bold text-slate-500">{card.value}</div>
                </article>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.82fr]">
            <div className="glass-card reveal bg-white/75 p-7 sm:p-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">提交问题时，请带上这些信息</h2>
              <div className="mt-6 grid gap-3">
                {supportNotes.map((note) => (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm" key={note}>
                    <CheckIcon className="landing-icon h-4 w-4 text-green-600" />
                    {note}
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card reveal delay-100 overflow-hidden border border-indigo-100 bg-white/80 p-7 text-slate-900 sm:p-8">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-indigo-100/80 blur-[42px]" />
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">Next Step</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight">先用真实需求跑一次</h2>
                <p className="mt-4 text-sm font-medium leading-7 text-slate-500">
                如果您还没有具体问题，建议直接进入工作台，用城市、区域和行业发起一次查找。任务、对话和结果会保存，后续更容易定位需求。
                </p>
                <AuthEntry className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1 hover:bg-indigo-700">
                  开始试用 <ArrowIcon />
                </AuthEntry>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.82fr_1fr]" id="contact-faq">
            <div className="glass-card reveal bg-white/75 p-7 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">Contact FAQ</p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">联系前常见问题</h2>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                这里回答的是联系和支持相关的问题。产品功能、数据来源和导出字段可以查看完整 FAQ。
              </p>
              <Link className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:text-indigo-600" href="/faq">
                查看产品 FAQ <ArrowIcon />
              </Link>
            </div>
            <div className="grid gap-4">
              {contactFaqs.map(([question, answer], index) => (
                <article className={`glass-card reveal delay-${Math.min(index, 3) * 100} bg-white/75 p-5`} key={question}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-indigo-600 shadow-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{question}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-500">{answer}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}

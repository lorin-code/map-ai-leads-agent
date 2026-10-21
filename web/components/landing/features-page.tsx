import Link from "next/link";

import { AuthEntry } from "./auth-modal";
import { ArrowIcon, ChartIcon, CheckIcon, ExportIcon, FilterIcon, LayersIcon, PinIcon, SearchIcon, SparkIcon } from "./landing-icons";
import { LandingFooter } from "./landing-footer";
import { LandingNav } from "./landing-nav";
import { ScrollEffects } from "./scroll-effects";

const featureModules = [
  {
    title: "自然语言检索",
    desc: "像聊天一样描述想找的线索，AI 会从一句话里理解城市、区域、行业和筛选条件。",
    detail: "一句话开始查找",
    icon: SearchIcon,
  },
  {
    title: "条件补全",
    desc: "表达不完整时，助手会用追问把需求补清楚，再继续查找。",
    detail: "缺失条件确认",
    icon: SparkIcon,
  },
  {
    title: "实时任务进度",
    desc: "查找过程中实时展示已获取数量，刷新页面后也能回到当前进度。",
    detail: "执行中 · 已完成 · 可恢复",
    icon: ChartIcon,
  },
  {
    title: "多轮筛选",
    desc: "在同一个会话里继续追加“只看有电话的”“换个区域”等条件。",
    detail: "基于当前上下文处理",
    icon: FilterIcon,
  },
  {
    title: "字段整理",
    desc: "结果表聚焦名称、类型、区域、地址、电话、网站和评分，方便快速判断和跟进。",
    detail: "线索字段清洗",
    icon: LayersIcon,
  },
  {
    title: "导出名单",
    desc: "支持下载 CSV 和 JSON。CSV 已处理中文编码，方便直接用 Excel 打开。",
    detail: "CSV · JSON",
    icon: ExportIcon,
  },
];

const fieldRows = [
  ["名称", "高德返回的商家或机构名称", "展示 / 导出"],
  ["类型", "高德行业分类或细分类目", "展示 / 导出"],
  ["区域", "城市、行政区或识别到的查找范围", "展示 / 导出"],
  ["地址", "公开地址信息", "展示 / 导出"],
  ["电话", "公开联系电话，可能为空", "展示 / 导出"],
  ["网站", "公开网站信息，可能为空", "展示 / 导出"],
  ["评分", "高德返回的评分信息", "展示 / 导出"],
];

const taskStates = [
  ["新建", "发送第一条消息后自动保存查找记录。"],
  ["执行中", "展示实时已获取数量，刷新后仍可回到当前任务。"],
  ["已完成", "展示结果表、统计信息和导出入口。"],
  ["可继续", "基于当前会话继续筛选或下载名单。"],
];

const conversationExamples = [
  ["帮我找上海浦东新区的新能源车销售线索", "理解需求后开始查找，并持续更新已获取数量。"],
  ["只看有电话的线索", "在当前名单里筛出更适合联系的线索。"],
  ["把这些线索下载成表格", "把当前结果导出为 CSV 或 JSON。"],
];

export function FeaturesPage() {
  return (
    <main className="index-landing relative">
      <ScrollEffects />
      <div className="mesh-bg">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>
      <LandingNav active="features" />

      <section className="relative overflow-hidden px-4 pb-16 pt-40 sm:px-6">
        <div className="bg-grid-pattern" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="reveal active relative z-10">
            <div className="mb-6 inline-flex items-center space-x-2 rounded-full border border-slate-200/60 bg-white/80 px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              <span>工作台功能</span>
            </div>
            <h1 className="text-4xl font-black leading-[1.08] tracking-tighter text-slate-900 sm:text-5xl md:text-6xl">
              工作台支持的
              <br />
              <span className="text-gradient">真实功能清单</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-slate-500">
              用自然语言开始查找，在对话里补充条件、筛选结果，并把可联系名单整理成可导出的表格。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <AuthEntry className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-slate-800">
                进入工作台 <ArrowIcon />
              </AuthEntry>
              <Link className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 px-7 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:text-indigo-600" href="/faq">
                查看 FAQ
              </Link>
            </div>
          </div>

          <div className="features-live-card glass-card reveal delay-100 relative z-10 overflow-hidden bg-white/80 p-4 sm:p-5">
            <div className="rounded-[1.5rem] border border-slate-100 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-[#fafbfc] px-5 py-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-500">Workbench</p>
                  <h2 className="mt-1 text-lg font-extrabold text-slate-900">线索查找任务</h2>
                </div>
                <span className="features-status-pill rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">执行中</span>
              </div>
              <div className="grid gap-4 p-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-3">
                  {taskStates.map(([state, desc], index) => (
                    <div className={`features-task-card rounded-2xl border px-4 py-3 ${index === 1 ? "is-active border-indigo-100 bg-indigo-50/70" : "border-slate-100 bg-slate-50/70"}`} key={state}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-slate-900">{state}</span>
                        <span className={`features-task-dot h-2 w-2 rounded-full ${index === 1 ? "bg-indigo-500" : "bg-slate-300"}`} />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{desc}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <strong className="text-sm text-slate-900">实时结果概览</strong>
                    <span className="features-live-count text-xs font-bold text-indigo-600">已获取 190 条</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[
                      ["有电话", "128"],
                      ["有网站", "46"],
                      ["可导出", "190"],
                    ].map(([label, value]) => (
                      <div className="features-stat-card rounded-xl bg-slate-50 px-3 py-4" key={label}>
                        <div className="features-stat-value text-xl font-black text-slate-900">{value}</div>
                        <div className="mt-1 text-xs font-semibold text-slate-400">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-[#fafbfc] p-3 text-xs leading-6 text-slate-500">
                    查找过程中可以看到已获取数量，方便判断是否需要继续细化条件。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-20 sm:px-6" id="modules">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 reveal">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">Feature Modules</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">功能模块</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featureModules.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <article className={`features-module-card glass-card reveal delay-${Math.min(index % 3, 2) * 100} bg-white/80 p-7`} key={feature.title}>
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-indigo-600 shadow-sm">
                    <Icon className="landing-icon h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{feature.desc}</p>
                  <div className="mt-5 inline-flex rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-bold text-slate-500">{feature.detail}</div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="reveal">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">Conversation Logic</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">多轮对话如何工作</h2>
            <p className="mt-5 text-base leading-8 text-slate-500">
              你可以像继续聊天一样补充条件。助手会结合当前名单和上下文，继续筛选、补充信息，或在需要时发起新的查找。
            </p>
          </div>
          <div className="grid gap-4">
            {conversationExamples.map(([input, output], index) => (
              <article className={`features-conversation-card glass-card reveal delay-${Math.min(index, 2) * 100} bg-white/80 p-5`} key={input}>
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white">{index + 1}</div>
                  <div>
                    <div className="features-chat-bubble inline-flex rounded-xl rounded-tl-sm bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-800">{input}</div>
                    <p className="mt-3 text-sm leading-7 text-slate-500">{output}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-20 sm:px-6" id="fields">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 reveal md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">Lead Details</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">线索信息一目了然</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-500">名单聚焦跟联系和判断有关的信息，例如名称、地址、电话、网站和评分，打开后就能直接筛选和跟进。</p>
          </div>
          <div className="glass-card reveal overflow-hidden bg-white/85">
            <div className="grid gap-3 p-3 md:hidden">
              {fieldRows.map(([field, desc, status]) => (
                <article className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm" key={field}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-extrabold text-slate-900">{field}</h3>
                    <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                      {status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-[#fafbfc] text-xs uppercase tracking-[0.18em] text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-bold">字段</th>
                    <th className="px-5 py-4 font-bold">说明</th>
                    <th className="px-5 py-4 text-right font-bold">处理方式</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {fieldRows.map(([field, desc, status]) => (
                    <tr className="features-field-row hover:bg-slate-50/70" key={field}>
                      <td className="px-5 py-4 font-bold text-slate-900">{field}</td>
                      <td className="px-5 py-4">{desc}</td>
                      <td className={`px-5 py-4 text-right font-bold ${status.includes("不") ? "text-slate-400" : "text-indigo-600"}`}>{status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="glass-card reveal bg-white/80 p-7 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">Export</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">导出当前结果</h2>
            <p className="mt-4 text-sm leading-7 text-slate-500">确认名单可用后，可以导出当前会话结果。CSV 适合表格处理，JSON 适合后续程序化使用。</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                ["CSV", "适合 Excel 打开，已处理中文编码"],
                ["JSON", "适合开发集成或继续自动化处理"],
              ].map(([format, desc]) => (
                <div className="features-export-card rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm" key={format}>
                  <div className="text-2xl font-black text-slate-900">{format}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card reveal delay-100 border border-slate-200 bg-white/85 p-7 text-slate-900 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">Data Scope</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">结果范围说明</h2>
            <div className="mt-6 space-y-4">
              {[
                "线索基于高德公开返回信息整理，不会补造电话或网站。",
                "名单聚焦可联系、可判断的信息，减少跟进时的干扰。",
                "查找记录会保留，之后可以回到历史记录继续查看。",
                "当前重点是线索名单，不包含评论明细、图片或路线规划。",
              ].map((item) => (
                <div className="features-scope-item flex items-start gap-3 text-sm font-medium leading-7 text-slate-600" key={item}>
                  <CheckIcon className="landing-icon mt-1 h-4 w-4 shrink-0 text-green-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900 p-10 text-center reveal md:p-16">
          <h2 className="text-4xl font-black tracking-tight text-white md:text-5xl">用一条真实需求测试功能</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">像聊天一样说出要找的线索，看看 AI 如何持续查找、筛选并整理成可导出的名单。</p>
          <AuthEntry className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-bold text-slate-900 shadow-lg transition-all hover:-translate-y-1 hover:bg-slate-100">
            进入工作台 <ArrowIcon />
          </AuthEntry>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}

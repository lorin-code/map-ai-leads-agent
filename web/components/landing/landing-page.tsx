import Link from "next/link";
import type React from "react";

import { AuthEntry } from "./auth-modal";
import { landingFaqs } from "./faq-data";
import { ArrowIcon, CheckIcon, CopyIcon, ExportIcon, FilterIcon, PhoneIcon, PinIcon, SearchIcon, SparkIcon, StarIcon, StoreIcon } from "./landing-icons";
import { LandingFooter } from "./landing-footer";
import { LandingNav } from "./landing-nav";
import { LiveActivityMarquee } from "./live-activity-marquee";
import { ScrollEffects } from "./scroll-effects";

const historyItems = ["上海黄浦区餐饮", "杭州西湖咖啡馆..."];
const liveItems = [
  "刚刚下载：杭州西湖区 咖啡店 342 条名单",
  "AI 正在整理：北京朝阳区 汽修厂 128 条",
  "刚刚筛选：上海静安区 有电话的餐厅 89 条",
  "刚刚下载：广州天河区 健身房 210 条数据表",
];
const fields = [
  { icon: "phone", title: "联系方式", desc: "优先呈现公开电话和官网，方便您快速判断哪些线索可以直接跟进。" },
  { icon: "store", title: "商家信息", desc: "清楚展示名称、类型、区域和地址，方便快速了解每条线索的基本情况。" },
  { icon: "star", title: "判断参考", desc: "保留评分等辅助信息，帮助您在一批名单里先挑出更值得联系的对象。" },
];
const pricingPlans = [
  {
    name: "基础版",
    price: "¥0",
    suffix: "/ 永久免费",
    items: ["每日免费查找额度", "支持多轮对话筛选"],
    href: "/app",
    cta: "免费开始",
  },
  {
    name: "专业版",
    price: "¥99",
    suffix: "/ 月",
    items: ["无限制查找额度", "无限制一键导出数据表格"],
    href: "/app",
    cta: "升级专业版",
    featured: true,
  },
  {
    name: "团队版",
    price: "定制",
    items: ["团队席位与额度共享", "专属技术支持响应"],
    href: "/app",
    cta: "联系我们",
  },
];

function Glyph({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    layer: <SparkIcon />,
    search: <SearchIcon />,
    robot: <SparkIcon />,
    check: <CheckIcon />,
    filter: <FilterIcon />,
    export: <ExportIcon />,
    pin: <PinIcon />,
    phone: <PhoneIcon />,
    store: <StoreIcon />,
    star: <StarIcon />,
    globe: "◌",
    copy: <CopyIcon />,
  };
  return <span className="landing-glyph">{icons[name] ?? "•"}</span>;
}

function MockupPreview() {
  return (
    <div className="w-full max-w-6xl mx-auto reveal delay-200 relative z-20 px-4 mockup-container">
      <div className="mockup-3d relative bg-white/60 backdrop-blur-2xl rounded-[2rem] p-3 border border-white/80 cursor-pointer">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-400/20 blur-[60px] rounded-full pointer-events-none" />
        <div className="bg-white rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-sm flex flex-col h-[600px] relative z-10 pointer-events-none">
          <div className="bg-[#fafbfc] px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-400/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <span className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
            <div className="flex bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 border-r border-slate-100">
                <Glyph name="search" /> 线索发现
              </div>
              <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400">我的名单</div>
            </div>
            <div className="w-10" />
          </div>

          <div className="flex flex-1 overflow-hidden relative bg-[#fcfcfd]">
            <aside className="hidden md:flex flex-col w-[260px] bg-slate-50/50 border-r border-slate-100 p-4">
              <div className="text-xs font-bold text-slate-400 mb-4 px-2 tracking-widest uppercase">历史记录</div>
              <div className="space-y-1.5">
                {historyItems.map((item, index) => (
                  <div
                    className={`px-3 py-3 rounded-xl text-[13px] flex items-center gap-2 transition ${
                      index === 0
                        ? "bg-white text-indigo-700 font-semibold border border-slate-200 shadow-sm relative overflow-hidden"
                        : "font-medium text-slate-500 hover:bg-white border border-transparent hover:border-slate-100 hover:shadow-sm"
                    }`}
                    key={item}
                  >
                    {index === 0 ? <span className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" /> : null}
                    <Glyph name="search" />
                    <span className="truncate">{item}</span>
                  </div>
                ))}
              </div>
            </aside>

            <div className="flex-1 flex flex-col relative bg-dotted-workbench">
              <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-8 no-scrollbar pb-32">
                <div className="flex justify-end">
                  <div className="bg-indigo-50 text-indigo-900 px-6 py-4 rounded-[20px] rounded-tr-sm max-w-[85%] text-[15px] font-medium border border-indigo-100/50 shadow-sm">
                    帮我找一下上海黄浦区的餐饮店线索。
                  </div>
                </div>
                <div className="flex justify-start relative">
                  <div className="bg-white border border-slate-100 px-6 py-6 rounded-[20px] rounded-tl-sm max-w-[95%] shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] text-[15px] z-10 relative">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs shadow-md">
                        <Glyph name="robot" />
                      </div>
                      AI 助手
                    </div>
                    <p className="text-slate-600 mb-5 leading-relaxed font-normal ml-10">
                      好的，已为您整理上海市黄浦区可联系的餐饮店线索。当前返回{" "}
                      <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">45</span> 条有效结果：
                    </p>

                    <div className="ml-10 border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm relative">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#fafbfc] border-b border-slate-100">
                          <tr>
                            {["商家名称", "所属区域", "行业类型", "联系电话"].map((head, index) => (
                              <th className={`py-3 px-5 font-semibold text-slate-400 text-xs tracking-wider ${index === 1 ? "hidden sm:table-cell" : ""} ${index === 3 ? "text-right" : ""}`} key={head}>
                                {head}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="text-slate-700 font-medium divide-y divide-slate-50">
                          {[
                            ["某某精致本帮菜", "黄浦区", "中餐厅", "021-6385****"],
                            ["精品日料寿司", "黄浦区", "日本菜", "021-5306****"],
                          ].map(([name, area, type, phone], index) => (
                            <tr className="hover:bg-slate-50 transition-colors" key={name}>
                              <td className="py-3.5 px-5 flex items-center gap-2 text-slate-800">
                                <span className={`w-1.5 h-1.5 rounded-full ${index === 0 ? "bg-green-400" : "bg-blue-400"}`} />
                                {name}
                              </td>
                              <td className="py-3.5 px-5 text-slate-400 hidden sm:table-cell">{area}</td>
                              <td className="py-3.5 px-5">
                                <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md text-[11px] font-semibold">{type}</span>
                              </td>
                              <td className="py-3.5 px-5 text-right font-mono text-slate-600 font-bold">{phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="absolute -left-3 top-10 w-6 h-6 bg-white border border-slate-100 rounded-full flex items-center justify-center shadow-sm z-20">
                    <Glyph name="check" />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 z-30">
                <div className="bg-white/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-200/80 rounded-2xl p-1.5 flex items-center">
                  <input className="w-full bg-transparent pl-4 pr-12 py-3.5 text-[15px] focus:outline-none text-slate-700 placeholder-slate-400 font-medium" placeholder="继续补充：换成咖啡店，或者帮我下载名单..." readOnly />
                  <button className="w-11 h-11 bg-indigo-600 rounded-xl text-white flex items-center justify-center shadow-md flex-shrink-0" type="button">
                    ↑
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <AuthEntry ariaLabel="进入工作台" className="absolute inset-0 z-30">
          <span className="sr-only">进入工作台</span>
        </AuthEntry>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="index-landing relative">
      <ScrollEffects />
      <div className="mesh-bg">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>

      <LandingNav active="home" />

      <section className="pt-40 pb-10 px-4 sm:px-6 relative flex flex-col items-center overflow-hidden">
        <div className="bg-grid-pattern" />
        <div className="max-w-4xl mx-auto text-center reveal active z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/80 border border-slate-200/60 shadow-sm backdrop-blur-md text-xs font-bold text-slate-600 mb-8 tracking-wide">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
            <span>直连高德地图的数据引擎</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] font-black text-slate-900 leading-[1.1] mb-6 tracking-tighter">
            像聊天一样找到
            <br />
            <span className="text-gradient">本地可联系线索</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            用一句话描述你的目标客户，AI 会帮你找到可联系的本地商家，并整理成清晰可用的名单。
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
            <AuthEntry className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-full text-base font-bold shadow-xl hover:bg-slate-800 hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
              进入工作台体验 <ArrowIcon />
            </AuthEntry>
          </div>
        </div>
        <MockupPreview />
      </section>

      <LiveActivityMarquee fallbackItems={liveItems} />

      <section id="features" className="py-32 px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-24 reveal">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">把找线索这件事，放进一次对话里</h2>
            <p className="text-slate-500 font-normal text-lg max-w-2xl mx-auto leading-relaxed">
              说出目标客户，继续补充条件，拿到可联系名单。查找、筛选和导出都围绕同一段对话完成。
            </p>
          </div>

          <div className="relative">
            <div className="hidden md:block flow-line">
              <div className="flow-glow" />
            </div>
            {[
              ["1", "AI 对话式智能查找", "无需填表或勾选筛选项。像聊天一样说出想找的线索，AI 会理解您的需求，并在信息不清楚时继续追问。", "“帮我找深圳天河区的医院”", "您指的是广州市的天河区吗？我可以按广州天河区继续查找。"],
              ["2", "多轮对话与二次筛选", "结果太多？继续说出新的条件，比如“只看有电话的”“缩小到某个街道”或“换成咖啡店”，名单会跟着变得更精准。", "结果太多了，只看有电话的线索。", "已为您过滤，剩余 128 条含有公开电话的线索。"],
              ["3", "一键导出客户名单", "支持将整理好的线索一键下载为标准表格。下载后可直接使用 Excel 打开，方便分配给团队，无缝衔接您的下一步销售动作。", "下载 Excel", "下载即用，无需二次清洗"],
            ].map(([num, title, desc, bubble, answer], index) => (
              <div className={`relative flex flex-col ${index === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-8 ${index < 2 ? "mb-16" : ""} reveal delay-${index * 100}`} key={title}>
                <div className={`md:w-1/2 relative z-10 flex flex-col ${index === 1 ? "md:pl-12 md:items-start" : "md:pr-12 md:text-right md:items-end"}`}>
                  <div className={`${index === 2 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-white border border-slate-200 text-slate-800 shadow-sm"} w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold mb-6 relative`}>
                    {num}
                    <span className={`absolute ${index === 1 ? "-left-3" : "-right-3"} top-1/2 hidden h-[2px] w-3 -translate-y-1/2 bg-slate-200 md:block`} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{title}</h3>
                  <p className="text-slate-500 leading-relaxed font-normal text-sm max-w-sm">{desc}</p>
                </div>
                <div className="md:w-1/2 w-full relative z-10">
                  <div className={`glass-card workflow-demo-card p-6 bg-white/80 ${index === 1 ? "flex flex-col items-end" : index === 2 ? "sm:p-8 flex flex-col items-center" : ""}`}>
                    {index === 2 ? (
                      <>
                        <div className="flex gap-4 w-full mb-5">
                          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-indigo-400 hover:-translate-y-1 transition-all">
                            <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center text-indigo-600">
                              <ExportIcon />
                            </div>
                            <div className="font-bold text-slate-800 text-sm">下载 Excel</div>
                          </div>
                          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-slate-400 hover:-translate-y-1 transition-all">
                            <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center text-slate-400">
                              <Glyph name="copy" />
                            </div>
                            <div className="font-bold text-slate-800 text-sm">直接复制名单</div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-green-700 bg-green-50 px-4 py-1.5 rounded-full border border-green-100 flex items-center gap-1.5 w-full justify-center">
                          <CheckIcon className="landing-icon" /> 下载即用，无缝衔接
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={`${index === 1 ? "bg-slate-100 text-slate-700 self-start" : "bg-indigo-50 text-indigo-700"} px-4 py-2.5 rounded-xl rounded-tl-sm text-sm font-medium mb-3 inline-block shadow-sm`}>
                          {bubble}
                        </div>
                        <div className="bg-white border border-slate-200 px-4 py-3 rounded-xl rounded-tr-sm text-sm text-slate-600 shadow-sm inline-block w-full">{answer}</div>
                        {index === 1 ? (
                          <div className="mt-3 inline-block self-start rounded-xl rounded-tl-sm border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-500 shadow-sm">
                            行业再细化一点，只看猫咖。
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="data-fields" className="py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">拿到名单，就能开始判断和联系</h2>
            <p className="text-lg text-slate-500 font-normal max-w-2xl mx-auto leading-relaxed">每条线索都围绕后续跟进整理，少看无关信息，更快找到值得沟通的对象。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-fr">
            {fields.map((item, index) => (
              <div className={`glass-card p-8 sm:p-10 flex flex-col justify-center relative overflow-hidden group reveal delay-${Math.min(index, 3) * 100}`} key={item.title}>
                <div className="w-12 h-12 bg-white text-slate-800 rounded-xl flex items-center justify-center text-xl border border-slate-200 shadow-sm mb-6">
                  <Glyph name={item.icon} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 font-normal text-base leading-relaxed max-w-md">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center reveal">
            <span className="inline-flex items-center gap-2 text-slate-500 text-sm font-semibold bg-white/60 backdrop-blur-md px-6 py-3 rounded-full border border-slate-200 shadow-sm">
              <CheckIcon className="landing-icon text-green-500" /> 表格打开后即可筛选、分配和跟进。
            </span>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-32 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">简单透明的定价方案</h2>
            <p className="text-lg text-slate-500 font-normal max-w-2xl mx-auto leading-relaxed">免费体验所有核心功能，根据您的业务需求随时升级，无任何隐形费用。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch reveal">
            {pricingPlans.map((plan, index) => (
              <article
                className={`glass-card p-8 flex flex-col ${
                  plan.featured ? "relative border-indigo-200 shadow-[0_10px_40px_-10px_rgba(79,70,229,0.15)] md:-translate-y-4" : ""
                }`}
                key={plan.name}
              >
                {plan.featured ? (
                  <span className="absolute right-0 top-0 rounded-bl-xl bg-indigo-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">最受欢迎</span>
                ) : null}
                <div className={`${plan.featured ? "text-indigo-600 font-bold" : "text-slate-500 font-semibold"} mb-2`}>{plan.name}</div>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  {plan.suffix ? <span className="text-slate-500 text-sm">{plan.suffix}</span> : null}
                </div>
                <ul className="mb-8 flex-1 space-y-4">
                  {plan.items.map((item) => (
                    <li className={`flex items-start gap-3 ${plan.featured && item.includes("导出") ? "-ml-2 rounded-lg bg-indigo-50/50 p-2" : ""}`} key={item}>
                      <CheckIcon className={`landing-icon mt-1 text-sm ${plan.featured ? "text-indigo-600" : "text-green-500"}`} />
                      <span className={`${plan.featured && item.includes("导出") ? "text-slate-800 font-bold" : "text-slate-700 font-medium"} text-sm`}>{item}</span>
                    </li>
                  ))}
                </ul>
                <AuthEntry
                  className={`mt-auto inline-flex w-full items-center justify-center rounded-xl py-3 text-center font-bold transition duration-300 ${
                    plan.featured
                      ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                      : index === 0
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {plan.cta}
                </AuthEntry>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-28 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 reveal">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">常见问题</h2>
            <p className="text-lg text-slate-500 font-normal max-w-2xl mx-auto leading-relaxed">开始使用前，您可能会关心这些问题。</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 reveal">
            {landingFaqs.map(([question, answer], index) => (
              <article className="glass-card p-7 bg-white/75" key={question}>
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-indigo-600 shadow-sm">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{question}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{answer}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center reveal">
            <Link className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:text-indigo-600" href="/faq">
              查看全部常见问题 <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section id="cta" className="pb-32 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto reveal">
          <div className="glass-card relative overflow-hidden p-8 sm:p-10 md:p-12 bg-white/80">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-100/70 blur-[50px]" />
            <div className="absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-cyan-100/60 blur-[60px]" />
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-5 inline-flex items-center space-x-2 rounded-full border border-slate-200/80 bg-white/70 px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  <span>从一条真实需求开始</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">试着查找一批线索</h2>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-500">
                  像聊天一样说出你想找的线索，AI 会帮你整理可联系名单，并支持继续筛选或导出表格。
                </p>
              </div>
              <AuthEntry className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800 hover:shadow-2xl">
                进入工作台体验 <ArrowIcon />
              </AuthEntry>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}

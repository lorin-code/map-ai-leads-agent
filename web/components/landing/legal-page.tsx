import Link from "next/link";

import { LandingFooter } from "./landing-footer";
import { LandingNav } from "./landing-nav";
import { ScrollEffects } from "./scroll-effects";

type LegalPageProps = {
  type: "terms" | "privacy";
};

const legalContent = {
  terms: {
    eyebrow: "服务条款",
    title: "AI 线索助手服务协议",
    intro: "使用 AI 线索助手前，请了解服务范围、数据来源、结果使用方式和您的责任边界。",
    updated: "2026 年 5 月 2 日",
    sections: [
      {
        title: "服务内容",
        body: "AI 线索助手用于根据您的自然语言需求，整理高德地图等公开来源中的本地商家线索，并支持继续筛选名单和导出结果。",
      },
      {
        title: "账号与使用",
        body: "从官网进入工作台时需要先登录。您应确保提交的邮箱或手机号真实可用，并自行保管账号访问权限。登录后，您的查找记录可以在工作台中继续查看。",
      },
      {
        title: "数据来源与限制",
        body: "线索结果来自第三方地图服务公开返回的信息。联系方式可用性、评分和商家状态可能随第三方数据变化而变化，我们不承诺结果绝对完整或实时准确。",
      },
      {
        title: "导出与使用责任",
        body: "导出的名单仅供您进行合法合规的业务开发和内部分析。您需要自行确认后续联系、营销、存档和分发行为符合适用法律法规及平台规则。",
      },
      {
        title: "服务变更",
        body: "我们可能根据产品迭代、第三方数据来源限制或合规要求调整功能范围、使用额度和导出方式。重要变化会尽量在产品内或官网页面中说明。",
      },
    ],
  },
  privacy: {
    eyebrow: "隐私政策",
    title: "AI 线索助手隐私政策",
    intro: "这里说明我们会保存哪些使用信息、为什么需要保存，以及您可以如何管理自己的查找记录。",
    updated: "2026 年 5 月 2 日",
    sections: [
      {
        title: "我们收集的信息",
        body: "为了让工作台正常使用，我们会保存您的登录标识、对话内容、查找记录、结果名单和导出记录。",
      },
      {
        title: "信息用途",
        body: "这些信息用于帮您找回历史查找、继续筛选名单、生成导出文件，并在出现问题时协助定位原因。",
      },
      {
        title: "第三方数据",
        body: "线索名单基于高德地图等第三方公开信息整理。页面和导出文件会围绕线索跟进场景展示名称、类型、地址、电话、网站、区域、评分等常用信息。",
      },
      {
        title: "数据保存",
        body: "为了避免刷新页面或切换记录后找不到结果，您的查找记录和名单会被保留。请不要在对话中输入与找线索无关的敏感个人信息。",
      },
      {
        title: "您的选择",
        body: "如果您需要删除或更正账号相关的查找记录，可以通过产品支持渠道联系我们。我们会在确认请求后尽力协助处理。",
      },
    ],
  },
};

export function LegalPage({ type }: LegalPageProps) {
  const content = legalContent[type];

  return (
    <main className="index-landing relative min-h-screen">
      <ScrollEffects />
      <div className="mesh-bg">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>
      <LandingNav />

      <section className="relative px-4 pb-24 pt-40 sm:px-6">
        <div className="bg-grid-pattern" />
        <div className="mx-auto max-w-4xl">
          <div className="reveal active text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-slate-200/60 bg-white/80 px-4 py-1.5 text-xs font-bold tracking-wide text-slate-600 shadow-sm backdrop-blur-md">
              {content.eyebrow}
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-slate-900 sm:text-5xl md:text-6xl">{content.title}</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-500">{content.intro}</p>
            <p className="mt-5 text-sm font-semibold text-slate-400">更新日期：{content.updated}</p>
          </div>

          <div className="mt-14 space-y-5">
            {content.sections.map((section, index) => (
              <article className={`glass-card bg-white/75 p-7 reveal delay-${Math.min(index, 3) * 100}`} key={section.title}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-indigo-600 shadow-sm">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h2 className="mb-3 text-xl font-bold text-slate-900">{section.title}</h2>
                <p className="text-sm leading-7 text-slate-500">{section.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link className="inline-flex items-center justify-center rounded-full bg-slate-900 px-7 py-3.5 text-sm font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-slate-800" href="/">
              返回首页
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}

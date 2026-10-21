import Link from "next/link";

import { AuthEntry } from "./auth-modal";
import { faqGroups, landingFaqs } from "./faq-data";
import { ArrowIcon, CheckIcon, SearchIcon, SparkIcon } from "./landing-icons";
import { LandingFooter } from "./landing-footer";
import { LandingNav } from "./landing-nav";
import { ScrollEffects } from "./scroll-effects";

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    ...landingFaqs,
    ...faqGroups.flatMap((group) => group.items),
  ].map(([question, answer]) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export function FaqPage() {
  return (
    <main className="index-landing relative min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
      <ScrollEffects />
      <div className="mesh-bg">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>

      <LandingNav active="faq" />

      <section className="relative overflow-hidden px-4 pb-16 pt-40 sm:px-6">
        <div className="bg-grid-pattern" />
        <div className="mx-auto max-w-4xl text-center reveal active">
          <div className="mb-6 inline-flex items-center space-x-2 rounded-full border border-slate-200/60 bg-white/80 px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm backdrop-blur-md">
            <SparkIcon className="landing-icon text-indigo-500" />
            <span>帮助中心</span>
          </div>
          <h1 className="text-4xl font-black leading-[1.1] tracking-tighter text-slate-900 sm:text-5xl md:text-6xl">
            常见问题
            <br />
            <span className="text-gradient">一次看清楚</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium leading-relaxed text-slate-500">
            这里整理了使用 AI 线索助手前、查找过程中、导出和保存相关的问题。首页只展示高频问题，这里保留更完整的说明。
          </p>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-10 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-5 md:grid-cols-2">
            {landingFaqs.map(([question, answer], index) => (
              <article className={`glass-card reveal delay-${Math.min(index, 3) * 100} bg-white/75 p-7`} key={question}>
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-indigo-600 shadow-sm">
                  {index + 1}
                </div>
                <h2 className="text-lg font-bold text-slate-900">{question}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-500">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-8">
          {faqGroups.map((group, groupIndex) => (
            <section className={`glass-card reveal delay-${Math.min(groupIndex, 3) * 100} bg-white/75 p-6 sm:p-8`} key={group.title}>
              <div className="mb-7 flex flex-col gap-4 border-b border-slate-200/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-indigo-500">FAQ {String(groupIndex + 1).padStart(2, "0")}</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{group.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">{group.desc}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-indigo-600 shadow-sm">
                  <SearchIcon className="landing-icon h-5 w-5" />
                </div>
              </div>
              <div className="grid gap-4">
                {group.items.map(([question, answer]) => (
                  <article className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm" key={question}>
                    <div className="flex items-start gap-3">
                      <CheckIcon className="landing-icon mt-1 h-4 w-4 shrink-0 text-green-600" />
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{question}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-500">{answer}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-5xl reveal">
          <div className="glass-card relative overflow-hidden border border-indigo-100 bg-white/82 p-8 text-slate-900 sm:p-10">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-100/80 blur-[50px]" />
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">Need Help</p>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">没有找到答案？</h2>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                  可以进入工作台跑一次真实查找，或在联系页面说明您的行业、区域和遇到的问题。
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <AuthEntry className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-slate-800">
                  进入工作台 <ArrowIcon />
                </AuthEntry>
                <Link className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:text-indigo-600" href="/contact">
                  联系我们
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}

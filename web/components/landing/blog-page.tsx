import Link from "next/link";

import { ArrowIcon, ExportIcon, SearchIcon, SparkIcon } from "./landing-icons";
import { LandingFooter } from "./landing-footer";
import { LandingNav } from "./landing-nav";
import { ScrollEffects } from "./scroll-effects";

const categories = ["全部文章", "获客技巧", "产品动态"];
const posts = [
  {
    title: "告别手动复制：如何用 AI 从地图整理本地商户线索",
    category: "获客技巧",
    readTime: "5 分钟阅读",
    desc: "用城市、区域和行业描述目标，系统会把查找、字段整理和导出放在同一个会话里完成。",
    icon: SearchIcon,
    featured: true,
  },
  {
    title: "导出的 CSV 文件在 Excel 中乱码怎么办？",
    category: "新手教程",
    readTime: "3 分钟阅读",
    desc: "中文乱码通常来自编码识别问题。当前系统已在导出时处理 BOM，下载后可以直接用 Excel 打开。",
    icon: ExportIcon,
  },
  {
    title: "为什么二次筛选应该保留在同一个对话里？",
    category: "产品动态",
    readTime: "4 分钟阅读",
    desc: "先查大范围，再继续补充“只看有电话的”“换成某个区域”，比重新发起任务更接近真实工作流。",
    icon: SparkIcon,
  },
];

export function BlogPage() {
  const [featuredPost, ...restPosts] = posts;
  const FeaturedIcon = featuredPost.icon;

  return (
    <main className="index-landing relative min-h-screen">
      <ScrollEffects />
      <div className="mesh-bg">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>

      <LandingNav active="blog" />

      <section className="pt-40 pb-16 px-4 sm:px-6 relative overflow-hidden flex flex-col items-center">
        <div className="bg-grid-pattern" />
        <div className="max-w-3xl mx-auto text-center reveal active z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/80 border border-slate-200/60 shadow-sm text-xs font-bold text-slate-600 mb-6">
            <SparkIcon className="landing-icon text-indigo-500" />
            <span>线索增长笔记</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tighter">
            发现获取线索的
            <br />
            <span className="text-gradient">更优解</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto mb-10 font-medium leading-relaxed">
            这里整理地图线索采集、字段清洗、多轮筛选和导出使用中的真实问题，帮助您更快把名单变成可跟进的线索。
          </p>
          <div className="relative max-w-xl mx-auto bg-white/60 backdrop-blur-xl shadow-sm border border-slate-200/80 rounded-full p-1.5 flex items-center">
            <SearchIcon className="landing-icon text-slate-400 ml-4" />
            <input
              className="w-full bg-transparent pl-3 pr-4 py-3 text-[15px] focus:outline-none text-slate-700 placeholder-slate-400 font-medium"
              placeholder="搜索文章，例如：CSV 乱码、多轮筛选..."
              readOnly
            />
            <button className="bg-slate-900 rounded-full text-white px-6 py-2.5 text-sm font-bold hover:bg-slate-800 transition-colors" type="button">
              搜索
            </button>
          </div>
        </div>
      </section>

      <section className="pb-10 px-4 sm:px-6 reveal delay-100 z-20 relative">
        <div className="max-w-5xl mx-auto flex gap-3 overflow-x-auto justify-start md:justify-center pb-2">
          {categories.map((category, index) => (
            <button
              className={`px-5 py-2 rounded-full text-sm whitespace-nowrap shadow-sm transition ${
                index === 0
                  ? "bg-indigo-600 text-white font-bold"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 font-medium"
              }`}
              key={category}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="pb-32 px-4 sm:px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <article className="glass-card mb-8 group reveal flex flex-col md:flex-row border-0 overflow-hidden">
            <div className="w-full md:w-1/2 min-h-64 bg-slate-100 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-white to-purple-100" />
              <div className="absolute inset-0 bg-grid-pattern opacity-60" />
              <div className="absolute inset-0 flex items-center justify-center text-indigo-300/70 group-hover:scale-110 transition duration-500">
                <FeaturedIcon className="h-16 w-16 landing-icon" />
              </div>
            </div>
            <div className="p-8 md:p-10 flex flex-col justify-center md:w-1/2 bg-white/50">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full border border-indigo-100">{featuredPost.category}</span>
                <span className="text-xs text-slate-400 font-medium">{featuredPost.readTime}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 group-hover:text-indigo-600 transition">{featuredPost.title}</h2>
              <p className="text-slate-500 font-normal leading-relaxed mb-6">{featuredPost.desc}</p>
              <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors" href="/features">
                查看系统功能 <ArrowIcon />
              </Link>
            </div>
          </article>

          <div className="grid md:grid-cols-2 gap-8 reveal delay-100">
            {restPosts.map((post) => {
              const Icon = post.icon;
              return (
                <article className="glass-card group flex flex-col border-0 bg-white/50 overflow-hidden" key={post.title}>
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50" />
                    <div className="absolute inset-0 flex items-center justify-center text-blue-200 group-hover:scale-110 transition duration-500">
                      <Icon className="h-12 w-12 landing-icon" />
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100">{post.category}</span>
                      <span className="text-xs text-slate-400 font-medium">{post.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition">{post.title}</h3>
                    <p className="text-slate-500 text-sm font-normal leading-relaxed mb-6">{post.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}

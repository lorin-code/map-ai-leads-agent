import { BlogPage } from "@/components/landing/blog-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "博客洞察 - 地图线索采集与导出技巧",
  description: "阅读 AI 地图线索采集、字段清洗、多轮筛选、CSV 中文乱码处理和导出使用相关的产品笔记。",
  path: "/blog",
});

export default function BlogRoutePage() {
  return <BlogPage />;
}

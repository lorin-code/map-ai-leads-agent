import { FeaturesPage } from "@/components/landing/features-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "功能介绍 - AI 线索助手",
  description: "了解如何用自然语言查找线索、继续筛选结果，并把名单导出为可用表格。",
  path: "/features",
});

export default function FeaturesRoute() {
  return <FeaturesPage />;
}

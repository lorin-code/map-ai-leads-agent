import { LandingPage } from "@/components/landing/landing-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "AI 线索助手 - 对话式地图线索查找工具",
  description: "用自然语言输入城市、区域和行业，AI 自动整理高德地图公开商家线索，支持多轮筛选、实时保存和 CSV / JSON 导出。",
  path: "/",
});

export default function HomePage() {
  return <LandingPage />;
}

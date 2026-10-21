import type { Metadata } from "next";

import { PricingPage } from "@/components/landing/pricing-page";

export const metadata: Metadata = {
  title: "价格方案 - 免费试用与升级说明 | AI 线索助手",
  description: "查看 AI 线索助手的免费版、专业版和团队版方案，了解适合个人和团队的线索查找、筛选与导出使用方式。",
};

export default function Page() {
  return <PricingPage />;
}

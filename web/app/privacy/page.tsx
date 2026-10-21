import { LegalPage } from "@/components/landing/legal-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "隐私政策",
  description: "了解 AI 线索助手会保存哪些使用信息，以及这些信息如何用于恢复查找记录、筛选名单和生成导出文件。",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPage type="privacy" />;
}

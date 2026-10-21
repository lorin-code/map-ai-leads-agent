import { LegalPage } from "@/components/landing/legal-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "服务协议",
  description: "了解 AI 线索助手的服务范围、公开数据来源、导出名单使用方式和用户责任说明。",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPage type="terms" />;
}

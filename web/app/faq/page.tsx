import { FaqPage } from "@/components/landing/faq-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "常见问题 - 数据来源、多轮筛选与导出说明",
  description: "了解 AI 线索助手的数据来源、多轮对话逻辑、任务保存、CSV / JSON 导出和字段展示规则。",
  path: "/faq",
});

export default function FaqRoutePage() {
  return <FaqPage />;
}

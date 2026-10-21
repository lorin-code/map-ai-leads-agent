import { ContactPage } from "@/components/landing/contact-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "联系我们 - 产品咨询与使用支持",
  description: "联系 AI 线索助手团队，咨询产品功能、数据字段、导出方式、任务排查和合作沟通。",
  path: "/contact",
});

export default function ContactRoutePage() {
  return <ContactPage />;
}

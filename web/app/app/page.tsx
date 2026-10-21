import { ChatWorkspace } from "@/components/workbench/chat-workspace";
import { createPageMetadata } from "@/lib/seo";
import { getCurrentUser } from "@/lib/server-auth-runtime";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = createPageMetadata({
  title: "工作台",
  description: "AI 线索助手工作台，用于查找、筛选、保存和导出地图线索。",
  path: "/app",
  noIndex: true,
});

export default async function AgentAppPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return <ChatWorkspace currentUser={user} />;
}

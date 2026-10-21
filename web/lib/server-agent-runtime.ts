import { createRequire } from "node:module";

import { buildSummary } from "@/lib/agent-client";
import type { AgentSessionPayload, AgentSessionSummary } from "@/lib/agent-types";

const require = createRequire(import.meta.url);
const { getAgentRuntime } = require("../../server/runtime");

const CATEGORY_LABELS: Record<string, string> = {
  automotive: "汽车",
  restaurant: "餐饮",
  hotel: "酒店",
  education: "教育培训",
  fitness: "健身",
  beauty: "美容美发",
  medical: "医疗",
  retail: "零售",
};

type SessionBundle = {
  session: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    updated_at: string;
  } | null;
  messages: Array<Record<string, unknown>>;
  state: Record<string, unknown> | null;
  latestRun: {
    id?: string;
    query?: Record<string, unknown>;
    result?: Array<Record<string, unknown>>;
    result_count?: number;
  } | null;
  searchRuns?: Array<{
    id: string;
    query?: Record<string, unknown>;
    result?: Array<Record<string, unknown>>;
    result_count?: number;
  }>;
};

function toSessionPayload(sessionId: string, bundle: SessionBundle): AgentSessionPayload {
  const results = (bundle.latestRun?.result || []) as AgentSessionPayload["results"];
  const query = bundle.latestRun?.query || {};
  const state = {
    ...(bundle.state || {}),
    city: (bundle.state?.city as string | null) || (query.city as string | null) || null,
    category: (bundle.state?.category as string | null) || (query.category as string | null) || null,
    subcategory:
      (bundle.state?.subcategory as string | null) || (query.subcategory as string | null) || null,
    district: (bundle.state?.district as string | null) || (query.district as string | null) || null,
    last_result_count:
      Number(bundle.state?.last_result_count || 0) || results.length,
  };

  return {
    sessionId,
    session: bundle.session,
    messages: (bundle.messages || []) as AgentSessionPayload["messages"],
    state: state as AgentSessionPayload["state"],
    results,
    searchRuns: (bundle.searchRuns || []).map((run) => ({
      id: String(run.id),
      query: run.query || {},
      result: (run.result || []) as AgentSessionPayload["results"],
      result_count: Number(run.result_count || (run.result || []).length),
    })),
    summary: buildSummary(results),
    downloads: {
      csv: "",
      json: "",
    },
  };
}

function mapSessionSummary(session: Record<string, unknown>): AgentSessionSummary {
  return {
    id: String(session.id),
    title: String(session.title || "未命名会话"),
    status: String(session.status || "active"),
    created_at: String(session.created_at || ""),
    updated_at: String(session.updated_at || ""),
    city: (session.city as string | null) || null,
    category: (session.category as string | null) || null,
    subcategory: (session.subcategory as string | null) || null,
    district: (session.district as string | null) || null,
    last_result_count: Number(session.last_result_count || 0),
  };
}

export async function listSessionsPayload(userId: string) {
  const runtime = await getAgentRuntime();
  const sessions = await runtime.store.listSessions({ userId });
  return {
    sessions: sessions.map(mapSessionSummary),
  };
}

export async function publicActivityPayload() {
  const runtime = await getAgentRuntime();
  const sessions = await runtime.store.listSessions();
  const verbs = ["刚刚整理", "已保存", "最近查找", "可继续筛选"];
  const formatDate = (value: unknown) => {
    const date = new Date(String(value || ""));
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  };

  const items = sessions
    .filter((session: Record<string, unknown>) => Number(session.last_result_count || 0) > 0)
    .slice(0, 16)
    .map((session: Record<string, unknown>, index: number) => {
      const city = String(session.city || "本地");
      const district = String(session.district || "");
      const subcategory = String(session.subcategory || "");
      const category =
        CATEGORY_LABELS[String(session.category || "")] ||
        String(session.category || "商家");
      const updatedAt = formatDate(session.updated_at);
      const count = Number(session.last_result_count || 0);
      const scope = [city, district].filter(Boolean).join("");
      const industry = [subcategory || category].filter(Boolean).join("");
      const timeLabel = updatedAt ? `${updatedAt} · ` : "";
      return `${timeLabel}${verbs[index % verbs.length]}：${scope}${industry}线索 ${count} 条`;
    });

  return { items };
}

export async function createSessionPayload(title: string, userId: string) {
  const runtime = await getAgentRuntime();
  const session = await runtime.store.createSession({ title, userId });
  const bundle = await runtime.store.getSessionBundle(session.id, { userId });
  return toSessionPayload(session.id, bundle);
}

export async function getSessionPayload(sessionId: string, userId: string) {
  const runtime = await getAgentRuntime();
  const bundle = await runtime.store.getSessionBundle(sessionId, { userId });
  if (!bundle.session) {
    return null;
  }

  return toSessionPayload(sessionId, bundle);
}

export async function postSessionMessagePayload(sessionId: string, userId: string, message: string) {
  const runtime = await getAgentRuntime();
  const bundle = await runtime.store.getSessionBundle(sessionId, { userId });
  if (!bundle.session) {
    return null;
  }
  return runtime.orchestrator.handleMessage({ sessionId, message });
}

export async function confirmSessionPayload(sessionId: string, userId: string) {
  const runtime = await getAgentRuntime();
  const bundle = await runtime.store.getSessionBundle(sessionId, { userId });
  if (!bundle.session) {
    return null;
  }
  return runtime.orchestrator.confirmPendingPlan({ sessionId });
}

export async function deleteSessionPayload(sessionId: string, userId: string) {
  const runtime = await getAgentRuntime();
  const deleted = await runtime.store.deleteSession(sessionId, { userId });
  return { deleted, sessionId };
}

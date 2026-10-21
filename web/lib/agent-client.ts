import type {
  AgentConfirmation,
  AgentDownloads,
  AgentLead,
  AgentMessage,
  AgentSearchRun,
  AgentSessionListPayload,
  AgentSessionPayload,
  AgentSessionSummary,
  AgentState,
  AgentSummary,
} from "./agent-types";

export const SESSION_STORAGE_KEY = "g-map-agent-session-id";

const AGENT_API_ROOT = "/api/agent";

export const QUICK_START_PROMPTS = [
  "查找上海浦东新区的新能源车销售线索",
  "查找北京朝阳区的企业培训线索",
  "查找深圳南山区的软件服务线索",
  "查找杭州西湖区的餐饮招商线索",
];

export const CATEGORY_LABELS: Record<string, string> = {
  automotive: "汽车",
  restaurant: "餐饮",
  hotel: "酒店",
  education: "教育培训",
  fitness: "健身",
  beauty: "美容美发",
  medical: "医疗",
  retail: "零售",
};

const EMPTY_SUMMARY: AgentSummary = {
  total: 0,
  leadCount: 0,
  pagesFetched: 0,
  withPhone: 0,
  withWebsite: 0,
  averageRating: "0.0",
};

const EMPTY_DOWNLOADS: AgentDownloads = {
  csv: "",
  json: "",
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${AGENT_API_ROOT}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let payload = {} as T & { error?: string };
  if (text) {
    try {
      payload = JSON.parse(text) as T & { error?: string };
    } catch {
      payload = { error: text } as T & { error?: string };
    }
  }
  if (!response.ok) {
    throw new Error(payload.error || "请求失败，请稍后再试。");
  }

  return payload;
}

export async function listSessions() {
  const payload = await requestJson<AgentSessionListPayload>("/sessions", {
    cache: "no-store",
    headers: {},
  });
  return payload.sessions ?? [];
}

export async function createSession(title: string) {
  return requestJson<AgentSessionPayload>("/sessions", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export async function getSession(sessionId: string) {
  return requestJson<AgentSessionPayload>(`/sessions/${encodeURIComponent(sessionId)}`, {
    cache: "no-store",
    headers: {},
  });
}

export async function postSessionMessage(sessionId: string, message: string) {
  return requestJson<AgentSessionPayload>(`/sessions/${encodeURIComponent(sessionId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function confirmSession(sessionId: string) {
  return requestJson<AgentSessionPayload>(`/sessions/${encodeURIComponent(sessionId)}/confirm`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function deleteSession(sessionId: string) {
  return requestJson<{ deleted: boolean; sessionId: string }>(
    `/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "DELETE",
    },
  );
}

export function sessionSubtitle(session: AgentSessionSummary) {
  const parts = [
    session.city || "",
    CATEGORY_LABELS[session.category || ""] || session.category || "",
    session.subcategory || "",
    session.last_result_count ? `${session.last_result_count} 条线索` : "",
  ].filter(Boolean);

  return parts.join(" · ") || "还没有结果";
}

export function formatSessionTime(timestamp: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

export function formatTaskSummary(state: AgentState | null) {
  const parts = [
    state?.city || "",
    CATEGORY_LABELS[state?.category || ""] || state?.category || "",
    state?.subcategory || "",
    state?.district || "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : "还没有填写范围";
}

export function normalizePayload(payload: AgentSessionPayload) {
  const results = payload.results ?? [];
  const summary = payload.summary ?? buildSummary(results);
  const downloads = payload.downloads ?? EMPTY_DOWNLOADS;
  const confirmation = payload.confirmationRequired ? payload.confirmation ?? null : null;
  const searchRuns = (payload.searchRuns ?? []) as AgentSearchRun[];

  return {
    sessionId: payload.sessionId,
    session: payload.session,
    messages: payload.messages ?? [],
    state: payload.state ?? null,
    confirmation,
    results,
    searchRuns,
    summary,
    downloads,
  };
}

export function buildSummary(results: AgentLead[]): AgentSummary {
  const ratings = results
    .map((lead) => Number.parseFloat(String(lead.rating ?? "")))
    .filter((rating) => Number.isFinite(rating));

  return {
    ...EMPTY_SUMMARY,
    total: results.length,
    leadCount: results.length,
    withPhone: results.filter((lead) => Boolean(lead.tel)).length,
    withWebsite: results.filter((lead) => Boolean(lead.website)).length,
    averageRating: ratings.length
      ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
      : "0.0",
  };
}

const RESULTFUL_TOOLS = new Set([
  "search_leads",
  "refine_search",
  "filter_results",
  "sort_results",
  "export_results",
  "summarize_results",
]);

export function findResultMessageId(messages: AgentMessage[], results: AgentLead[]) {
  if (results.length === 0) {
    return null;
  }

  const anchor = [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && message.tool_name && RESULTFUL_TOOLS.has(message.tool_name));

  if (anchor) {
    return messageIdentity(anchor);
  }

  const fallbackAnchor = [...messages].reverse().find((message) => message.role === "user");
  return fallbackAnchor ? messageIdentity(fallbackAnchor) : null;
}

export function messageIdentity(message: AgentMessage) {
  return message.id || message.created_at || `${message.role}-${message.tool_name || "text"}-${message.content}`;
}

export function makeSessionTitle(message: string) {
  const title = message.replace(/\s+/g, " ").trim().slice(0, 24);
  return title || "新建线索会话";
}

export function saveCurrentSessionId(sessionId: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (sessionId) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function loadCurrentSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SESSION_STORAGE_KEY);
}

export function prepareDownloadText(text: string, mimeType: string) {
  if (mimeType.toLowerCase().includes("text/csv") && !text.startsWith("\ufeff")) {
    return `\ufeff${text}`;
  }

  return text;
}

export function downloadText(filename: string, text: string, mimeType: string) {
  const blob = new Blob([prepareDownloadText(text, mimeType)], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getStatusCopy({
  busy,
  confirmation,
  sessionId,
  hydrated,
}: {
  busy: boolean;
  confirmation: AgentConfirmation | null;
  sessionId: string | null;
  hydrated: boolean;
}) {
  if (!hydrated) {
    return "正在打开页面...";
  }

  if (busy) {
    return "正在查找线索并整理名单...";
  }

  if (confirmation) {
    return "当前步骤需要你确认后继续。";
  }

  if (sessionId) {
    return "继续补充条件，结果会直接收进这段对话里。";
  }

  return "说说你想找哪类线索，发送后会自动保存。";
}

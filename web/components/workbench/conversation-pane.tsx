import type { FormEvent } from "react";

import {
  formatTaskSummary,
  messageIdentity,
  QUICK_START_PROMPTS,
} from "@/lib/agent-client";
import type {
  AgentConfirmation,
  AgentDownloads,
  AgentLead,
  AgentMessage,
  AgentSearchRun,
  AgentState,
  AgentSummary,
} from "@/lib/agent-types";

import { InlineResultsPanel } from "./inline-results-panel";

type ConversationPaneProps = {
  busy: boolean;
  composerValue: string;
  confirmation: AgentConfirmation | null;
  expandedMessageId: string | null;
  hydrated: boolean;
  messages: AgentMessage[];
  onChangeComposer: (value: string) => void;
  onDismissError: () => void;
  onConfirm: () => void;
  onQuickStart: (prompt: string) => void;
  onRetryError: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onToggleResults: (messageId: string) => void;
  errorNotice: {
    message: string;
    retryMessage: string;
  } | null;
  pendingMessage: string | null;
  resultMessageId: string | null;
  results: AgentLead[];
  searchRuns: AgentSearchRun[];
  sessionId: string | null;
  state: AgentState | null;
  summary: AgentSummary;
  downloads: AgentDownloads;
};

const TOOL_LABELS: Record<string, string> = {
  respond: "",
  search_leads: "正在查找",
  refine_search: "已缩小范围",
  filter_results: "筛选结果",
  sort_results: "调整排序",
  export_results: "可下载",
  summarize_results: "汇总结果",
  request_confirmation: "等待确认",
  working: "处理中",
};

function toolLabel(toolName?: string | null) {
  if (!toolName || toolName === "respond") {
    return "";
  }

  return TOOL_LABELS[toolName] || "";
}

const RESULTFUL_TOOLS = new Set([
  "search_leads",
  "refine_search",
  "filter_results",
  "sort_results",
  "export_results",
  "summarize_results",
]);

function roleLabel(role: AgentMessage["role"]) {
  if (role === "user") {
    return "你";
  }

  if (role === "assistant") {
    return "助手";
  }

  return "工具";
}

export function ConversationPane({
  busy,
  composerValue,
  confirmation,
  downloads,
  errorNotice,
  expandedMessageId,
  hydrated,
  messages,
  onChangeComposer,
  onDismissError,
  onConfirm,
  onQuickStart,
  onRetryError,
  onSubmit,
  onToggleResults,
  pendingMessage,
  resultMessageId,
  results,
  searchRuns,
  sessionId,
  state,
  summary,
}: ConversationPaneProps) {
  const timelineMessages = [...messages];
  const runsById = new Map(searchRuns.map((run) => [run.id, run]));
  const runsByMessageId = new Map<string, AgentSearchRun>();
  const usedRunIds = new Set<string>();
  let nextRunIndex = 0;

  for (const message of messages) {
    if (
      message.role !== "assistant" ||
      !message.tool_name ||
      !RESULTFUL_TOOLS.has(message.tool_name)
    ) {
      continue;
    }

    const messageRun = message.tool_call_id ? runsById.get(message.tool_call_id) : null;
    if (messageRun) {
      runsByMessageId.set(messageIdentity(message), messageRun);
      usedRunIds.add(messageRun.id);
      continue;
    }

    while (nextRunIndex < searchRuns.length && usedRunIds.has(searchRuns[nextRunIndex].id)) {
      nextRunIndex += 1;
    }

    if (nextRunIndex < searchRuns.length) {
      const fallbackRun = searchRuns[nextRunIndex];
      runsByMessageId.set(messageIdentity(message), fallbackRun);
      usedRunIds.add(fallbackRun.id);
      nextRunIndex += 1;
    }
  }

  if (pendingMessage) {
    timelineMessages.push({
      role: "user",
      content: pendingMessage,
    });
    timelineMessages.push({
      role: "assistant",
      content: "正在查找线索并整理名单，请稍候…",
      tool_name: "working",
    });
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/72 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl">
      <header className="shrink-0 border-b border-white/70 px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black tracking-[-0.05em] text-slate-900">
              AI 线索助手
            </h1>
          </div>

          <div className="grid gap-3 rounded-[1.6rem] border border-white/80 bg-white/72 px-4 py-4 shadow-sm sm:grid-cols-3">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">当前任务</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {sessionId ? "已保存" : "新查找"}
              </p>
            </div>
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">查找范围</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatTaskSummary(state)}</p>
            </div>
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">已找到</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{summary.leadCount} 条线索</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {timelineMessages.length === 0 ? (
            <section className="mx-auto w-full max-w-[1280px] rounded-[2rem] border border-white/80 bg-white/70 px-6 py-6 shadow-[0_20px_80px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:px-8">
              <span className="inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[0.72rem] uppercase tracking-[0.24em] text-indigo-600">
                新对话
              </span>
              <h2 className="mt-4 max-w-4xl text-2xl font-black tracking-[-0.04em] text-slate-900 sm:text-3xl">
                告诉我想找什么线索，我来帮你整理成名单。
              </h2>
              <div className="mt-6 grid gap-3 lg:grid-cols-2">
                {QUICK_START_PROMPTS.map((prompt) => (
                  <button
                    className="rounded-[1.35rem] border border-slate-200/80 bg-white/82 px-4 py-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_14px_30px_rgba(99,102,241,0.12)]"
                    key={prompt}
                    onClick={() => onQuickStart(prompt)}
                    type="button"
                  >
                    <p className="text-sm font-semibold leading-6 text-slate-800">{prompt}</p>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <div className="space-y-4">
            {timelineMessages.map((message, index) => {
              const isUser = message.role === "user";
              const messageId = messageIdentity(message);
              const messageRun = runsByMessageId.get(messageId) || null;
              const messageResults =
                messageRun?.result || (messageId === resultMessageId ? results : []);
              const messageSummary = messageRun
                ? {
                    total: messageRun.result_count || messageRun.result.length,
                    leadCount: messageRun.result.length,
                    pagesFetched: 0,
                    withPhone: messageRun.result.filter((lead) => Boolean(lead.tel)).length,
                    withWebsite: messageRun.result.filter((lead) => Boolean(lead.website)).length,
                    averageRating: (() => {
                      const ratings = messageRun.result
                        .map((lead) => Number.parseFloat(String(lead.rating ?? "")))
                        .filter((rating) => Number.isFinite(rating));
                      return ratings.length
                        ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
                        : "0.0";
                    })(),
                  }
                : summary;
              const canShowResults = messageResults.length > 0 && !pendingMessage;
              const expanded = expandedMessageId === messageId;
              const articleWidth = canShowResults
                ? "w-full"
                : isUser
                  ? "ml-auto w-fit max-w-[min(82%,42rem)]"
                  : "w-fit max-w-[min(88%,48rem)]";
              const visibleToolLabel = toolLabel(message.tool_name);

              return (
                <article
                  className={`border shadow-[0_12px_32px_rgba(15,23,42,0.05)] ${articleWidth} ${
                    isUser
                      ? "rounded-[1.35rem] rounded-tr-md border-indigo-100 bg-indigo-50/90 px-4 py-3 text-indigo-950 shadow-[0_10px_24px_rgba(99,102,241,0.10)]"
                      : "rounded-[2rem] border-white/80 bg-white/78 px-4 py-4 backdrop-blur-xl sm:px-5 sm:py-5"
                  }`}
                  key={`${messageId}-${index}`}
                >
                  {message.tool_name !== "working" && (!isUser || visibleToolLabel) ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-[0.68rem] uppercase tracking-[0.2em] ${
                          isUser
                            ? "border border-indigo-100 bg-white/72 text-indigo-600"
                            : "border border-indigo-100 bg-indigo-50 text-indigo-600"
                        }`}
                      >
                        {roleLabel(message.role)}
                      </span>
                      {visibleToolLabel ? (
                        <span
                          className={`text-xs ${
                            isUser ? "text-indigo-500" : "text-slate-500"
                          }`}
                        >
                          {visibleToolLabel}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {message.tool_name === "working" ? (
                    <div
                      aria-live="polite"
                      className="agent-working-card rounded-[1.35rem] border border-indigo-100 bg-white/82 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            正在查找并整理线索
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {summary.leadCount > 0
                              ? `已获取 ${summary.leadCount} 条线索，仍在继续采集。`
                              : "会自动汇总可联系信息和关键字段"}
                          </p>
                        </div>
                        <div className="agent-working-orbit shrink-0" aria-hidden="true">
                          <span />
                          <span />
                        </div>
                      </div>
                      {summary.leadCount > 0 ? (
                        <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-semibold text-indigo-700">
                              {summary.leadCount} 条线索
                            </span>
                            <span className="text-slate-500">{summary.withPhone} 条有电话</span>
                            <span className="text-slate-500">{summary.withWebsite} 条有网站</span>
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-4 grid gap-2 sm:grid-cols-3">
                        {["匹配区域", "筛选联系方式", "整理结果表"].map((step, stepIndex) => (
                          <div
                            className="agent-working-step rounded-2xl border border-indigo-100 bg-white/85 px-3 py-2"
                            key={step}
                            style={{ animationDelay: `${stepIndex * 520}ms` }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="agent-working-dot h-2 w-2 rounded-full bg-indigo-500" />
                              <span className="text-xs font-medium text-slate-800">{step}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="agent-working-progress mt-4" aria-hidden="true" />
                    </div>
                  ) : (
                    <div
                      className={`whitespace-pre-wrap text-[15px] ${
                        isUser ? "text-indigo-950" : "text-slate-700"
                      } ${isUser ? "leading-6" : "mt-4 leading-7"}`}
                    >
                      {message.content || " "}
                    </div>
                  )}

                  {canShowResults ? (
                    <div className="mt-5 border-t border-slate-200/80 pt-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2 text-sm text-slate-700">
                              <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
                              {messageSummary.leadCount} 条线索
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              {messageSummary.withPhone} 条有电话
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              平均评分 {messageSummary.averageRating}
                            </span>
                          </div>
                        </div>

                        <button
                          className="inline-flex items-center justify-center rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:-translate-y-0.5 hover:border-indigo-200"
                          onClick={() => onToggleResults(messageId)}
                          type="button"
                        >
                          {expanded ? "收起结果" : "展开结果"}
                        </button>
                      </div>

                      {expanded ? (
                        <InlineResultsPanel
                          downloads={downloads}
                          results={messageResults}
                          state={state}
                          summary={messageSummary}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/70 bg-white/58 px-5 py-3 backdrop-blur-xl sm:px-7">
          <div className="mx-auto w-full max-w-[1280px]">
            {confirmation ? (
              <section className="mb-4 rounded-[1.75rem] border border-amber-300/50 bg-amber-50/90 px-4 py-4 text-[color:#7a4c06] shadow-[0_10px_28px_rgba(217,119,6,0.08)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-amber-700/80">等待确认</p>
                    <p className="mt-2 text-sm leading-6">
                      {confirmation.message || "这一步需要确认后才能继续执行。"}
                    </p>
                    {confirmation.estimatedTasks ? (
                      <p className="mt-2 text-sm font-medium">预计任务数：{confirmation.estimatedTasks}</p>
                    ) : null}
                  </div>
                  <button
                    className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={busy}
                    onClick={onConfirm}
                    type="button"
                  >
                    确认继续
                  </button>
                </div>
              </section>
            ) : null}

            {errorNotice ? (
              <section className="mb-4 rounded-[1.75rem] border border-rose-200 bg-rose-50/95 px-4 py-4 text-rose-900 shadow-[0_10px_28px_rgba(190,18,60,0.08)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-rose-700/80">处理失败</p>
                    <p className="mt-2 text-sm leading-6">{errorNotice.message}</p>
                    <p className="mt-1 text-xs leading-5 text-rose-700/80">
                      已保留上一条输入，可以直接重试。
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex items-center justify-center rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={busy}
                      onClick={onRetryError}
                      type="button"
                    >
                      重试
                    </button>
                    <button
                      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-800 transition hover:-translate-y-0.5"
                      onClick={onDismissError}
                      type="button"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            <form
              className="rounded-[1.35rem] border border-white/90 bg-white/88 px-3 py-2 shadow-[0_10px_28px_rgba(15,23,42,0.08)]"
              onSubmit={onSubmit}
            >
              <label className="sr-only" htmlFor="agent-chat-input">
                输入消息
              </label>
              <textarea
                className="max-h-24 min-h-12 w-full resize-none rounded-2xl border-0 bg-transparent px-2 py-1.5 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400"
                disabled={!hydrated || busy}
                id="agent-chat-input"
                onChange={(event) => onChangeComposer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder=""
                value={composerValue}
              />
              <div className="flex items-center justify-between gap-3 border-t border-slate-200/80 px-2 pt-2">
                <p className="text-xs text-slate-500">Enter 发送，Shift + Enter 换行</p>
                <button
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={!hydrated || busy || composerValue.trim().length === 0}
                  type="submit"
                >
                  {busy ? "处理中..." : "发送消息"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

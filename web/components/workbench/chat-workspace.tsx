"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import {
  confirmSession,
  createSession,
  deleteSession,
  findResultMessageId,
  getSession,
  listSessions,
  loadCurrentSessionId,
  makeSessionTitle,
  normalizePayload,
  postSessionMessage,
  saveCurrentSessionId,
} from "@/lib/agent-client";
import type {
  AgentConfirmation,
  AgentDownloads,
  AgentLead,
  AgentMessage,
  AgentSearchRun,
  AgentSessionSummary,
  AgentState,
  AgentSummary,
} from "@/lib/agent-types";
import type { CurrentUser } from "@/lib/server-auth-runtime";

import { ConversationPane } from "./conversation-pane";
import { SessionSidebar } from "./session-sidebar";

type WorkspaceState = {
  busy: boolean;
  composerValue: string;
  confirmation: AgentConfirmation | null;
  downloads: AgentDownloads;
  errorNotice: {
    message: string;
    retryMessage: string;
  } | null;
  expandedMessageId: string | null;
  hydrated: boolean;
  messages: AgentMessage[];
  pendingStartMessageCount: number | null;
  pendingMessage: string | null;
  results: AgentLead[];
  searchRuns: AgentSearchRun[];
  sessionId: string | null;
  sessions: AgentSessionSummary[];
  state: AgentState | null;
  statusText: string;
  summary: AgentSummary;
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

type AgentProgressPayload = {
  sessionId?: string;
  done?: boolean;
  error?: string;
  state?: AgentState | null;
  summary?: AgentSummary;
};

function draftWorkspace(sessions: AgentSessionSummary[], statusText: string): WorkspaceState {
  return {
    busy: false,
    composerValue: "",
    confirmation: null,
    downloads: EMPTY_DOWNLOADS,
    errorNotice: null,
    expandedMessageId: null,
    hydrated: true,
    messages: [],
    pendingMessage: null,
    pendingStartMessageCount: null,
    results: [],
    searchRuns: [],
    sessionId: null,
    sessions,
    state: null,
    statusText,
    summary: EMPTY_SUMMARY,
  };
}

function applyPayloadToWorkspace(
  sessions: AgentSessionSummary[],
  current: WorkspaceState,
  statusText: string,
  payload: Awaited<ReturnType<typeof normalizePayload>>,
): WorkspaceState {
  const resultMessageId = findResultMessageId(payload.messages, payload.results);
  const expandedMessageId =
    payload.results.length === 0
      ? null
      : current.expandedMessageId && current.expandedMessageId === resultMessageId
        ? current.expandedMessageId
        : resultMessageId;

  return {
    ...current,
    busy: false,
    confirmation: payload.confirmation,
    downloads: payload.downloads,
    errorNotice: null,
    expandedMessageId,
    hydrated: true,
    messages: payload.messages,
    pendingMessage: null,
    pendingStartMessageCount: null,
    results: payload.results,
    searchRuns: payload.searchRuns,
    sessionId: payload.sessionId,
    sessions,
    state: payload.state,
    statusText,
    summary: payload.summary,
  };
}

type ChatWorkspaceProps = {
  currentUser: CurrentUser;
};

export function ChatWorkspace({ currentUser }: ChatWorkspaceProps) {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    busy: true,
    composerValue: "",
    confirmation: null,
    downloads: EMPTY_DOWNLOADS,
    errorNotice: null,
    expandedMessageId: null,
    hydrated: false,
    messages: [],
    pendingMessage: null,
    pendingStartMessageCount: null,
    results: [],
    searchRuns: [],
    sessionId: null,
    sessions: [],
    state: null,
    statusText: "正在打开页面...",
    summary: EMPTY_SUMMARY,
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const initializedRef = useRef(false);
  const operationSeqRef = useRef(0);

  const resultMessageId = useMemo(
    () => findResultMessageId(workspace.messages, workspace.results),
    [workspace.messages, workspace.results],
  );

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    void (async () => {
      setWorkspace((current) => ({
        ...current,
        busy: true,
        statusText: "正在恢复上次查找...",
      }));

      try {
        const sessions = await listSessions();
        const storedSessionId = loadCurrentSessionId();

        if (storedSessionId && sessions.some((session) => session.id === storedSessionId)) {
          const payload = normalizePayload(await getSession(storedSessionId));

          startTransition(() => {
            setWorkspace((current) =>
              applyPayloadToWorkspace(sessions, current, "已恢复上次打开的查找记录。", payload),
            );
          });
          saveCurrentSessionId(payload.sessionId);
          return;
        }

        saveCurrentSessionId(null);
        startTransition(() => {
          setWorkspace(draftWorkspace(sessions, "说说你想找哪类线索，发送后会自动保存。"));
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "页面打开失败，请刷新后再试。";
        startTransition(() => {
          setWorkspace(draftWorkspace([], message));
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (!workspace.busy || !workspace.sessionId || !workspace.pendingMessage) {
      return;
    }

    let cancelled = false;
    const sessionId = workspace.sessionId;
    const after = workspace.pendingStartMessageCount ?? workspace.messages.length;
    const eventSource = new EventSource(
      `/api/agent/sessions/${encodeURIComponent(sessionId)}/progress?after=${after}`,
    );

    eventSource.onmessage = (event) => {
      void (async () => {
        if (cancelled) {
          return;
        }

        let progressPayload: AgentProgressPayload;
        try {
          progressPayload = JSON.parse(event.data) as AgentProgressPayload;
        } catch {
          return;
        }

        if (progressPayload.error) {
          return;
        }

        if (progressPayload.done) {
          try {
            const [sessions, payload] = await Promise.all([listSessions(), getSession(sessionId)]);
            const normalized = normalizePayload(payload);
            if (cancelled) {
              return;
            }

            startTransition(() => {
              setWorkspace((current) => {
                if (cancelled || current.sessionId !== sessionId || !current.pendingMessage) {
                  return current;
                }

                return applyPayloadToWorkspace(sessions, current, "已整理好这次结果。", normalized);
              });
            });
          } catch {
            // Progress streaming is best effort; the main request still owns errors.
          }
          return;
        }

        startTransition(() => {
          setWorkspace((current) => {
            if (cancelled || current.sessionId !== sessionId || !current.pendingMessage) {
              return current;
            }

            const summary = progressPayload.summary || current.summary;
            const leadCount = summary.leadCount;
            return {
              ...current,
              state: progressPayload.state ?? current.state,
              statusText:
                leadCount > 0
                  ? `正在查找线索，已获取 ${leadCount} 条。`
                  : "正在查找线索并整理名单...",
              summary,
            };
          });
        });
      })();
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      cancelled = true;
      eventSource.close();
    };
  }, [
    workspace.busy,
    workspace.pendingMessage,
    workspace.pendingStartMessageCount,
    workspace.sessionId,
  ]);

  const handleCreateSession = () => {
    operationSeqRef.current += 1;
    saveCurrentSessionId(null);
    startTransition(() => {
      setWorkspace((current) =>
        draftWorkspace(current.sessions, "已开始新的查找。发送第一条消息后会自动保存。"),
      );
    });
  };

  const handleSelectSession = async (sessionId: string) => {
    if (sessionId === workspace.sessionId) {
      return;
    }

    const operationId = ++operationSeqRef.current;

    setWorkspace((current) => ({
      ...current,
      busy: true,
      statusText: "正在切换会话...",
    }));

    try {
      const [sessions, payload] = await Promise.all([listSessions(), getSession(sessionId)]);
      const normalized = normalizePayload(payload);
      if (operationSeqRef.current !== operationId) {
        return;
      }

      startTransition(() => {
        setWorkspace((current) =>
          applyPayloadToWorkspace(sessions, current, "会话已切换。", normalized),
        );
      });
      saveCurrentSessionId(normalized.sessionId);
    } catch (error) {
      if (operationSeqRef.current !== operationId) {
        return;
      }
      const message = error instanceof Error ? error.message : "切换会话失败。";
      setWorkspace((current) => ({
        ...current,
        busy: false,
        statusText: message,
      }));
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (workspace.busy) {
      return;
    }

    setWorkspace((current) => ({
      ...current,
      busy: true,
      statusText: "正在删除会话...",
    }));

    try {
      await deleteSession(sessionId);
      const sessions = await listSessions();

      if (workspace.sessionId === sessionId) {
        saveCurrentSessionId(null);
        startTransition(() => {
          setWorkspace(draftWorkspace(sessions, "这条记录已删除，可以开始新的查找。"));
        });
        return;
      }

      setWorkspace((current) => ({
        ...current,
        busy: false,
        sessions,
        statusText: "会话已删除。",
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "删除会话失败。";
      setWorkspace((current) => ({
        ...current,
        busy: false,
        statusText: message,
      }));
    }
  };

  const handleSendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || workspace.busy) {
      return;
    }

    const operationId = ++operationSeqRef.current;
    let createdSessionId: string | null = null;

    setWorkspace((current) => ({
      ...current,
      busy: true,
      composerValue: "",
      errorNotice: null,
      pendingMessage: message,
      pendingStartMessageCount: current.messages.length,
      statusText: "正在查找线索并整理名单...",
    }));

    try {
      let sessionId = workspace.sessionId;

      if (!sessionId) {
        const created = normalizePayload(await createSession(makeSessionTitle(message)));
        sessionId = created.sessionId;
        createdSessionId = created.sessionId;
        if (operationSeqRef.current !== operationId) {
          await deleteSession(created.sessionId);
          return;
        }
        saveCurrentSessionId(sessionId);
        startTransition(() => {
          setWorkspace((current) => ({
            ...current,
            downloads: created.downloads,
            results: created.results,
            searchRuns: created.searchRuns,
            sessionId,
            state: created.state,
            summary: created.summary,
          }));
        });
      }

      const payload = normalizePayload(await postSessionMessage(sessionId, message));
      const sessions = await listSessions();
      if (operationSeqRef.current !== operationId) {
        return;
      }

      startTransition(() => {
        setWorkspace((current) =>
          applyPayloadToWorkspace(
            sessions,
            current,
            payload.confirmation ? "这一步需要你确认后继续。" : "已整理好这次结果。",
            payload,
          ),
        );
      });
      saveCurrentSessionId(payload.sessionId);
    } catch (error) {
      if (operationSeqRef.current !== operationId) {
        return;
      }
      if (createdSessionId) {
        try {
          await deleteSession(createdSessionId);
        } catch {
          // Best effort cleanup for a draft session that never received a message.
        }
        saveCurrentSessionId(null);
      }
      const messageText = error instanceof Error ? error.message : "发送消息失败。";
      setWorkspace((current) => ({
        ...current,
        busy: false,
        errorNotice: {
          message: messageText,
          retryMessage: message,
        },
        pendingMessage: null,
        pendingStartMessageCount: null,
        statusText: messageText,
      }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSendMessage(workspace.composerValue);
  };

  const handleConfirm = async () => {
    if (!workspace.sessionId || !workspace.confirmation || workspace.busy) {
      return;
    }

    const operationId = ++operationSeqRef.current;

    setWorkspace((current) => ({
      ...current,
      busy: true,
      statusText: "正在继续执行这次任务...",
    }));

    try {
      const payload = normalizePayload(await confirmSession(workspace.sessionId));
      const sessions = await listSessions();
      if (operationSeqRef.current !== operationId) {
        return;
      }

      startTransition(() => {
        setWorkspace((current) =>
          applyPayloadToWorkspace(sessions, current, "已继续执行这次任务。", payload),
        );
      });
      saveCurrentSessionId(payload.sessionId);
    } catch (error) {
      if (operationSeqRef.current !== operationId) {
        return;
      }
      const message = error instanceof Error ? error.message : "确认执行失败。";
      setWorkspace((current) => ({
        ...current,
        busy: false,
        statusText: message,
      }));
    }
  };

  const handleLogout = async () => {
    if (workspace.busy) {
      return;
    }

    setWorkspace((current) => ({
      ...current,
      busy: true,
      statusText: "正在退出登录...",
    }));

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      saveCurrentSessionId(null);
      window.localStorage.removeItem("aimapleads:landing-auth");
      router.replace("/");
      router.refresh();
    }
  };

  return (
    <main className="index-landing app-workspace-shell relative isolate h-screen overflow-hidden bg-[#f8fafc]">
      <div className="mesh-bg">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60" />
      <div
        className={`relative z-10 mx-auto grid h-full min-h-0 w-full max-w-[1920px] gap-4 px-3 py-3 transition-[grid-template-columns] duration-200 lg:grid-rows-1 lg:px-5 lg:py-5 ${
          sidebarCollapsed
            ? "grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[76px_minmax(0,1fr)]"
            : "grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)]"
        }`}
      >
        <SessionSidebar
          activeSessionId={workspace.sessionId}
          busy={workspace.busy}
          collapsed={sidebarCollapsed}
          currentUser={currentUser}
          draft={!workspace.sessionId}
          onCreateSession={handleCreateSession}
          onDeleteSession={handleDeleteSession}
          onLogout={handleLogout}
          onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)}
          onSelectSession={handleSelectSession}
          sessions={workspace.sessions}
        />

        <ConversationPane
          busy={workspace.busy}
          composerValue={workspace.composerValue}
          confirmation={workspace.confirmation}
          downloads={workspace.downloads}
          errorNotice={workspace.errorNotice}
          expandedMessageId={workspace.expandedMessageId}
          hydrated={workspace.hydrated}
          messages={workspace.messages}
          onChangeComposer={(value) =>
            setWorkspace((current) => ({
              ...current,
              composerValue: value,
            }))
          }
          onConfirm={handleConfirm}
          onDismissError={() =>
            setWorkspace((current) => ({
              ...current,
              errorNotice: null,
            }))
          }
          onQuickStart={(prompt) => {
            void handleSendMessage(prompt);
          }}
          onRetryError={() => {
            if (workspace.errorNotice) {
              void handleSendMessage(workspace.errorNotice.retryMessage);
            }
          }}
          onSubmit={handleSubmit}
          onToggleResults={(messageId) =>
            setWorkspace((current) => ({
              ...current,
              expandedMessageId: current.expandedMessageId === messageId ? null : messageId,
            }))
          }
          pendingMessage={workspace.pendingMessage}
          resultMessageId={resultMessageId}
          results={workspace.results}
          searchRuns={workspace.searchRuns}
          sessionId={workspace.sessionId}
          state={workspace.state}
          summary={workspace.summary}
        />
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";

import { formatSessionTime, sessionSubtitle } from "@/lib/agent-client";
import type { AgentSessionSummary } from "@/lib/agent-types";
import type { CurrentUser } from "@/lib/server-auth-runtime";

type SessionSidebarProps = {
  activeSessionId: string | null;
  busy: boolean;
  collapsed: boolean;
  currentUser: CurrentUser;
  draft: boolean;
  sessions: AgentSessionSummary[];
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onLogout: () => void;
  onToggleCollapsed: () => void;
  onSelectSession: (sessionId: string) => void;
};

function PlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
    </svg>
  );
}

function SettingsIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" stroke="currentColor" strokeWidth="2" />
      <path d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.5-2-3.5-2.4 1a8.2 8.2 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.5A8.2 8.2 0 0 0 7 6.5l-2.4-1-2 3.5 2 1.5a8.4 8.4 0 0 0 0 3l-2 1.5 2 3.5 2.4-1a8.2 8.2 0 0 0 2.6 1.5l.4 2.5h4l.4-2.5A8.2 8.2 0 0 0 17 17.5l2.4 1 2-3.5-2-1.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function LogoutIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M9.5 5H6.8A2.8 2.8 0 0 0 4 7.8v8.4A2.8 2.8 0 0 0 6.8 19h2.7" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M14 8l4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M18 12H9" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function userInitial(user: CurrentUser) {
  const source = user.display_name || user.username || "U";
  return source.trim().slice(0, 1).toUpperCase();
}

export function SessionSidebar({
  activeSessionId,
  busy,
  collapsed,
  currentUser,
  draft,
  sessions,
  onCreateSession,
  onDeleteSession,
  onLogout,
  onToggleCollapsed,
  onSelectSession,
}: SessionSidebarProps) {
  const [pendingConfirmDeleteId, setPendingConfirmDeleteId] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const displayName = currentUser.display_name || currentUser.username;

  if (collapsed) {
    const activeSession = sessions.find((session) => session.id === activeSessionId);

    return (
      <aside className="relative flex h-full min-h-0 max-h-[76px] flex-row items-center overflow-visible rounded-[1.5rem] border border-white/80 bg-white/78 px-3 py-3 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl lg:max-h-none lg:flex-col lg:rounded-[2rem] lg:py-4">
        <button
          aria-label="展开查找记录"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-xl font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600"
          onClick={onToggleCollapsed}
          type="button"
        >
          ›
        </button>

        <button
          aria-label="新对话"
          className="ml-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-55 lg:ml-0 lg:mt-4"
          disabled={busy}
          onClick={onCreateSession}
          type="button"
        >
          <PlusIcon />
        </button>

        <div className="ml-3 flex h-11 min-w-16 items-center justify-center gap-1 rounded-2xl border border-slate-200/80 bg-white/72 px-3 lg:ml-0 lg:mt-4 lg:h-16 lg:w-11 lg:min-w-0 lg:flex-col lg:px-0">
          <span className="text-base font-semibold text-slate-900">{sessions.length}</span>
          <span className="mt-1 text-[0.62rem] text-slate-500">记录</span>
        </div>

        <button
          aria-label="打开账户菜单"
          className="ml-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/82 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 lg:ml-0 lg:mt-auto"
          onClick={() => {
            setAccountOpen((open) => !open);
            setSettingsOpen(false);
          }}
          type="button"
        >
          {userInitial(currentUser)}
        </button>
        {accountOpen ? (
          <div className="absolute bottom-20 left-3 z-20 w-72 rounded-[1.4rem] border border-white/80 bg-white/95 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-2xl lg:bottom-4 lg:left-20">
            <AccountMenu
              busy={busy}
              currentUser={currentUser}
              settingsOpen={settingsOpen}
              onLogout={onLogout}
              onToggleSettings={() => setSettingsOpen((open) => !open)}
            />
          </div>
        ) : null}

        <div className="ml-3 flex min-w-0 items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-3 py-2 lg:ml-0 lg:mt-4 lg:w-11 lg:flex-col lg:px-2 lg:py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.55)]" />
          <span className="truncate text-xs leading-none text-slate-600 lg:[writing-mode:vertical-rl]">
            {draft ? "新查找" : activeSession?.title || "已保存"}
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative flex h-full min-h-0 max-h-[218px] flex-col overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/78 p-3 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl lg:max-h-none lg:rounded-[2rem] lg:p-4 xl:p-5">
      <div className="flex items-center justify-between gap-2 rounded-[1.25rem] border border-white/80 bg-white/70 px-3 py-3 shadow-sm lg:gap-3 lg:rounded-[1.5rem] lg:px-4 lg:py-4">
        <div className="flex min-w-0 flex-1 items-center">
          <h2 className="truncate text-base font-semibold leading-10 tracking-[-0.03em] text-slate-900 lg:text-lg">查找记录</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 px-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-55 sm:px-3.5"
            disabled={busy}
            onClick={onCreateSession}
            type="button"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            新对话
          </button>
          <button
            aria-label="折叠查找记录"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-xl font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600"
            onClick={onToggleCollapsed}
            type="button"
          >
            ‹
          </button>
        </div>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col lg:mt-5">
        <div className="mb-2 flex items-center justify-between lg:mb-3">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-slate-500">查找记录</p>
          <span className="text-xs text-slate-500">{sessions.length} 条</span>
        </div>

        <div className="flex min-h-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden pb-1 lg:block lg:space-y-2 lg:overflow-x-hidden lg:overflow-y-auto lg:pb-0 lg:pr-1">
          {sessions.length === 0 ? (
            <div className="min-w-[260px] rounded-[1.5rem] border border-dashed border-slate-300/80 bg-white/55 px-4 py-4 text-sm leading-6 text-slate-500 lg:min-w-0 lg:py-5">
              还没有查找记录。直接输入你想找的线索，发送后会自动保存在这里。
            </div>
          ) : null}

          {sessions.map((session) => {
            const active = session.id === activeSessionId;
            const confirmingDelete = pendingConfirmDeleteId === session.id;

            return (
              <article
                aria-current={active ? "page" : undefined}
                className={`group w-[232px] shrink-0 rounded-[1.25rem] border px-3 py-3 text-left transition lg:w-full lg:rounded-[1.5rem] lg:px-4 lg:py-4 ${
                  active
                    ? "border-indigo-200 bg-indigo-50/82 shadow-[0_18px_40px_rgba(99,102,241,0.12)]"
                    : "cursor-pointer border-white/70 bg-white/55 hover:border-indigo-100 hover:bg-white/82"
                }`}
                key={session.id}
                onClick={() => {
                  if (!active) {
                    onSelectSession(session.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{session.title || "未命名会话"}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {sessionSubtitle(session)}
                    </p>
                  </div>
                  {confirmingDelete ? (
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        aria-label={`确认删除 ${session.title || "会话"}`}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        disabled={busy}
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingConfirmDeleteId(null);
                          onDeleteSession(session.id);
                        }}
                        type="button"
                      >
                        确认
                      </button>
                      <button
                        className="rounded-xl border border-slate-200 px-2 py-1 text-xs text-slate-500 transition hover:bg-white"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingConfirmDeleteId(null);
                        }}
                        type="button"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      aria-label={`删除 ${session.title || "会话"}`}
                      className="shrink-0 rounded-xl border border-transparent px-2 py-1 text-xs text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      disabled={busy}
                      onClick={(event) => {
                        event.stopPropagation();
                        setPendingConfirmDeleteId(session.id);
                      }}
                      type="button"
                    >
                      删除
                    </button>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{formatSessionTime(session.updated_at)}</span>
                  <span>{active ? "当前打开" : "点击切换"}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-3 border-t border-white/80 pt-3">
        {accountOpen ? (
          <div className="mb-3 rounded-[1.4rem] border border-white/80 bg-white/92 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
            <AccountMenu
              busy={busy}
              currentUser={currentUser}
              settingsOpen={settingsOpen}
              onLogout={onLogout}
              onToggleSettings={() => setSettingsOpen((open) => !open)}
            />
          </div>
        ) : null}
        <button
          aria-expanded={accountOpen}
          className="flex w-full items-center gap-3 rounded-[1.25rem] border border-white/80 bg-white/72 px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-white"
          onClick={() => {
            setAccountOpen((open) => !open);
            setSettingsOpen(false);
          }}
          type="button"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-sm">
            {userInitial(currentUser)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-900">{displayName}</span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">个人账户</span>
          </span>
          <span className="text-lg leading-none text-slate-400">{accountOpen ? "⌄" : "›"}</span>
        </button>
      </div>
    </aside>
  );
}

function AccountMenu({
  busy,
  currentUser,
  settingsOpen,
  onLogout,
  onToggleSettings,
}: {
  busy: boolean;
  currentUser: CurrentUser;
  settingsOpen: boolean;
  onLogout: () => void;
  onToggleSettings: () => void;
}) {
  const displayName = currentUser.display_name || currentUser.username;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-[1.1rem] bg-slate-50 px-3 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
          {userInitial(currentUser)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-900">{displayName}</span>
          <span className="block truncate text-xs text-slate-500">{currentUser.username}</span>
        </span>
      </div>

      <button
        className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        onClick={onToggleSettings}
        type="button"
      >
        <SettingsIcon />
        个人设置
      </button>

      {settingsOpen ? (
        <div className="rounded-[1rem] border border-slate-100 bg-slate-50/80 px-3 py-3 text-xs leading-5 text-slate-500">
          <div className="flex items-center justify-between gap-3">
            <span>账号</span>
            <span className="truncate font-semibold text-slate-700">{currentUser.username}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span>显示名称</span>
            <span className="truncate font-semibold text-slate-700">{displayName}</span>
          </div>
        </div>
      ) : null}

      <button
        className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-55"
        disabled={busy}
        onClick={onLogout}
        type="button"
      >
        <LogoutIcon />
        退出登录
      </button>
    </div>
  );
}

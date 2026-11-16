// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { useMediaQuery } from "@wirefront/ui/hooks/use-media-query";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ChevronLeftIcon, PlusIcon, SendIcon, SettingsIcon, UsersIcon } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

import type { ChatChannel, ChatDirect, ChatMessage, ChatWorkspaceSummary, SendChatInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("chatWorkspace.<key>"). */
export const CHAT_WORKSPACE_MESSAGES = {
  workspaces: "Workspaces",
  addWorkspace: "Add workspace",
  channelsRegion: "Channels",
  channelsNav: "Channels and messages",
  members: "{count} members",
  channels: "Channels",
  directs: "Direct messages",
  unread: "Unread",
  unreadCount: "{count} unread",
  online: "online",
  away: "away",
  offline: "offline",
  closeList: "Close channel list",
  showList: "Show channel list",
  showMembers: "Members, {count}",
  channelSettings: "Channel settings",
  today: "Today",
  yesterday: "Yesterday",
  replies: "{count} replies",
  repliesOne: "1 reply",
  lastReply: "last reply {when}",
  messageChannel: "Message #{name}",
  send: "Send",
  empty: "No messages yet. Say hello.",
};

export interface ChatWorkspaceProps {
  workspaces: ChatWorkspaceSummary[];
  currentWorkspaceId: string;
  onSwitchWorkspace: (id: string) => void;
  /** Create a workspace. Hidden when not given. */
  onAddWorkspace?: () => void;
  memberCount: number;
  channels: ChatChannel[];
  directs: ChatDirect[];
  /** The open channel or direct message. */
  activeId: string;
  onSelect: (id: string) => void;
  /** The open channel's messages, oldest first. */
  messages: ChatMessage[];
  /** Post a message (sendMessage). The box clears when it succeeds. */
  onSend: Action<SendChatInput>;
  /** Open a message's thread. Thread summaries aren't buttons without it. */
  onOpenThread?: (message: ChatMessage) => void;
  /** Show the member list. Hidden when not given. */
  onShowMembers?: () => void;
  /** Open channel settings. Hidden when not given. */
  onChannelSettings?: () => void;
  className?: string;
}

const TINT = [
  "",
  "from-category-1/70 to-category-1/30",
  "from-category-2/70 to-category-2/30",
  "from-category-3/70 to-category-3/30",
  "from-category-4/70 to-category-4/30",
  "from-category-5/70 to-category-5/30",
  "from-category-6/70 to-category-6/30",
  "from-category-7/70 to-category-7/30",
  "from-category-8/70 to-category-8/30",
];
const PRESENCE = { online: "bg-category-2", away: "bg-category-3", offline: "bg-muted-foreground/40" };
const row = "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11";
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

function ChatWorkspaceScreen({
  workspaces,
  currentWorkspaceId,
  onSwitchWorkspace,
  onAddWorkspace,
  memberCount,
  channels,
  directs,
  activeId,
  onSelect,
  messages,
  onSend,
  onOpenThread,
  onShowMembers,
  onChannelSettings,
  className,
}: ChatWorkspaceProps) {
  const t = useMessages("chatWorkspace", CHAT_WORKSPACE_MESSAGES);
  const format = useFormat();
  const { now } = useWirefront();
  // Phones (< md) use a drawer: the rail + channel list slide over the
  // conversation. Picking a channel closes the list; the rail stays.
  const [drawerOpen, setDrawerOpen] = useState(true);
  const isPhone = useMediaQuery("max-md");
  const [draft, setDraft] = useState("");
  const send = useAction(onSend, { onSuccess: () => setDraft("") });
  const workspace = workspaces.find((w) => w.id === currentWorkspaceId) ?? workspaces[0];
  const channel = channels.find((c) => c.id === activeId);
  const direct = directs.find((d) => d.id === activeId);
  const title = channel?.name ?? direct?.name ?? "";
  const channelsHidden = isPhone && !drawerOpen;
  const conversationCovered = isPhone && drawerOpen;

  const pick = (id: string) => {
    onSelect(id);
    setDrawerOpen(false);
  };

  const dayKey = (iso: string) => format.date(iso, { year: "numeric", month: "2-digit", day: "2-digit" });
  const dayLabel = (iso: string) => {
    const today = dayKey(now().toISOString());
    const yesterday = dayKey(new Date(now().getTime() - 86_400_000).toISOString());
    const key = dayKey(iso);
    return key === today ? t.today : key === yesterday ? t.yesterday : format.date(iso, { weekday: "long", month: "short", day: "numeric" });
  };

  const submit = () => {
    if (!draft.trim()) return;
    void send.run({ channelId: activeId, body: draft.trim() });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter adds a line.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className={cn("min-h-svh bg-background text-foreground md:grid md:grid-cols-[64px_240px_minmax(0,1fr)]", className)}>
      {/* Workspace rail: always visible, pinned to the start edge on phones. */}
      <aside
        aria-label={t.workspaces}
        className="fixed inset-y-0 start-0 z-40 flex w-16 flex-col items-center gap-2 border-border/60 border-e bg-background py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:sticky md:top-0 md:z-auto md:h-svh md:w-auto md:bg-foreground/[0.02] md:pt-3"
      >
        {workspaces.map((w) => {
          const active = w.id === workspace?.id;
          return (
            <div className="relative flex w-full justify-center" key={w.id}>
              <button
                aria-current={active ? "true" : undefined}
                aria-label={w.name}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg bg-gradient-to-br font-medium text-[12px] text-foreground/85 outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hover:scale-100 pointer-coarse:size-11",
                  TINT[w.color],
                )}
                onClick={() => {
                  if (!active) onSwitchWorkspace(w.id);
                  setDrawerOpen(true);
                }}
                type="button"
              >
                <span aria-hidden>{w.name.charAt(0).toUpperCase()}</span>
              </button>
              {active ? <span aria-hidden className="absolute top-1/2 start-0 h-5 w-1 -translate-y-1/2 rounded-e bg-foreground" /> : null}
            </div>
          );
        })}
        {onAddWorkspace ? (
          <button
            aria-label={t.addWorkspace}
            className="flex size-9 items-center justify-center rounded-lg border border-border/70 border-dashed text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground pointer-coarse:size-11"
            onClick={onAddWorkspace}
            type="button"
          >
            <PlusIcon className="size-4" />
          </button>
        ) : null}
      </aside>

      {/* Scrim over the visible strip of conversation while the drawer is open. */}
      <button
        aria-label={t.closeList}
        className={cn("fixed inset-0 z-30 bg-black/45 transition-opacity duration-200 motion-reduce:transition-none md:hidden", drawerOpen ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setDrawerOpen(false)}
        tabIndex={-1}
        type="button"
      />

      <aside
        aria-label={t.channelsRegion}
        className={cn(
          "flex flex-col border-border/60 bg-background max-md:fixed max-md:inset-y-0 max-md:start-16 max-md:z-40 max-md:w-[calc(78vw-4rem)] max-md:max-w-[300px] max-md:pt-[env(safe-area-inset-top)] max-md:shadow-2xl max-md:transition-[translate,opacity] max-md:duration-200 motion-reduce:transition-none md:sticky md:top-0 md:h-svh md:border-e md:bg-foreground/[0.015]",
          !drawerOpen && "max-md:pointer-events-none max-md:-translate-x-full max-md:opacity-0 max-md:rtl:translate-x-full",
        )}
        inert={channelsHidden || undefined}
      >
        <div className="border-border/60 border-b px-3 py-3">
          <div className="font-heading text-sm">{workspace?.name}</div>
          <div className="mt-0.5 text-muted-foreground text-xs">{interpolate(t.members, { count: memberCount })}</div>
        </div>
        <nav aria-label={t.channelsNav} className="flex-1 overflow-y-auto px-1.5 py-2">
          <h2 className="mt-1 mb-1 px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t.channels}</h2>
          <ul className="flex flex-col gap-0.5">
            {channels.map((c) => {
              const active = c.id === activeId;
              return (
                <li key={c.id}>
                  <button
                    aria-current={active ? "page" : undefined}
                    className={cn(row, active ? "bg-foreground/[0.08] text-foreground" : c.unread ? "font-medium text-foreground hover:bg-foreground/[0.04]" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground")}
                    onClick={() => pick(c.id)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span aria-hidden className="opacity-60">
                        #
                      </span>
                      <span className="truncate">{c.name}</span>
                    </span>
                    {c.unread ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary">
                        <span className="sr-only">{t.unread}</span>
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <h2 className="mt-4 mb-1 px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t.directs}</h2>
          <ul className="flex flex-col gap-0.5">
            {directs.map((d) => {
              const active = d.id === activeId;
              return (
                <li key={d.id}>
                  <button
                    aria-current={active ? "page" : undefined}
                    className={cn(row, active ? "bg-foreground/[0.08] text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground")}
                    onClick={() => pick(d.id)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span aria-hidden className="relative">
                        <span className="flex size-5 items-center justify-center rounded-full bg-foreground/10 font-medium text-[10px] text-foreground">{initialsOf(d.name)}</span>
                        <span className={cn("absolute -end-0.5 -bottom-0.5 size-1.5 rounded-full ring-2 ring-background", PRESENCE[d.presence])} />
                      </span>
                      <span className="truncate">{d.name}</span>
                      <span className="sr-only">, {t[d.presence]}</span>
                    </span>
                    {d.unread ? (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 font-mono text-[10px] text-primary-foreground">
                        <span aria-hidden>{d.unread}</span>
                        <span className="sr-only">, {interpolate(t.unreadCount, { count: d.unread })}</span>
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className="flex min-h-svh min-w-0 flex-col max-md:ps-16 md:h-svh" inert={conversationCovered || undefined}>
        <header className="sticky top-0 z-10 flex items-center gap-2 border-border/60 border-b bg-background/95 px-2 py-2 backdrop-blur sm:gap-3 md:static md:px-5 md:py-3">
          <button
            aria-expanded={drawerOpen}
            aria-label={t.showList}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground md:hidden"
            onClick={() => setDrawerOpen(true)}
            type="button"
          >
            <ChevronLeftIcon className="size-5 rtl:rotate-180" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            {channel ? (
              <span aria-hidden className="text-muted-foreground">
                #
              </span>
            ) : null}
            <h1 className="truncate font-heading text-base">{title}</h1>
            {channel?.topic ? <span className="hidden truncate text-muted-foreground text-xs xl:inline">{channel.topic}</span> : null}
          </div>
          <div className="ms-auto flex shrink-0 items-center gap-1">
            {channel && onShowMembers ? (
              <button
                aria-label={interpolate(t.showMembers, { count: channel.memberCount })}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground pointer-coarse:size-11"
                onClick={onShowMembers}
                type="button"
              >
                <UsersIcon className="size-4" />
              </button>
            ) : null}
            {channel && onChannelSettings ? (
              <button
                aria-label={t.channelSettings}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground pointer-coarse:size-11"
                onClick={onChannelSettings}
                type="button"
              >
                <SettingsIcon className="size-4" />
              </button>
            ) : null}
          </div>
        </header>

        <ol aria-label={title} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 md:px-5">
          {messages.length === 0 ? <li className="m-auto text-muted-foreground text-sm">{t.empty}</li> : null}
          {messages.map((m, i) => {
            const newDay = i === 0 || dayKey(m.at) !== dayKey((messages[i - 1] as ChatMessage).at);
            return (
              <li className="flex flex-col gap-2" key={m.id}>
                {newDay ? (
                  <div className="flex items-center gap-3 py-1">
                    <div aria-hidden className="h-px flex-1 bg-border/60" />
                    <span className="rounded-full border border-border/60 bg-card px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{dayLabel(m.at)}</span>
                    <div aria-hidden className="h-px flex-1 bg-border/60" />
                  </div>
                ) : null}
                <div className="flex gap-3">
                  <div aria-hidden className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br font-medium text-[11px] text-foreground/85", TINT[m.author.color])}>
                    {initialsOf(m.author.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-sm">{m.author.name}</span>
                      <time className="font-mono text-[10px] text-muted-foreground" dateTime={m.at}>
                        {format.time(m.at)}
                      </time>
                    </div>
                    <p className="mt-0.5 whitespace-pre-line text-foreground text-sm leading-relaxed">{m.body}</p>
                  </div>
                </div>
                {m.thread ? (
                  onOpenThread ? (
                    <button
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 self-start rounded-md border border-border/60 bg-card/60 px-2.5 py-1.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring sm:ms-12 pointer-coarse:min-h-11"
                      onClick={() => onOpenThread(m)}
                      type="button"
                    >
                      <span className="text-foreground text-xs">{m.thread.replies === 1 ? t.repliesOne : interpolate(t.replies, { count: m.thread.replies })}</span>
                      <span aria-hidden className="text-muted-foreground text-xs">
                        ·
                      </span>
                      <span className="text-muted-foreground text-xs">{interpolate(t.lastReply, { when: format.relative(m.thread.lastReplyAt) })}</span>
                    </button>
                  ) : (
                    <p className="self-start text-muted-foreground text-xs sm:ms-12">{m.thread.replies === 1 ? t.repliesOne : interpolate(t.replies, { count: m.thread.replies })}</p>
                  )
                ) : null}
              </li>
            );
          })}
        </ol>

        <div className="sticky bottom-0 bg-background px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:static md:px-5 md:pb-5">
          {send.error ? (
            <p className="mb-2 text-destructive-foreground text-sm" role="alert">
              {send.error}
            </p>
          ) : null}
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-3 focus-within:ring-2 focus-within:ring-ring">
            <textarea
              aria-label={interpolate(t.messageChannel, { name: title })}
              className="min-h-10 flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground md:min-h-[56px]"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={interpolate(t.messageChannel, { name: title })}
              rows={2}
              value={draft}
            />
            <button
              aria-busy={send.isPending()}
              className="flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1 font-medium text-[12px] text-background transition-opacity hover:opacity-90 disabled:opacity-50 pointer-coarse:min-h-11 pointer-coarse:px-4"
              disabled={send.isPending() || !draft.trim()}
              onClick={submit}
              type="button"
            >
              {send.isPending() ? <Spinner className="size-3.5" /> : <SendIcon aria-hidden className="size-3.5" />}
              {t.send}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export function ChatWorkspace(props: ChatWorkspaceProps) {
  return (
    <ScreenBoundary name="ChatWorkspace">
      <ChatWorkspaceScreen {...props} />
    </ScreenBoundary>
  );
}

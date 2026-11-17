// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { BellIcon, BellOffIcon, MessageSquareIcon, SmilePlusIcon, XIcon } from "lucide-react";
import { Fragment, useEffect, useId, useRef, useState } from "react";
import type { PanelComment, Reaction } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("threadPanel.<key>"). */
export const THREAD_PANEL_MESSAGES = {
  title: "Conversation",
  replies: "{count} replies",
  close: "Close conversation",
  participants: "{count} participants",
  on: "On · {subject}",
  subscribed: "Subscribed",
  subscribe: "Subscribe",
  reaction: "{emoji} {count} reactions",
  addReaction: "Add reaction",
  replyLabel: "Reply",
  placeholder: "Reply, or @mention someone…",
  shortcut: "⌘ + ↵ to send",
  send: "Reply",
};

/** Reactions offered by the add-reaction menu unless you pass your own. */
export const DEFAULT_REACTIONS = ["👍", "👀", "🚀", "🎉", "❤️"];

export interface ThreadPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  comments: PanelComment[];
  /** The signed-in user, shown on a reply while it saves. */
  currentUser: { name: string };
  /** Saves a reply. It appears at once and is removed again if this fails. */
  onReply: Action<{ body: string }>;
  /** Adds or removes the user's reaction; reactions are read-only without it. */
  onReact?: Action<{ commentId: string; emoji: string; mine: boolean }>;
  reactionChoices?: string[];
  /** Whether the user follows the conversation; the toggle is hidden without onSubscribedChange. */
  subscribed?: boolean;
  onSubscribedChange?: (subscribed: boolean) => void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Plain text with `code` and @mentions highlighted. */
function RichText({ text }: { text: string }) {
  let at = 0;
  return text.split(/(`[^`]+`|(?<![\w.])@[\w.-]+)/g).map((part) => {
    const key = at;
    at += part.length;
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) return <code key={key}>{part.slice(1, -1)}</code>;
    if (part.length > 1 && part.startsWith("@")) return <span className="rounded bg-primary/15 px-1 font-medium text-primary" key={key}>{part}</span>;
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function toggleReaction(list: Reaction[] = [], emoji: string, mine: boolean): Reaction[] {
  const found = list.find((r) => r.emoji === emoji);
  if (!found) return mine ? [...list, { emoji, count: 1, mine: true }] : list;
  return list
    .map((r) => (r.emoji === emoji ? { ...r, mine, count: r.count + (mine ? 1 : -1) } : r))
    .filter((r) => r.count > 0);
}

// A real Sheet (focus trap, Esc, labelled): full width on phones, 420px from sm. The composer
// sits above the home indicator.
function ThreadPanelScreen({ open, onOpenChange, subject, comments: initial, currentUser, onReply, onReact, reactionChoices = DEFAULT_REACTIONS, subscribed, onSubscribedChange }: ThreadPanelProps) {
  const t = useMessages("threadPanel", THREAD_PANEL_MESSAGES);
  const fmt = useFormat();
  const { now } = useWirefront();
  const tempId = useId();
  const seq = useRef(0);
  const [comments, setComments] = useState(initial);
  useEffect(() => setComments(initial), [initial]);
  const [draft, setDraft] = useState("");
  const setMine = (commentId: string, emoji: string, mine: boolean) => setComments((cs) => cs.map((c) => (c.id === commentId ? { ...c, reactions: toggleReaction(c.reactions, emoji, mine) } : c)));
  const react = useAction(onReact ?? (async () => {}), {
    optimistic: ({ commentId, emoji, mine }) => {
      setMine(commentId, emoji, mine);
      return () => setMine(commentId, emoji, !mine);
    },
  });
  const reply = useAction(onReply, {
    optimistic: ({ body }) => {
      const id = `${tempId}-${++seq.current}`;
      setComments((c) => [...c, { id, author: currentUser, createdAt: now().toISOString(), body }]);
      return () => setComments((c) => c.filter((x) => x.id !== id));
    },
  });
  const send = () => {
    const body = draft.trim();
    if (!body) return;
    reply.run({ body });
    setDraft("");
  };
  const participants = [...new Set(comments.map((c) => c.author.name))];
  const error = reply.error ?? react.error;

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="h-svh w-full max-w-none sm:max-w-[420px]" showCloseButton={false} side="right">
        <header className="border-border/60 border-b px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <MessageSquareIcon aria-hidden className="size-3.5 shrink-0 opacity-70" />
              <SheetTitle className="font-medium text-sm">{t.title}</SheetTitle>
              <span className="rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{interpolate(t.replies, { count: comments.length })}</span>
            </div>
            <SheetClose aria-label={t.close} className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10">
              <XIcon aria-hidden className="size-3.5" />
            </SheetClose>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center -space-x-1.5">
              {participants.map((name) => (
                <Avatar aria-hidden className="size-5 ring-2 ring-background" key={name}>
                  <AvatarFallback className="text-[9px]">{initials(name)}</AvatarFallback>
                </Avatar>
              ))}
              <span className="sr-only">{interpolate(t.participants, { count: participants.length })}</span>
            </div>
            <div className="min-w-0 truncate font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{interpolate(t.on, { subject })}</div>
            {onSubscribedChange ? (
              <button aria-pressed={Boolean(subscribed)} className="ms-auto inline-flex min-h-8 items-center gap-1 rounded px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] outline-none transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10" onClick={() => onSubscribedChange(!subscribed)} type="button">
                {subscribed ? <BellIcon aria-hidden className="size-3" /> : <BellOffIcon aria-hidden className="size-3" />}
                {subscribed ? t.subscribed : t.subscribe}
              </button>
            ) : null}
          </div>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {comments.map((c) => (
            <article className="space-y-1" key={c.id}>
              <div className="flex items-center gap-2">
                <Avatar aria-hidden className="size-7">
                  <AvatarFallback className="text-[11px]">{initials(c.author.name)}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{c.author.name}</span>
                <time className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]" dateTime={c.createdAt}>
                  {fmt.relative(c.createdAt)}
                </time>
              </div>
              <p className="ms-9 text-muted-foreground text-sm leading-relaxed [&_code]:rounded [&_code]:bg-foreground/[0.06] [&_code]:px-1 [&_code]:font-mono [&_code]:text-[12px]">
                <RichText text={c.body} />
              </p>
              {c.reactions?.length || onReact ? (
                <div className="ms-9 flex flex-wrap items-center gap-1.5 pt-1">
                  {c.reactions?.map((r) => (
                    <button
                      aria-label={interpolate(t.reaction, { emoji: r.emoji, count: r.count })}
                      aria-pressed={Boolean(r.mine)}
                      className={cn("inline-flex min-h-7 items-center gap-1 rounded-full border px-2 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default pointer-coarse:min-h-9", r.mine ? "border-foreground/30 bg-foreground/[0.06]" : "border-border/60 bg-background/40 hover:border-border")}
                      disabled={!onReact}
                      key={r.emoji}
                      onClick={() => react.run({ commentId: c.id, emoji: r.emoji, mine: !r.mine }, `${c.id}:${r.emoji}`)}
                      type="button"
                    >
                      <span aria-hidden>{r.emoji}</span>
                      <span aria-hidden className="font-mono text-[10px]">{r.count}</span>
                    </button>
                  ))}
                  {onReact ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger aria-label={t.addReaction} className="ms-1 grid min-h-7 min-w-7 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-9 pointer-coarse:min-w-9">
                        <SmilePlusIcon aria-hidden className="size-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="flex min-w-0 gap-0.5 p-1">
                        {reactionChoices.map((emoji) => (
                          <DropdownMenuItem className="justify-center px-2 text-base" key={emoji} onClick={() => react.run({ commentId: c.id, emoji, mine: true }, `${c.id}:${emoji}`)}>
                            {emoji}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
        <footer className="border-border/60 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <form
            className="rounded-lg border border-border/60 bg-background/40 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              aria-label={t.replyLabel}
              className="w-full resize-none bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={t.placeholder}
              rows={2}
              value={draft}
            />
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] pointer-coarse:invisible">{t.shortcut}</span>
              <Button disabled={!draft.trim()} size="sm" type="submit">
                {t.send}
              </Button>
            </div>
            {error ? (
              <p className="mt-1 text-destructive text-xs" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        </footer>
      </SheetContent>
    </Sheet>
  );
}

export function ThreadPanel(props: ThreadPanelProps) {
  return (
    <ScreenBoundary name="ThreadPanel">
      <ThreadPanelScreen {...props} />
    </ScreenBoundary>
  );
}

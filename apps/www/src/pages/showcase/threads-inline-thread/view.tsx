// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@wirefront/ui/sheet";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { MessageSquareIcon } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { ThreadComment } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("inlineThread.<key>"). */
export const INLINE_THREAD_MESSAGES = {
  rail: "Comments",
  sheetTitle: "Comment thread",
  openThread: "Open thread, {count} comments",
  heading: "Thread · {count} comments",
  anchored: "Anchored",
  reply: "Reply",
  replyLabel: "Reply to thread",
  placeholder: "Reply…",
  shortcut: "⌘ + ↵ to send",
  send: "Send",
  resolve: "Resolve thread",
};

export interface InlineThreadProps {
  /** Document content before the anchored passage. */
  before?: ReactNode;
  /** The passage the thread is anchored to. */
  anchor: ReactNode;
  /** Document content after it. */
  after?: ReactNode;
  comments: ThreadComment[];
  /** The signed-in user, shown on a reply while it saves. */
  currentUser: { name: string };
  /** Saves a reply. It appears at once and is removed again if this fails. */
  onReply: Action<{ body: string }>;
  /** Resolve the thread. The button is hidden without it. */
  onResolve?: () => void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Thread({ comments, onReply, onResolve, error, t }: { comments: ThreadComment[]; onReply: (body: string) => void; onResolve?: () => void; error?: string; t: typeof INLINE_THREAD_MESSAGES }) {
  const fmt = useFormat();
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const send = () => {
    const body = draft.trim();
    if (!body) return;
    onReply(body);
    setDraft("");
  };
  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
        <MessageSquareIcon aria-hidden className="size-3" />
        {interpolate(t.heading, { count: comments.length })}
      </h2>
      <div className="mt-1 flex items-center gap-2 rounded-md bg-category-3/[0.06] px-2.5 py-1 ring-1 ring-category-3/20 lg:-ms-6 lg:rounded-s-none">
        <span aria-hidden className="size-1.5 rounded-full bg-category-3" />
        <span className="font-mono text-[10px] text-category-3-foreground uppercase tracking-[0.25em]">{t.anchored}</span>
      </div>
      {comments.map((c) => (
        <article className="space-y-1" key={c.id}>
          <div className="flex items-center gap-2">
            <Avatar aria-hidden className="size-6">
              <AvatarFallback className="text-[10px]">{initials(c.author.name)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{c.author.name}</span>
            <time className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]" dateTime={c.createdAt}>
              {fmt.relative(c.createdAt)}
            </time>
          </div>
          <p className="ms-8 text-muted-foreground text-sm leading-relaxed">{c.body}</p>
          <div className="ms-6 flex items-center gap-1">
            <button className="min-h-8 rounded px-2 font-mono text-[11px] text-muted-foreground outline-none transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10" onClick={() => inputRef.current?.focus()} type="button">
              {t.reply}
            </button>
          </div>
        </article>
      ))}
      <form
        className="mt-3 rounded-lg border border-border/60 bg-background/40 p-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          aria-label={t.replyLabel}
          className="h-9 w-full bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
          enterKeyHint="send"
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.placeholder}
          ref={inputRef}
          value={draft}
        />
        <div className="flex items-center justify-between gap-2 border-border/40 border-t pt-2">
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] pointer-coarse:invisible">{t.shortcut}</span>
          <Button disabled={!draft.trim()} size="sm" type="submit">
            {t.send}
          </Button>
        </div>
        {error ? (
          <p className="mt-2 text-destructive text-xs" role="alert">
            {error}
          </p>
        ) : null}
      </form>
      {onResolve ? (
        <button className="min-h-8 rounded px-1.5 font-mono text-[11px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10" onClick={onResolve} type="button">
          {t.resolve}
        </button>
      ) : null}
    </div>
  );
}

// lg+: the document with the thread in a margin rail. Below lg: one column; the anchored passage
// carries a comment badge that opens the same thread in a bottom sheet.
function InlineThreadScreen({ before, anchor, after, comments: initial, currentUser, onReply, onResolve }: InlineThreadProps) {
  const t = useMessages("inlineThread", INLINE_THREAD_MESSAGES);
  const { now } = useWirefront();
  const tempId = useId();
  const seq = useRef(0);
  const [comments, setComments] = useState(initial);
  useEffect(() => setComments(initial), [initial]);
  const reply = useAction(onReply, {
    optimistic: ({ body }) => {
      const id = `${tempId}-${++seq.current}`;
      setComments((c) => [...c, { id, author: currentUser, createdAt: now().toISOString(), body }]);
      return () => setComments((c) => c.filter((x) => x.id !== id));
    },
  });
  const thread = (
    <Thread comments={comments} error={reply.error} onReply={(body) => reply.run({ body })} onResolve={onResolve} t={t} />
  );

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 py-8 sm:px-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="min-w-0">
          {before}
          <div className="relative mt-4">
            <div className="rounded-md bg-category-3/[0.08] px-3 py-2 text-foreground/90 text-sm leading-relaxed ring-1 ring-category-3/30">{anchor}</div>
            <Sheet>
              <SheetTrigger
                aria-label={interpolate(t.openThread, { count: comments.length })}
                className="absolute -end-2 -top-3 inline-flex min-h-8 items-center gap-1 rounded-full bg-category-3 px-2.5 font-mono text-[11px] text-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:hidden pointer-coarse:min-h-10"
              >
                <MessageSquareIcon aria-hidden className="size-3" />
                {comments.length}
              </SheetTrigger>
              <SheetContent className="max-h-[85svh] pb-[env(safe-area-inset-bottom)]" side="bottom">
                <SheetTitle className="sr-only">{t.sheetTitle}</SheetTitle>
                <div className="overflow-y-auto p-4">{thread}</div>
              </SheetContent>
            </Sheet>
          </div>
          {after}
        </article>
        <aside aria-label={t.rail} className="border-border/60 border-s ps-6 max-lg:hidden">
          {thread}
        </aside>
      </div>
    </div>
  );
}

export function InlineThread(props: InlineThreadProps) {
  return (
    <ScreenBoundary name="InlineThread">
      <InlineThreadScreen {...props} />
    </ScreenBoundary>
  );
}

// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckCircle2Icon, ChevronDownIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { ResolvedThread } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("resolvedThreads.<key>"). */
export const RESOLVED_THREADS_MESSAGES = {
  eyebrow: "Comments · Resolved",
  title: "Resolved threads",
  filter: "Thread status",
  open: "Open · {count}",
  resolved: "Resolved · {count}",
  replies: "{count} more replies",
  resolvedBy: "Resolved by {name}",
  by: "by",
  reopen: "Reopen",
  reopenLabel: "Reopen thread by {name}",
  expand: "Expand thread",
  collapse: "Collapse thread",
  empty: "No resolved threads yet.",
};

export interface ResolvedThreadsProps {
  threads: ResolvedThread[];
  /** How many threads are still open, shown on the Open filter. */
  openCount: number;
  /** Switch to open threads. The Open filter is a plain label without it. */
  onShowOpen?: () => void;
  /** Reopens a thread. It leaves the list at once and comes back if this fails. */
  onReopen: Action<{ id: string }>;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const segment = "min-h-8 rounded px-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10";

function ResolvedThreadsScreen({ threads: initial, openCount, onShowOpen, onReopen }: ResolvedThreadsProps) {
  const t = useMessages("resolvedThreads", RESOLVED_THREADS_MESSAGES);
  const fmt = useFormat();
  const uid = useId();
  const [threads, setThreads] = useState(initial);
  useEffect(() => setThreads(initial), [initial]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const reopen = useAction(onReopen, {
    optimistic: ({ id }) => {
      const at = threads.findIndex((x) => x.id === id);
      const item = threads[at];
      setThreads((ts) => ts.filter((x) => x.id !== id));
      // Put back only this thread, so a failed reopen doesn't undo another one that succeeded.
      return () => setThreads((ts) => (item && !ts.some((x) => x.id === id) ? [...ts.slice(0, at), item, ...ts.slice(at)] : ts));
    },
  });

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
            <h1 className="mt-1 font-heading text-2xl sm:text-3xl">{t.title}</h1>
          </div>
          <fieldset className="m-0 inline-flex min-w-0 items-center gap-1 self-start rounded-md border border-border/60 bg-background/40 p-0.5 font-mono text-[10px] uppercase tracking-[0.25em]">
            <legend className="sr-only">{t.filter}</legend>
            {onShowOpen ? (
              <button aria-pressed={false} className={cn(segment, "text-muted-foreground hover:text-foreground")} onClick={onShowOpen} type="button">
                {interpolate(t.open, { count: openCount })}
              </button>
            ) : (
              <span className={cn(segment, "inline-flex items-center text-muted-foreground")}>{interpolate(t.open, { count: openCount })}</span>
            )}
            <button aria-pressed className={cn(segment, "bg-foreground text-background")} type="button">
              {interpolate(t.resolved, { count: threads.length })}
            </button>
          </fieldset>
        </div>
        {reopen.error ? (
          <p className="mt-4 text-destructive text-sm" role="alert">
            {reopen.error}
          </p>
        ) : null}
        {threads.length === 0 ? <p className="mt-8 text-muted-foreground text-sm">{t.empty}</p> : null}
        <ul className="mt-8 flex flex-col gap-3">
          {threads.map((x) => {
            const isOpen = expanded.includes(x.id);
            const previewId = `${uid}-${x.id}`;
            return (
              <li className="group overflow-hidden rounded-lg border border-border/60 bg-background/40 transition-colors hover:border-border" key={x.id}>
                <div className="flex items-start gap-3 px-3 py-3 sm:items-center sm:px-4">
                  <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-category-2/15 text-category-2-foreground">
                    <CheckCircle2Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Avatar aria-hidden className="size-5">
                        <AvatarFallback className="text-[9px]">{initials(x.author.name)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate font-medium text-sm">{x.author.name}</span>
                      <time className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]" dateTime={x.createdAt}>
                        {fmt.relative(x.createdAt)}
                      </time>
                      {x.replyCount > 0 ? (
                        <span className="ms-1 rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                          <span aria-hidden>+{x.replyCount}</span>
                          <span className="sr-only">{interpolate(t.replies, { count: x.replyCount })}</span>
                        </span>
                      ) : null}
                    </div>
                    {/* Two lines collapsed (not a ~20-char truncate), full when expanded. */}
                    <p className={cn("mt-1 text-muted-foreground text-sm", !isOpen && "line-clamp-2")} id={previewId}>
                      {x.preview}
                    </p>
                    <span className="sr-only">{interpolate(t.resolvedBy, { name: x.resolvedBy.name })}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <span aria-hidden className="hidden items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:flex">
                      {t.by}
                      <Avatar className="size-4">
                        <AvatarFallback className="text-[8px]">{initials(x.resolvedBy.name)}</AvatarFallback>
                      </Avatar>
                      {x.resolvedBy.name.split(/\s+/)[0]}
                    </span>
                    <Button aria-label={interpolate(t.reopenLabel, { name: x.author.name })} disabled={reopen.isPending(x.id)} onClick={() => reopen.run({ id: x.id }, x.id)} size="sm" type="button" variant="ghost">
                      {t.reopen}
                    </Button>
                    {/* Hover-revealed for mouse users; always shown on touch and when focused. */}
                    <button
                      aria-controls={previewId}
                      aria-expanded={isOpen}
                      aria-label={isOpen ? t.collapse : t.expand}
                      className="grid size-8 place-items-center rounded-md text-muted-foreground opacity-0 outline-none transition-all hover:bg-foreground/[0.05] hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 aria-expanded:opacity-100 pointer-coarse:size-10 pointer-coarse:opacity-100"
                      onClick={() => setExpanded((ids) => (isOpen ? ids.filter((id) => id !== x.id) : [...ids, x.id]))}
                      type="button"
                    >
                      <ChevronDownIcon aria-hidden className={cn("size-3.5 transition-transform", isOpen && "rotate-180")} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export function ResolvedThreads(props: ResolvedThreadsProps) {
  return (
    <ScreenBoundary name="ResolvedThreads">
      <ResolvedThreadsScreen {...props} />
    </ScreenBoundary>
  );
}

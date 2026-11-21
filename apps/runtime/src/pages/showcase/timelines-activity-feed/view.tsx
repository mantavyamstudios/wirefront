// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ActivityIcon, CheckCircle2Icon, GitCommitIcon, GitMergeIcon, HeartIcon, MessageCircleIcon, PaletteIcon, RocketIcon, UserPlusIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { ActivityEvent } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("activityFeed.<key>"). */
export const ACTIVITY_FEED_MESSAGES = {
  eyebrow: "Workspace activity",
  title: "What’s been happening",
  today: "Today",
  yesterday: "Yesterday",
  earlier: "Earlier",
  loadMore: "Load older activity",
  empty: "Nothing has happened here yet.",
  errorTitle: "Couldn’t load activity",
  retry: "Try again",
};

export interface ActivityFeedProps {
  /** Events, newest first. Leave it out while they load. */
  events?: ActivityEvent[];
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Whether older events exist. */
  hasMore?: boolean;
  /** Fetch older events and append them to `events`. The button is hidden without it or `hasMore`. */
  onLoadMore?: Action;
  className?: string;
}

const KIND: Record<ActivityEvent["kind"], { icon: ReactNode; tone: string }> = {
  ship: { icon: <RocketIcon className="size-3.5" />, tone: "bg-category-2/15 text-category-2-foreground" },
  complete: { icon: <CheckCircle2Icon className="size-3.5" />, tone: "bg-category-8/15 text-category-8-foreground" },
  comment: { icon: <MessageCircleIcon className="size-3.5" />, tone: "bg-category-1/15 text-category-1-foreground" },
  design: { icon: <PaletteIcon className="size-3.5" />, tone: "bg-category-4/15 text-category-4-foreground" },
  invite: { icon: <UserPlusIcon className="size-3.5" />, tone: "bg-category-5/15 text-category-5-foreground" },
  commit: { icon: <GitCommitIcon className="size-3.5" />, tone: "bg-category-8/15 text-category-8-foreground" },
  reaction: { icon: <HeartIcon className="size-3.5" />, tone: "bg-category-4/15 text-category-4-foreground" },
  merge: { icon: <GitMergeIcon className="size-3.5" />, tone: "bg-category-2/15 text-category-2-foreground" },
  other: { icon: <ActivityIcon className="size-3.5" />, tone: "bg-foreground/6 text-foreground" },
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ActivityFeedScreen({ events, status = "ready", error, onRetry, hasMore, onLoadMore, className }: ActivityFeedProps) {
  const t = useMessages("activityFeed", ACTIVITY_FEED_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone } = useWirefront();
  const loadMore = useAction(onLoadMore ?? (async () => {}));
  const dayKey = (d: Date | string) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
  const today = dayKey(now());
  const yesterday = dayKey(new Date(now().getTime() - 86_400_000));
  const list = events ?? [];
  const sections = [
    { id: "today", label: t.today, items: list.filter((e) => dayKey(e.at) === today) },
    { id: "yesterday", label: t.yesterday, items: list.filter((e) => dayKey(e.at) === yesterday) },
    { id: "earlier", label: t.earlier, items: list.filter((e) => dayKey(e.at) !== today && dayKey(e.at) !== yesterday) },
  ].filter((s) => s.items.length);

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-2xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>

        {status === "error" ? (
          <div className="mt-8 rounded-xl border border-border/60 py-12 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !events || status === "loading" ? (
          <div aria-busy="true" className="mt-8 flex flex-col gap-3">
            {["a", "b", "c", "d"].map((k) => (
              <Skeleton className="h-14 w-full motion-reduce:animate-none" key={k} />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <p className="mt-8 rounded-xl border border-border/60 py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
        ) : (
          <>
            {sections.map((s) => (
              <section aria-labelledby={`activity-${s.id}`} className="mt-8" key={s.id}>
                <div className="sticky top-2 z-10 mb-3 flex items-center gap-3 bg-background/90 py-2 backdrop-blur">
                  <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]" id={`activity-${s.id}`}>
                    {s.label}
                  </h2>
                  <span aria-hidden className="h-px flex-1 bg-border/40" />
                  <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{fmt.number(s.items.length)}</span>
                </div>

                <ol className="relative ps-7">
                  <span aria-hidden className="absolute inset-s-3.75 top-2 bottom-2 w-px bg-border/40" />
                  {s.items.map((e) => (
                    <li className="relative grid grid-cols-1 gap-3 py-2.5" key={e.id}>
                      <span aria-hidden className={cn("absolute -inset-s-7 top-3 z-10 grid size-7.5 place-items-center rounded-full ring-4 ring-background", KIND[e.kind].tone)}>
                        {KIND[e.kind].icon}
                      </span>
                      <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
                        <Avatar aria-hidden className="size-6">
                          <AvatarFallback className="text-[10px]">{initials(e.actor)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm">
                            <span className="font-medium">{e.actor}</span> <span className="text-muted-foreground">{e.verb}</span>
                            {e.context ? (
                              <>
                                {" "}
                                <span className="text-foreground/85">{e.context}</span>
                              </>
                            ) : null}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                            <time dateTime={e.at}>{fmt.relative(e.at)}</time>
                            {e.meta ? (
                              <>
                                <span aria-hidden>·</span>
                                <span>{e.meta}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}

            {hasMore && onLoadMore ? (
              <div className="mt-8 text-center">
                <button
                  className="inline-flex min-h-9 items-center gap-2 rounded-md px-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                  disabled={loadMore.isPending()}
                  onClick={() => void loadMore.run()}
                  type="button"
                >
                  {loadMore.isPending() ? <Spinner className="size-3" /> : null}
                  {t.loadMore}
                </button>
                {loadMore.error ? (
                  <p className="mt-2 text-destructive-foreground text-xs" role="alert">
                    {loadMore.error}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function ActivityFeed(props: ActivityFeedProps) {
  return (
    <ScreenBoundary name="ActivityFeed">
      <ActivityFeedScreen {...props} />
    </ScreenBoundary>
  );
}

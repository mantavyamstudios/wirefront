// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  useFormat,
  useMessages,
  useWirefront,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import {
  ActivityIcon,
  AtSignIcon,
  BellIcon,
  GitPullRequestIcon,
  HeartIcon,
  MessageCircleIcon,
  RocketIcon,
  SettingsIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import type { Notification } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("notificationCenter.<key>"). */
export const NOTIFICATION_CENTER_MESSAGES = {
  title: "Notifications",
  unreadCount: "unread",
  markAllRead: "Mark all read",
  filter: "Filter notifications",
  all: "All",
  unread: "Unread",
  mentions: "Mentions",
  today: "Today",
  earlier: "Earlier",
  unreadPrefix: "Unread:",
  caughtUp: "You’re all caught up.",
  seeAll: "See all activity →",
  errorTitle: "Couldn’t load notifications",
  retry: "Try again",
};

export interface NotificationCenterProps {
  /** Notifications, newest first. Leave it out while they load. */
  notifications?: Notification[];
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Mark everything read. They show read at once and revert if this fails. Hidden without it. */
  onMarkAllRead?: Action;
  /** Where "See all activity" goes. Hidden when not given. */
  allHref?: string;
  className?: string;
}

type Filter = "all" | "unread" | "mentions";
const FILTERS: Filter[] = ["all", "unread", "mentions"];
const ICONS: Record<Notification["kind"], ReactNode> = {
  mention: <AtSignIcon className="size-2" />,
  review: <GitPullRequestIcon className="size-2" />,
  reply: <MessageCircleIcon className="size-2" />,
  reaction: <HeartIcon className="size-2" />,
  settings: <SettingsIcon className="size-2" />,
  deploy: <RocketIcon className="size-2" />,
  other: <ActivityIcon className="size-2" />,
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Item({
  n,
  t,
  when,
}: {
  n: Notification;
  t: typeof NOTIFICATION_CENTER_MESSAGES;
  when: string;
}) {
  const body = (
    <>
      {!n.read ? (
        <span
          aria-hidden
          className="absolute inset-s-1.5 top-4 size-1.5 rounded-full bg-category-1"
        />
      ) : null}
      <div aria-hidden className="relative shrink-0">
        <Avatar className="size-9">
          <AvatarFallback className="text-[11px]">
            {initials(n.actor)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -inset-e-1 -bottom-1 grid size-4 place-items-center rounded-full bg-background">
          <span className="grid size-3.5 place-items-center rounded-full bg-foreground text-background">
            {ICONS[n.kind]}
          </span>
        </span>
      </div>
      <div className="min-w-0 flex-1 leading-snug">
        <div className="wrap-break-word text-sm">
          {!n.read ? <span className="sr-only">{t.unreadPrefix} </span> : null}
          <span className="font-medium">{n.actor}</span>{" "}
          <span className="text-muted-foreground">{n.verb}</span>{" "}
          {n.context ? (
            <span className="text-foreground/85">{n.context}</span>
          ) : null}
        </div>
        <time
          className="mt-0.5 block font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]"
          dateTime={n.at}
        >
          {when}
        </time>
      </div>
    </>
  );
  const row = cn(
    "relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-foreground/2",
    !n.read && "bg-foreground/1.5"
  );
  return (
    <li>
      {n.href ? (
        <WirefrontLink
          className={cn(
            row,
            "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          )}
          href={n.href}
        >
          {body}
        </WirefrontLink>
      ) : (
        <div className={row}>{body}</div>
      )}
    </li>
  );
}

function NotificationCenterScreen({
  notifications,
  status = "ready",
  error,
  onRetry,
  onMarkAllRead,
  allHref,
  className,
}: NotificationCenterProps) {
  const t = useMessages("notificationCenter", NOTIFICATION_CENTER_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone } = useWirefront();
  const [items, setItems] = useState(notifications ?? []);
  useEffect(() => setItems(notifications ?? []), [notifications]);
  const [filter, setFilter] = useState<Filter>("all");
  const markAll = useAction(onMarkAllRead ?? (async () => {}), {
    optimistic: () => {
      const before = items;
      setItems((all) => all.map((n) => ({ ...n, read: true })));
      return () => setItems(before);
    },
  });
  const dayKey = (d: Date | string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(d));
  const today = dayKey(now());
  const shown = items.filter((n) =>
    filter === "unread"
      ? !n.read
      : filter === "mentions"
        ? n.kind === "mention"
        : true
  );
  const sections = [
    {
      id: "today",
      label: t.today,
      items: shown.filter((n) => dayKey(n.at) === today),
    },
    {
      id: "earlier",
      label: t.earlier,
      items: shown.filter((n) => dayKey(n.at) !== today),
    },
  ].filter((s) => s.items.length);
  const unread = items.filter((n) => !n.read).length;

  return (
    // On phones the notification centre is a full-screen panel (no card chrome);
    // from sm up it's the familiar popover-sized card.
    <div
      className={cn(
        "min-h-svh bg-background sm:px-6 sm:py-8 lg:px-10 lg:py-10",
        className
      )}
    >
      <div className="mx-auto max-w-md">
        <section
          aria-labelledby="notification-center-title"
          className="overflow-hidden bg-background max-sm:min-h-svh sm:rounded-xl sm:border sm:border-border sm:shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 border-border/60 border-b px-4 py-3 max-sm:pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-2">
              <BellIcon aria-hidden className="size-4 opacity-70" />
              <h1
                className="font-heading text-sm"
                id="notification-center-title"
              >
                {t.title}
              </h1>
              {unread ? (
                <span className="rounded-full bg-foreground px-1.5 py-0.5 font-mono text-[10px] text-background">
                  {fmt.number(unread)}
                  <span className="sr-only"> {t.unreadCount}</span>
                </span>
              ) : null}
            </div>
            {onMarkAllRead ? (
              <button
                className="-me-2 min-h-8 rounded-md px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 pointer-coarse:min-h-10"
                disabled={!unread || markAll.isPending()}
                onClick={() => void markAll.run()}
                type="button"
              >
                {t.markAllRead}
              </button>
            ) : null}
          </div>
          {markAll.error ? (
            <p
              className="border-border/60 border-b px-4 py-2 text-destructive-foreground text-xs"
              role="alert"
            >
              {markAll.error}
            </p>
          ) : null}

          <RadioGroup
            aria-label={t.filter}
            className="flex items-center gap-1 border-border/60 border-b px-3 py-2"
            onValueChange={(v) => setFilter(v as Filter)}
            value={filter}
          >
            {FILTERS.map((f) => (
              <Radio.Root
                className="inline-flex min-h-8 cursor-pointer items-center rounded-md px-3 text-muted-foreground text-sm outline-none hover:bg-foreground/3 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground data-checked:text-background pointer-coarse:min-h-10 sm:text-xs"
                key={f}
                value={f}
              >
                {t[f]}
              </Radio.Root>
            ))}
          </RadioGroup>

          {status === "error" ? (
            <div className="px-4 py-10 text-center">
              <p className="font-medium text-sm">{t.errorTitle}</p>
              {error ? (
                <p className="mt-1 text-muted-foreground text-xs">{error}</p>
              ) : null}
              {onRetry ? (
                <Button
                  className="mt-4"
                  onClick={onRetry}
                  size="sm"
                  variant="outline"
                >
                  {t.retry}
                </Button>
              ) : null}
            </div>
          ) : !notifications || status === "loading" ? (
            <div aria-busy="true" className="flex flex-col gap-3 p-4">
              {["a", "b", "c"].map((k) => (
                <Skeleton
                  className="h-12 w-full motion-reduce:animate-none"
                  key={k}
                />
              ))}
            </div>
          ) : sections.length === 0 ? (
            <p className="px-4 py-10 text-center text-muted-foreground text-sm">
              {t.caughtUp}
            </p>
          ) : (
            sections.map((s) => (
              <div key={s.id}>
                <h2 className="bg-background px-4 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                  {s.label}
                </h2>
                <ul className="divide-y divide-border/40">
                  {s.items.map((n) => (
                    <Item key={n.id} n={n} t={t} when={fmt.relative(n.at)} />
                  ))}
                </ul>
              </div>
            ))
          )}

          {allHref ? (
            <div className="border-border/60 border-t px-4 py-1 text-center max-sm:pb-[max(0.25rem,env(safe-area-inset-bottom))]">
              <WirefrontLink
                className="inline-flex min-h-10 items-center px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                href={allHref}
              >
                {t.seeAll}
              </WirefrontLink>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export function NotificationCenter(props: NotificationCenterProps) {
  return (
    <ScreenBoundary name="NotificationCenter">
      <NotificationCenterScreen {...props} />
    </ScreenBoundary>
  );
}

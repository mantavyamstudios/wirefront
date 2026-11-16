// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ArchiveIcon, ChevronLeftIcon, InboxIcon, SearchIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { InboxFilter, InboxThread } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("inboxRail.<key>"). */
export const INBOX_RAIL_MESSAGES = {
  title: "Inbox",
  unreadCount: "{count} unread",
  search: "Search…",
  show: "Show",
  unread: "Unread",
  all: "All",
  mentions: "Mentions",
  unreadDot: "Unread",
  threadsOne: "1 thread",
  threads: "{count} threads",
  archiveRead: "Archive read",
  back: "Inbox",
  empty: "Nothing here.",
};

export interface InboxRailProps {
  /** The open conversation. On phones it replaces the list while `detailOpen`. */
  children: ReactNode;
  threads: InboxThread[];
  unread: number;
  filter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  /** Phones: show the conversation instead of the list. */
  detailOpen?: boolean;
  /** Phones: back from the conversation to the list. */
  onBack?: () => void;
  /** Open your inbox search. Hidden when not given. */
  onSearch?: () => void;
  /** Archive every read thread (archiveRead). Hidden when not given. */
  onArchiveRead?: Action;
  className?: string;
}

const FILTERS: InboxFilter[] = ["unread", "all", "mentions"];
const TINT = ["", "bg-category-1-strong", "bg-category-2-strong", "bg-category-3-strong", "bg-category-4-strong", "bg-category-5-strong", "bg-category-6-strong", "bg-category-7-strong", "bg-category-8-strong"];
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export function InboxRail({
  children,
  threads,
  unread,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  detailOpen,
  onBack,
  onSearch,
  onArchiveRead,
  className,
}: InboxRailProps) {
  const t = useMessages("inboxRail", INBOX_RAIL_MESSAGES);
  const format = useFormat();
  const archive = useAction(onArchiveRead ?? (async () => {}));
  const selected = threads.find((x) => x.id === selectedId);

  return (
    <div className={cn("min-h-svh bg-background text-foreground md:grid md:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]", className)}>
      <aside className={cn("flex min-h-svh flex-col border-border/60 bg-foreground/[0.02] md:sticky md:top-0 md:h-svh md:min-h-0 md:border-e", detailOpen && "max-md:hidden")}>
        <div className="border-border/60 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <InboxIcon aria-hidden className="size-4 opacity-70" />
            <h1 className="font-medium text-sm">{t.title}</h1>
            {unread ? (
              <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                <span aria-hidden>{unread}</span>
                <span className="sr-only">{interpolate(t.unreadCount, { count: unread })}</span>
              </span>
            ) : null}
          </div>
          {onSearch ? (
            <button
              className="mt-3 flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-start outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11"
              onClick={onSearch}
              type="button"
            >
              <SearchIcon aria-hidden className="size-3.5 opacity-50" />
              <span className="flex-1 truncate text-muted-foreground text-xs">{t.search}</span>
            </button>
          ) : null}
        </div>

        <RadioGroup
          aria-label={t.show}
          className="flex items-center gap-1 border-border/60 border-b px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em]"
          onValueChange={(v) => onFilterChange(v as InboxFilter)}
          value={filter}
        >
          {FILTERS.map((f) => (
            <Radio.Root
              className="min-h-7 cursor-pointer rounded px-2 py-1 text-muted-foreground uppercase outline-none transition-colors hover:bg-foreground/[0.03] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground/[0.08] data-checked:text-foreground pointer-coarse:min-h-11"
              key={f}
              value={f}
            >
              {t[f]}
              {f === "unread" && unread ? <span aria-hidden> · {unread}</span> : null}
            </Radio.Root>
          ))}
        </RadioGroup>

        <ul className="flex-1 overflow-y-auto">
          {threads.length === 0 ? <li className="px-4 py-10 text-center text-muted-foreground text-sm">{t.empty}</li> : null}
          {threads.map((thread) => {
            const active = thread.id === selectedId;
            return (
              <li className="border-border/40 border-b" key={thread.id}>
                <button
                  aria-current={active ? "true" : undefined}
                  className={cn("relative w-full px-4 py-3 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset", active ? "md:bg-foreground/[0.06]" : "hover:bg-foreground/[0.03]")}
                  onClick={() => onSelect(thread.id)}
                  type="button"
                >
                  {thread.unread ? (
                    <span className="absolute top-1/2 start-1.5 size-1.5 -translate-y-1/2 rounded-full bg-primary">
                      <span className="sr-only">{t.unreadDot}</span>
                    </span>
                  ) : null}
                  <div className="flex items-start gap-3">
                    <Avatar className={cn("size-8 shrink-0", TINT[thread.color])}>
                      {thread.from.avatarUrl ? <AvatarImage alt="" src={thread.from.avatarUrl} /> : null}
                      <AvatarFallback className={cn("font-medium text-[11px] text-white", TINT[thread.color])}>{initialsOf(thread.from.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-sm", thread.unread ? "font-semibold" : "font-medium")}>{thread.from.name}</span>
                        <time className="shrink-0 font-mono text-[10px] text-muted-foreground" dateTime={thread.at}>
                          {format.relative(thread.at)}
                        </time>
                      </div>
                      <p className={cn("mt-0.5 line-clamp-2 text-xs leading-snug", thread.unread ? "text-foreground/80" : "text-muted-foreground")}>{thread.preview}</p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-border/60 border-t px-4 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          <span>{threads.length === 1 ? t.threadsOne : interpolate(t.threads, { count: threads.length })}</span>
          {onArchiveRead ? (
            <button
              aria-busy={archive.isPending()}
              className="inline-flex min-h-8 items-center gap-1 rounded px-1.5 uppercase transition-colors hover:text-foreground disabled:opacity-60 pointer-coarse:min-h-11"
              disabled={archive.isPending()}
              onClick={() => void archive.run()}
              type="button"
            >
              {archive.isPending() ? <Spinner className="size-3" /> : <ArchiveIcon aria-hidden className="size-3" />}
              {t.archiveRead}
            </button>
          ) : null}
        </div>
        {archive.error ? (
          <p className="px-4 pb-2 text-destructive-foreground text-xs" role="alert">
            {archive.error}
          </p>
        ) : null}
      </aside>

      <main className={cn("flex min-h-svh min-w-0 flex-col md:min-h-0", !detailOpen && "max-md:hidden")}>
        {/* Phones: a back bar above the conversation. */}
        {onBack ? (
          <div className="sticky top-0 z-10 flex h-14 items-center gap-2 border-border/60 border-b bg-background/90 px-2 backdrop-blur md:hidden">
            <button
              className="flex min-h-11 items-center gap-1 rounded-md px-2 text-muted-foreground text-sm transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
              onClick={onBack}
              type="button"
            >
              <ChevronLeftIcon aria-hidden className="size-4 rtl:rotate-180" />
              {t.back}
            </button>
            {selected ? <span className="truncate font-medium text-sm">{selected.from.name}</span> : null}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}

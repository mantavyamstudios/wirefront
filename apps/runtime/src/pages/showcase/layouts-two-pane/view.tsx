// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { Textarea } from "@wirefront/ui/textarea";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ArchiveIcon, ChevronLeftIcon, ForwardIcon, MailIcon, MoreHorizontalIcon, ReplyAllIcon, SearchIcon, SendIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { type MailFilter, type MailMessage, MailReply } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("mailTwoPane.<key>"). */
export const MAIL_TWO_PANE_MESSAGES = {
  title: "Inbox",
  unreadCount: "{count} unread",
  show: "Show",
  all: "All",
  unread: "Unread",
  mentions: "Mentions",
  search: "Search threads",
  searchPlaceholder: "Search threads…",
  unreadDot: "Unread",
  empty: "No messages.",
  back: "Back to inbox",
  replyAll: "Reply all",
  forward: "Forward",
  archive: "Archive",
  delete: "Delete",
  more: "More actions",
  replyTo: "Reply to {name}",
  replyPlaceholder: "Reply…",
  send: "Send",
  nothingOpen: "Pick a message to read it.",
};

export interface MailTwoPaneProps {
  messages: MailMessage[];
  unread: number;
  filter: MailFilter;
  onFilterChange: (filter: MailFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
  selectedId?: string;
  /** Open a message (load its body with getMessage). */
  onSelect: (id: string) => void;
  /** Phones: show the message instead of the list. */
  detailOpen?: boolean;
  onBack?: () => void;
  /** Send a reply (replyToMessage). The box clears when it succeeds. Hidden without it. */
  onReply?: Action<MailReply>;
  /** Start a reply-all or forward in your composer. Hidden without them. */
  onReplyAll?: (message: MailMessage) => void;
  onForward?: (message: MailMessage) => void;
  /** Archive or delete (archiveMessage, deleteMessage). Hidden without them. */
  onArchive?: Action<string>;
  onDelete?: Action<string>;
  className?: string;
}

const FILTERS: MailFilter[] = ["all", "unread", "mentions"];
const TINT = ["", "bg-category-1-strong", "bg-category-2-strong", "bg-category-3-strong", "bg-category-4-strong", "bg-category-5-strong", "bg-category-6-strong", "bg-category-7-strong", "bg-category-8-strong"];
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

function MailTwoPaneScreen({
  messages,
  unread,
  filter,
  onFilterChange,
  search,
  onSearchChange,
  selectedId,
  onSelect,
  detailOpen,
  onBack,
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  className,
}: MailTwoPaneProps) {
  const t = useMessages("mailTwoPane", MAIL_TWO_PANE_MESSAGES);
  const format = useFormat();
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState<string>();
  const reply = useAction(onReply ?? (async () => {}), { onSuccess: () => setDraft("") });
  const archive = useAction(onArchive ?? (async () => {}));
  const remove = useAction(onDelete ?? (async () => {}));
  const selected = messages.find((m) => m.id === selectedId);
  const failure = invalid ?? reply.error ?? archive.error ?? remove.error;

  const send = () => {
    if (!selected) return;
    const parsed = MailReply.safeParse({ messageId: selected.id, body: draft });
    if (!parsed.success) {
      setInvalid(parsed.error.issues[0]?.message);
      return;
    }
    setInvalid(undefined);
    void reply.run(parsed.data);
  };

  const avatar = (m: MailMessage, size: string) => (
    <Avatar className={cn("shrink-0", size)}>
      <AvatarFallback className={cn("font-medium text-[11px] text-white", TINT[m.color])}>{initialsOf(m.from.name)}</AvatarFallback>
    </Avatar>
  );

  return (
    <div className={cn("min-h-svh bg-background text-foreground md:grid md:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]", className)}>
      <aside className={cn("flex flex-col border-border/60 md:sticky md:top-0 md:h-svh md:border-e", detailOpen && "max-md:hidden")}>
        <div className="sticky top-0 z-10 border-border/60 border-b bg-background px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-heading text-base">{t.title}</h1>
            <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-muted-foreground text-xs">{interpolate(t.unreadCount, { count: unread })}</span>
          </div>
          <RadioGroup aria-label={t.show} className="mt-2 flex items-center gap-1" onValueChange={(v) => onFilterChange(v as MailFilter)} value={filter}>
            {FILTERS.map((f) => (
              <Radio.Root
                className="min-h-7 cursor-pointer rounded-md px-2.5 py-1 text-muted-foreground text-xs outline-none transition-colors hover:bg-foreground/[0.03] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground/[0.08] data-checked:font-medium data-checked:text-foreground pointer-coarse:min-h-10"
                key={f}
                value={f}
              >
                {t[f]}
              </Radio.Root>
            ))}
          </RadioGroup>
          <InputGroup className="mt-2">
            <InputGroupAddon>
              <SearchIcon aria-hidden className="size-3.5 opacity-60" />
            </InputGroupAddon>
            <InputGroupInput aria-label={t.search} onChange={(e) => onSearchChange(e.target.value)} placeholder={t.searchPlaceholder} type="search" value={search} />
          </InputGroup>
        </div>

        <ul className="flex-1 md:overflow-y-auto">
          {messages.length === 0 ? <li className="px-4 py-10 text-center text-muted-foreground text-sm">{t.empty}</li> : null}
          {messages.map((m) => {
            const active = m.id === selectedId;
            return (
              <li key={m.id}>
                <button
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 border-border/40 border-b px-4 py-3 text-start outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                    active ? "md:bg-foreground/[0.06]" : "hover:bg-foreground/[0.03]",
                  )}
                  onClick={() => onSelect(m.id)}
                  type="button"
                >
                  {avatar(m, "size-9")}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5">
                        {m.unread ? (
                          <span className="size-2 shrink-0 rounded-full bg-category-1">
                            <span className="sr-only">{t.unreadDot}</span>
                          </span>
                        ) : null}
                        <span className={cn("truncate text-sm", m.unread ? "font-semibold" : "font-medium")}>{m.from.name}</span>
                      </span>
                      <time className="shrink-0 font-mono text-[10px] text-muted-foreground" dateTime={m.at}>
                        {format.relative(m.at)}
                      </time>
                    </div>
                    <div className="truncate text-sm">{m.subject}</div>
                    <p className="line-clamp-1 text-muted-foreground text-xs">{m.preview}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className={cn("flex min-h-svh min-w-0 flex-col md:h-svh md:overflow-y-auto", !detailOpen && "max-md:hidden")}>
        {selected ? (
          <>
            <div className="sticky top-0 z-10 flex items-center gap-2 border-border/60 border-b bg-background/95 px-2 py-2 backdrop-blur sm:gap-3 md:static md:px-6 md:py-4">
              {onBack ? (
                <Button aria-label={t.back} className="md:hidden" onClick={onBack} size="icon" variant="ghost">
                  <ChevronLeftIcon className="rtl:rotate-180" />
                </Button>
              ) : null}
              <span className="hidden sm:flex">{avatar(selected, "size-10")}</span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-medium text-sm">{selected.from.name}</h2>
                <div className="truncate text-muted-foreground text-xs">{selected.subject}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {onArchive ? (
                  <Button aria-label={t.archive} className="pointer-coarse:size-11" disabled={archive.isPending()} onClick={() => void archive.run(selected.id)} size="icon-sm" variant="ghost">
                    {archive.isPending() ? <Spinner /> : <ArchiveIcon />}
                  </Button>
                ) : null}
                {onDelete ? (
                  <Button aria-label={t.delete} className="pointer-coarse:size-11" disabled={remove.isPending()} onClick={() => void remove.run(selected.id)} size="icon-sm" variant="ghost">
                    {remove.isPending() ? <Spinner /> : <Trash2Icon />}
                  </Button>
                ) : null}
                {onReplyAll || onForward ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button aria-label={t.more} className="pointer-coarse:size-11 sm:hidden" size="icon-sm" variant="ghost" />}>
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onReplyAll ? (
                        <DropdownMenuItem onClick={() => onReplyAll(selected)}>
                          <ReplyAllIcon /> {t.replyAll}
                        </DropdownMenuItem>
                      ) : null}
                      {onForward ? (
                        <DropdownMenuItem onClick={() => onForward(selected)}>
                          <ForwardIcon /> {t.forward}
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            </div>

            {onReplyAll || onForward ? (
              <div className="hidden flex-wrap items-center gap-2 border-border/60 border-b px-4 py-2 sm:flex md:px-6">
                {onReplyAll ? (
                  <Button onClick={() => onReplyAll(selected)} size="sm" variant="outline">
                    <ReplyAllIcon />
                    {t.replyAll}
                  </Button>
                ) : null}
                {onForward ? (
                  <Button onClick={() => onForward(selected)} size="sm" variant="outline">
                    <ForwardIcon />
                    {t.forward}
                  </Button>
                ) : null}
              </div>
            ) : null}

            <article className="flex-1 px-4 py-6 md:px-6">
              <div className="max-w-3xl space-y-4 text-foreground/85 text-sm leading-relaxed">
                {(selected.body ?? selected.preview).split(/\n{2,}/).map((para) => (
                  <p className="whitespace-pre-line" key={para}>
                    {para}
                  </p>
                ))}
              </div>
            </article>

            {failure ? (
              <p className="px-4 pb-2 text-destructive-foreground text-sm md:px-6" role="alert">
                {failure}
              </p>
            ) : null}

            {onReply ? (
              <div className="sticky bottom-0 border-border/60 border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6 md:py-4">
                <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2 sm:block sm:p-3">
                  <Textarea
                    aria-label={interpolate(t.replyTo, { name: selected.from.name })}
                    className="min-h-10 flex-1 border-0 bg-transparent shadow-none sm:min-h-16"
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setInvalid(undefined);
                    }}
                    placeholder={t.replyPlaceholder}
                    value={draft}
                  />
                  <div className="flex items-center justify-end sm:mt-2">
                    <Button aria-busy={reply.isPending()} className="pointer-coarse:h-11" disabled={reply.isPending()} onClick={send} size="sm">
                      {reply.isPending() ? <Spinner data-icon="inline-start" /> : <SendIcon />}
                      <span className="max-sm:sr-only">{t.send}</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
            <MailIcon aria-hidden className="size-6 opacity-50" />
            {t.nothingOpen}
          </div>
        )}
      </main>
    </div>
  );
}

export function MailTwoPane(props: MailTwoPaneProps) {
  return (
    <ScreenBoundary name="MailTwoPane">
      <MailTwoPaneScreen {...props} />
    </ScreenBoundary>
  );
}

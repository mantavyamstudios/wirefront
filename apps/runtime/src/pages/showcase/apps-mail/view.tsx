// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `mail`).
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@wirefront/ui/tooltip";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  useWirefront,
} from "@wirefront/ui/wirefront/provider";
import { type Action, fail } from "@wirefront/ui/wirefront/types";
import {
  ArchiveIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  ImageIcon,
  InboxIcon,
  type LucideIcon,
  MailIcon,
  MailOpenIcon,
  MenuIcon,
  PaperclipIcon,
  PenSquareIcon,
  ReplyIcon,
  SearchIcon,
  SendIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
} from "motion/react";
import {
  type ReactElement,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  MailAttachment,
  MailFolder,
  MailLabel,
  MailMessage,
  MailPerson,
  MailThread,
  MailTone,
  ThreadPatch,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("mail.<key>"). */
export const MAIL_MESSAGES = {
  folder_inbox: "Inbox",
  folder_starred: "Starred",
  folder_snoozed: "Snoozed",
  folder_sent: "Sent",
  folder_drafts: "Drafts",
  folder_archive: "Archive",
  folder_trash: "Trash",
  mailboxes: "Mailboxes",
  folders: "Folders",
  labels: "Labels",
  closeFolders: "Close folders",
  openMailboxes: "Open mailboxes",
  compose: "Compose",
  storageUsed: "{used} of {total} used",
  conversations: "{title} conversations",
  filter: "Filter",
  all: "All",
  unread: "Unread",
  search: "Search mail",
  clearSearch: "Clear search",
  noMatches: "No matches",
  inboxZero: "Inbox zero",
  nothingHere: "Nothing here",
  noMatchHint: "Nothing in {title} mentions “{query}”.",
  inboxZeroHint: "Every conversation is handled. New mail lands here.",
  nothingHint: "Conversations you move here will show up in this list.",
  keysMove: "move",
  keysArchive: "archive",
  keysReply: "reply",
  keysSnooze: "snooze",
  unreadDot: "Unread",
  hasAttachments: "Has attachments",
  star: "Star",
  unstar: "Unstar",
  me: "me",
  conversation: "Conversation",
  backToList: "Back to list",
  archive: "Archive",
  moveToInbox: "Move to Inbox",
  snooze: "Snooze",
  snoozeUntil: "Snooze until Monday",
  unsnooze: "Unsnooze",
  markRead: "Mark read",
  markUnread: "Mark unread",
  position: "{n} of {total}",
  newer: "Newer conversation",
  older: "Older conversation",
  newerTip: "Newer",
  olderTip: "Older",
  noneSelected: "No conversation selected",
  pressJ: "Press J to open the next one.",
  replyTo: "Reply to {name}",
  replyPlaceholder: "Write a reply…",
  send: "Send",
  attach: "Attach a file",
  remove: "Remove {name}",
  newMessage: "New message",
  discard: "Discard draft",
  to: "To",
  subject: "Subject",
  message: "Message",
  sayHello: "Say hello…",
  noSubject: "(no subject)",
  toastArchived: "Conversation archived",
  toastInbox: "Moved to Inbox",
  toastSnoozed: "Snoozed until Monday 8:00",
  toastReply: "Reply sent",
  toastSent: "Message sent",
  undo: "Undo",
};
type Messages = typeof MAIL_MESSAGES;

export interface MailProps {
  account: MailPerson;
  threads: MailThread[];
  labels: MailLabel[];
  storage?: { usedGb: number; totalGb: number };
  /** Canned replies offered under an empty reply box. */
  quickReplies?: string[];
  /** Moves, stars or marks a conversation; it shows at once and is undone if this fails. */
  onUpdateThread?: Action<{ id: string; patch: ThreadPatch }>;
  /** Sends a reply with any picked files and returns the sent message. Hidden without it. */
  onReply?: Action<
    { threadId: string; body: string; files: File[] },
    MailMessage
  >;
  /** Sends a new message and returns its thread. Compose is hidden without it. */
  onSend?: Action<
    { to: string; subject: string; body: string; files: File[] },
    MailThread
  >;
  onOpenAttachment?: (threadId: string, attachment: MailAttachment) => void;
  className?: string;
}

const FOLDERS: MailFolder[] = [
  "inbox",
  "starred",
  "snoozed",
  "sent",
  "drafts",
  "archive",
  "trash",
];
const folderIcon: Record<MailFolder, LucideIcon> = {
  inbox: InboxIcon,
  starred: StarIcon,
  snoozed: ClockIcon,
  sent: SendIcon,
  drafts: FileIcon,
  archive: ArchiveIcon,
  trash: Trash2Icon,
};
const attachmentIcon: Record<MailAttachment["kind"], LucideIcon> = {
  pdf: FileTextIcon,
  sheet: FileSpreadsheetIcon,
  image: ImageIcon,
  doc: FileTextIcon,
};
const avatarTone: Record<MailTone, string> = {
  blue: "bg-category-1/14 text-category-1-foreground",
  orange: "bg-category-7/14 text-category-7-foreground",
  teal: "bg-category-6/16 text-category-6-foreground",
  violet: "bg-category-5/16 text-category-5-foreground",
  rose: "bg-category-4/14 text-category-4-foreground",
  amber: "bg-category-3/18 text-category-3-foreground",
  emerald: "bg-category-2/16 text-category-2-foreground",
  sky: "bg-category-1/16 text-category-1-foreground",
};
const dotTone: Record<MailTone, string> = {
  blue: "bg-category-1",
  orange: "bg-category-7",
  teal: "bg-category-6",
  violet: "bg-category-5",
  rose: "bg-category-4",
  amber: "bg-category-3",
  emerald: "bg-category-2",
  sky: "bg-category-1",
};
const spring = { type: "spring", stiffness: 520, damping: 42 } as const;
const ease = [0.23, 1, 0.32, 1] as const;
const noReply: Action<
  { threadId: string; body: string; files: File[] },
  MailMessage
> = async () => fail();
const noSend: Action<
  { to: string; subject: string; body: string; files: File[] },
  MailThread
> = async () => fail();

type Picked = MailAttachment & { file: File };

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
const preview = (m?: MailMessage) =>
  m ? (m.body[0] ?? m.attachments?.map((a) => a.name).join(", ") ?? "") : "";
function fileKind(name: string): MailAttachment["kind"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["xls", "xlsx", "csv", "numbers"].includes(ext)) return "sheet";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"].includes(ext))
    return "image";
  return "doc";
}
function scrollIntoContainer(
  el: HTMLElement | null,
  container: HTMLElement | null
) {
  if (!el || !container) return;
  const top = el.offsetTop;
  const bottom = top + el.offsetHeight;
  if (top < container.scrollTop + 8) container.scrollTop = top - 8;
  else if (bottom > container.scrollTop + container.clientHeight - 8)
    container.scrollTop = bottom - container.clientHeight + 8;
}

function Person({
  person,
  size = "size-8",
}: {
  person: MailPerson;
  size?: string;
}) {
  return (
    <Avatar aria-hidden className={size}>
      <AvatarFallback
        className={cn(
          "font-medium text-[11px]",
          avatarTone[person.tone ?? "blue"]
        )}
      >
        {initials(person.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function Tip({
  label,
  keys,
  children,
}: {
  label: string;
  keys?: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children as ReactElement} />
      <TooltipContent>
        <span className="flex items-center gap-2">
          {label}
          {keys ? <Kbd className="h-4 min-w-4 text-[10px]">{keys}</Kbd> : null}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function useFileSize() {
  const fmt = useFormat();
  return (bytes: number) =>
    bytes < 1024
      ? fmt.number(bytes, { style: "unit", unit: "byte" })
      : bytes < 1024 ** 2
        ? fmt.number(Math.round(bytes / 1024), {
            style: "unit",
            unit: "kilobyte",
          })
        : fmt.number(bytes / 1024 ** 2, {
            style: "unit",
            unit: "megabyte",
            maximumFractionDigits: 1,
          });
}

function AttachButton({
  onFiles,
  t,
}: {
  onFiles: (files: Picked[]) => void;
  t: Messages;
}) {
  const input = useRef<HTMLInputElement>(null);
  const size = useFileSize();
  return (
    <>
      <input
        aria-hidden
        className="hidden"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).map((f) => ({
            name: f.name,
            size: size(f.size),
            kind: fileKind(f.name),
            file: f,
          }));
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
        ref={input}
        tabIndex={-1}
        type="file"
      />
      <Button
        aria-label={t.attach}
        onClick={() => input.current?.click()}
        size="icon-sm"
        variant="ghost"
      >
        <PaperclipIcon />
      </Button>
    </>
  );
}

function PendingFiles({
  files,
  onRemove,
  t,
}: {
  files: MailAttachment[];
  onRemove: (name: string) => void;
  t: Messages;
}) {
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-3 pb-2">
      {files.map((f) => {
        const Icon = attachmentIcon[f.kind];
        return (
          <span
            className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-lg border bg-background ps-2 pe-0.5 text-xs dark:bg-input/32"
            key={f.name}
          >
            <Icon
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            <span className="min-w-0 truncate font-medium">{f.name}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {f.size}
            </span>
            <button
              aria-label={interpolate(t.remove, { name: f.name })}
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onRemove(f.name)}
              type="button"
            >
              <XIcon aria-hidden className="size-3" />
            </button>
          </span>
        );
      })}
    </div>
  );
}

function FolderNav({
  account,
  folder,
  counts,
  labels,
  label,
  storage,
  onFolder,
  onLabel,
  onCompose,
  onClose,
  t,
}: {
  account: MailPerson;
  folder: MailFolder;
  counts: Partial<Record<MailFolder, number>>;
  labels: MailLabel[];
  label: string | null;
  storage?: MailProps["storage"];
  onFolder: (f: MailFolder) => void;
  onLabel: (id: string) => void;
  onCompose?: () => void;
  onClose?: () => void;
  t: Messages;
}) {
  const fmt = useFormat();
  const row =
    "group/row relative flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const gb = (n: number) =>
    fmt.number(n, {
      style: "unit",
      unit: "gigabyte",
      maximumFractionDigits: 1,
    });
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <Person person={account} size="size-7" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate font-medium">{account.name}</div>
          <div className="truncate text-muted-foreground text-xs">
            {account.email}
          </div>
        </div>
        {onClose ? (
          <Button
            aria-label={t.closeFolders}
            onClick={onClose}
            size="icon-sm"
            variant="ghost"
          >
            <XIcon />
          </Button>
        ) : null}
      </div>
      {onCompose ? (
        <div className="px-2 pb-3">
          <Button
            className="w-full justify-start transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.97]"
            onClick={onCompose}
            variant="outline"
          >
            <PenSquareIcon />
            {t.compose}
            <Kbd className="ms-auto">C</Kbd>
          </Button>
        </div>
      ) : null}
      <nav
        aria-label={t.folders}
        className="min-h-0 flex-1 overflow-y-auto px-2 scrollbar-thin"
      >
        <LayoutGroup id="mail-folders">
          <ul className="flex flex-col gap-0.5">
            {FOLDERS.map((f) => {
              const on = !label && folder === f;
              const n = counts[f];
              const Icon = folderIcon[f];
              return (
                <li key={f}>
                  <button
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      row,
                      on
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => onFolder(f)}
                    type="button"
                  >
                    {on ? (
                      <motion.span
                        className="absolute inset-0 rounded-lg bg-accent"
                        layoutId="mail-folder-pill"
                        transition={spring}
                      />
                    ) : (
                      <span className="absolute inset-0 rounded-lg transition-colors group-hover/row:bg-accent" />
                    )}
                    <Icon aria-hidden className="relative size-4 shrink-0" />
                    <span className="relative flex-1 truncate font-medium">
                      {t[`folder_${f}`]}
                    </span>
                    {n ? (
                      <span
                        className={cn(
                          "relative text-xs tabular-nums",
                          f === "inbox"
                            ? "rounded-full bg-info/12 px-1.5 font-medium text-info-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {n}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {labels.length ? (
            <>
              <div className="mt-5 mb-1 px-2.5 font-medium text-muted-foreground text-xs">
                {t.labels}
              </div>
              <ul className="flex flex-col gap-0.5">
                {labels.map((l) => {
                  const on = label === l.id;
                  return (
                    <li key={l.id}>
                      <button
                        aria-current={on ? "page" : undefined}
                        className={cn(
                          row,
                          on
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => onLabel(l.id)}
                        type="button"
                      >
                        {on ? (
                          <motion.span
                            className="absolute inset-0 rounded-lg bg-accent"
                            layoutId="mail-folder-pill"
                            transition={spring}
                          />
                        ) : (
                          <span className="absolute inset-0 rounded-lg transition-colors group-hover/row:bg-accent" />
                        )}
                        <span
                          aria-hidden
                          className="relative flex size-4 items-center justify-center"
                        >
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              dotTone[l.tone]
                            )}
                          />
                        </span>
                        <span className="relative truncate">{l.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </LayoutGroup>
      </nav>
      {storage ? (
        <div className="px-4.5 pt-2 pb-4">
          <div
            aria-hidden
            className="h-1 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-foreground/60"
              style={{
                width: `${Math.min(100, (storage.usedGb / storage.totalGb) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-2 text-muted-foreground text-xs tabular-nums">
            {interpolate(t.storageUsed, {
              used: gb(storage.usedGb),
              total: gb(storage.totalGb),
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function LabelChip({ label }: { label: MailLabel }) {
  return (
    <span className="inline-flex h-4.5 shrink-0 items-center gap-1 rounded-md bg-muted px-1.5 font-normal text-[11px] text-muted-foreground leading-none">
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", dotTone[label.tone])}
      />
      {label.name}
    </span>
  );
}

function ThreadRow({
  thread,
  account,
  selected,
  labels,
  when,
  onOpen,
  onStar,
  rowRef,
  t,
}: {
  thread: MailThread;
  account: MailPerson;
  selected: boolean;
  labels: MailLabel[];
  when: string;
  onOpen: () => void;
  onStar?: () => void;
  rowRef: (el: HTMLButtonElement | null) => void;
  t: Messages;
}) {
  const last = thread.messages.at(-1);
  const first = thread.messages[0];
  if (!last || !first) return null;
  const senders = Array.from(
    new Set(
      thread.messages.map((m) =>
        m.from.email === account.email
          ? t.me
          : (m.from.name.split(" ")[0] ?? m.from.name)
      )
    )
  );
  const sender =
    thread.messages.length > 1 ? senders.join(", ") : last.from.name;
  const firstLabel = labels.find((l) => thread.labels?.includes(l.id));
  const hasFiles = thread.messages.some((m) => m.attachments?.length);
  return (
    <div className="group/thread relative">
      <button
        aria-current={selected ? "true" : undefined}
        className={cn(
          "relative flex w-full cursor-pointer items-start gap-3 rounded-lg py-2.5 ps-3.5 pe-3 text-start outline-none transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-ring",
          selected ? "bg-accent" : "hover:bg-accent/60"
        )}
        onClick={onOpen}
        ref={rowRef}
        type="button"
      >
        {thread.unread ? (
          <span className="absolute inset-s-1 top-4.5 size-1.5 rounded-full bg-info">
            <span className="sr-only">{t.unreadDot}</span>
          </span>
        ) : null}
        <Person
          person={last.from.email === account.email ? first.from : last.from}
          size="size-8"
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex h-5 items-center gap-1.5">
            <span
              className={cn(
                "truncate",
                thread.unread
                  ? "font-semibold text-foreground"
                  : "font-medium text-foreground/80"
              )}
            >
              {sender}
            </span>
            {thread.messages.length > 1 ? (
              <span className="text-muted-foreground text-xs tabular-nums">
                {thread.messages.length}
              </span>
            ) : null}
            <span className="ms-auto flex shrink-0 items-center gap-1.5 ps-2 text-muted-foreground text-xs tabular-nums">
              {hasFiles ? (
                <>
                  <PaperclipIcon aria-hidden className="size-3" />
                  <span className="sr-only">{t.hasAttachments}</span>
                </>
              ) : null}
              <span
                className={cn(
                  "pe-7",
                  thread.unread && "font-medium text-foreground"
                )}
              >
                {when}
              </span>
            </span>
          </span>
          <span
            className={cn(
              "flex h-5 min-w-0 items-center gap-1.5",
              thread.unread
                ? "font-medium text-foreground"
                : "text-foreground/80"
            )}
          >
            <span className="truncate">{thread.subject}</span>
            {firstLabel ? <LabelChip label={firstLabel} /> : null}
          </span>
          <span className="truncate text-muted-foreground leading-5">
            {preview(last)}
          </span>
        </span>
      </button>
      {onStar ? (
        <button
          aria-label={thread.starred ? t.unstar : t.star}
          aria-pressed={Boolean(thread.starred)}
          className={cn(
            "absolute inset-e-1.5 top-1.5 flex size-8 cursor-pointer items-center justify-center rounded-md outline-none transition-[opacity,color,scale] duration-150 ease-out hover:bg-background/80 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring active:scale-90",
            thread.starred
              ? "text-category-3-foreground"
              : "text-muted-foreground opacity-0 group-hover/thread:opacity-100"
          )}
          onClick={onStar}
          type="button"
        >
          <StarIcon
            aria-hidden
            className={cn("size-3.5", thread.starred && "fill-current")}
          />
        </button>
      ) : null}
    </div>
  );
}

function MessageBlock({
  message,
  open,
  fade,
  when,
  onToggle,
  onAttachment,
}: {
  message: MailMessage;
  open: boolean;
  fade: boolean;
  when: string;
  onToggle: () => void;
  onAttachment?: (a: MailAttachment) => void;
}) {
  if (!open) {
    return (
      <button
        aria-expanded={false}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-start outline-none transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onToggle}
        type="button"
      >
        <Person person={message.from} size="size-7" />
        <span className="w-28 shrink-0 truncate font-medium @lg:w-36">
          {message.from.name}
        </span>
        <span className="min-w-0 flex-1 truncate text-muted-foreground">
          {preview(message)}
        </span>
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
          {when}
        </span>
      </button>
    );
  }
  return (
    <motion.article
      animate={{ opacity: 1 }}
      className="rounded-xl px-3 py-3"
      initial={fade ? { opacity: 0 } : false}
      transition={{ duration: 0.18, ease }}
    >
      <button
        aria-expanded
        className="-m-1 flex w-[calc(100%+0.5rem)] cursor-pointer items-start gap-3 rounded-lg p-1 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onToggle}
        type="button"
      >
        <Person person={message.from} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="flex items-baseline gap-1.5">
            <span className="truncate font-medium">{message.from.name}</span>
            <span className="hidden truncate text-muted-foreground text-xs @lg:inline">
              &lt;{message.from.email}&gt;
            </span>
          </span>
          <span className="mt-0.5 block text-muted-foreground text-xs">
            {message.to}
          </span>
        </span>
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
          {when}
        </span>
      </button>
      <div className="mt-3 flex flex-col gap-3 text-pretty leading-6 @lg:ps-11">
        {message.body.map((p) => (
          <p className="whitespace-pre-line" key={p}>
            {p}
          </p>
        ))}
        {message.attachments ? (
          <div className="mt-1 flex flex-wrap gap-2">
            {message.attachments.map((a) => {
              const Icon = attachmentIcon[a.kind];
              const inner = (
                <>
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate font-medium text-xs">
                      {a.name}
                    </span>
                    <span className="block text-muted-foreground text-xs tabular-nums">
                      {a.size}
                    </span>
                  </span>
                </>
              );
              const box =
                "flex min-w-0 max-w-full items-center gap-2.5 rounded-xl border bg-card py-2 ps-2 pe-3 text-start shadow-xs/5";
              return onAttachment ? (
                <button
                  className={cn(
                    box,
                    "cursor-pointer outline-none transition-[background-color,scale] duration-150 ease-out hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
                  )}
                  key={a.name}
                  onClick={() => onAttachment(a)}
                  type="button"
                >
                  {inner}
                </button>
              ) : (
                <span className={box} key={a.name}>
                  {inner}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

function QuickReply({
  to,
  draft,
  onDraft,
  onSend,
  textareaRef,
  files,
  onFiles,
  quickReplies,
  pending,
  t,
}: {
  to: MailPerson;
  draft: string;
  onDraft: (v: string) => void;
  onSend: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  files: Picked[];
  onFiles: (files: Picked[]) => void;
  quickReplies: string[];
  pending: boolean;
  t: Messages;
}) {
  const canSend = (Boolean(draft.trim()) || files.length > 0) && !pending;
  return (
    <div className="shrink-0 border-t bg-background px-3 pt-3 pb-3 @lg:px-5">
      <div className="rounded-2xl border bg-card shadow-xs/5 transition-shadow focus-within:border-ring/60 focus-within:ring-3 focus-within:ring-ring/16">
        <div className="flex items-center gap-2 px-3 pt-2.5 text-muted-foreground text-xs">
          <ReplyIcon aria-hidden className="size-3.5 rtl:-scale-x-100" />
          <span>{interpolate(t.replyTo, { name: to.name })}</span>
        </div>
        <textarea
          aria-label={interpolate(t.replyTo, { name: to.name })}
          className="block max-h-40 min-h-16 w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground/70"
          onChange={(e) => onDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSend();
            }
            if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur();
          }}
          placeholder={t.replyPlaceholder}
          ref={textareaRef}
          rows={2}
          value={draft}
        />
        <PendingFiles
          files={files}
          onRemove={(name) => onFiles(files.filter((f) => f.name !== name))}
          t={t}
        />
        <div className="flex items-center gap-1.5 px-2 pb-2">
          <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pe-4 mask-[linear-gradient(to_right,black_calc(100%-1.5rem),transparent)] scrollbar-none">
            {draft.length === 0
              ? quickReplies.map((q) => (
                  <button
                    className="h-7 shrink-0 cursor-pointer rounded-full border px-2.5 text-muted-foreground text-xs outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
                    key={q}
                    onClick={() => {
                      onDraft(q);
                      textareaRef.current?.focus();
                    }}
                    type="button"
                  >
                    {q}
                  </button>
                ))
              : null}
          </div>
          <AttachButton
            onFiles={(add) =>
              onFiles([
                ...files,
                ...add.filter((a) => !files.some((f) => f.name === a.name)),
              ])
            }
            t={t}
          />
          <Button
            className="transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.97]"
            disabled={!canSend}
            onClick={onSend}
            size="sm"
            variant={canSend ? "default" : "secondary"}
          >
            {t.send}
            <span
              aria-hidden
              className={cn(
                "hidden text-[11px] @md:inline",
                canSend ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              ⌘↵
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Compose({
  onClose,
  onSend,
  pending,
  error,
  t,
}: {
  onClose: () => void;
  onSend: (to: string, subject: string, body: string, files: File[]) => void;
  pending: boolean;
  error?: string;
  t: Messages;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<Picked[]>([]);
  const first = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => first.current?.focus(), []);
  const field =
    "h-10 w-full border-b bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground/70";
  const send = () => {
    if (to.trim() && !pending)
      onSend(
        to.trim(),
        subject.trim() || t.noSubject,
        body.trim(),
        files.map((f) => f.file)
      );
  };
  // Escape discards and ⌘↵ sends from anywhere in the window.
  const sendRef = useRef(send);
  sendRef.current = send;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sendRef.current();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      aria-label={t.newMessage}
      className="absolute inset-e-3 inset-s-3 bottom-3 z-40 flex origin-bottom-right flex-col overflow-hidden rounded-2xl border bg-popover shadow-lg/10 @xl:inset-s-auto @xl:w-110"
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      ref={boxRef}
      role="dialog"
      transition={{ duration: 0.2, ease }}
    >
      <div className="flex h-11 items-center justify-between border-b ps-4 pe-2">
        <span className="font-medium">{t.newMessage}</span>
        <Button
          aria-label={t.discard}
          onClick={onClose}
          size="icon-sm"
          variant="ghost"
        >
          <XIcon />
        </Button>
      </div>
      <input
        aria-label={t.to}
        className={field}
        onChange={(e) => setTo(e.target.value)}
        placeholder={t.to}
        ref={first}
        type="email"
        value={to}
      />
      <input
        aria-label={t.subject}
        className={field}
        onChange={(e) => setSubject(e.target.value)}
        placeholder={t.subject}
        value={subject}
      />
      <textarea
        aria-label={t.message}
        className="h-40 w-full resize-none bg-transparent px-4 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground/70"
        onChange={(e) => setBody(e.target.value)}
        placeholder={t.sayHello}
        value={body}
      />
      <PendingFiles
        files={files}
        onRemove={(name) => setFiles((fs) => fs.filter((f) => f.name !== name))}
        t={t}
      />
      {error ? (
        <p className="px-4 pb-2 text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex items-center gap-2 border-t px-3 py-2">
        <Button
          className="transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.97]"
          disabled={!to.trim() || pending}
          onClick={send}
          size="sm"
        >
          <SendIcon />
          {t.send}
        </Button>
        <AttachButton
          onFiles={(add) =>
            setFiles((fs) => [
              ...fs,
              ...add.filter((a) => !fs.some((f) => f.name === a.name)),
            ])
          }
          t={t}
        />
      </div>
    </motion.div>
  );
}

function MailScreen({
  account,
  threads: initialThreads,
  labels,
  storage,
  quickReplies = [],
  onUpdateThread,
  onReply,
  onSend,
  onOpenAttachment,
  className,
}: MailProps) {
  const t = useMessages("mail", MAIL_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone } = useWirefront();
  const uid = useId();
  const seq = useRef(0);
  const [threads, setThreads] = useState(initialThreads);
  useEffect(() => setThreads(initialThreads), [initialThreads]);
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [label, setLabel] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialThreads[0]?.id ?? null
  );
  const [readerOpen, setReaderOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [composing, setComposing] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftFiles, setDraftFiles] = useState<Record<string, Picked[]>>({});
  const [toggled, setToggled] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    text: string;
    undo?: () => void;
    key: number;
  } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWide((entry?.contentRect.width ?? 0) >= 768)
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Times read as a clock time today, a weekday this week, or a short date.
  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  const daysAgo = (iso: string) =>
    Math.round(
      (Date.parse(dayKey(now())) - Date.parse(dayKey(new Date(iso)))) /
        86_400_000
    );
  const shortWhen = (iso: string) => {
    const d = daysAgo(iso);
    return d <= 0
      ? fmt.time(iso)
      : d < 7
        ? fmt.date(iso, { weekday: "short" })
        : fmt.date(iso, { month: "short", day: "numeric" });
  };
  const longWhen = (iso: string) => {
    const d = daysAgo(iso);
    return d <= 0
      ? fmt.time(iso)
      : d < 7
        ? `${fmt.date(iso, { weekday: "short" })} ${fmt.time(iso)}`
        : fmt.date(iso, { month: "short", day: "numeric" });
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((th) => {
      if (label) {
        if (!th.labels?.includes(label) || th.folder === "trash") return false;
      } else if (folder === "starred") {
        if (!th.starred || th.folder === "trash") return false;
      } else if (th.folder !== folder) return false;
      if (filter === "unread" && !th.unread) return false;
      if (
        q &&
        !`${th.subject} ${th.messages.map((m) => `${m.from.name} ${m.body.join(" ")}`).join(" ")}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [threads, folder, label, filter, query]);
  const counts: Partial<Record<MailFolder, number>> = {
    inbox: threads.filter((th) => th.folder === "inbox" && th.unread).length,
    drafts: threads.filter((th) => th.folder === "drafts").length,
  };
  const selected = visible.find((th) => th.id === selectedId) ?? null;
  const selectedIndex = selected ? visible.indexOf(selected) : -1;

  // Start each conversation at the top.
  const [shownThread, setShownThread] = useState(selected?.id);
  if (shownThread !== selected?.id) {
    setShownThread(selected?.id);
    if (readerRef.current) readerRef.current.scrollTop = 0;
  }

  const patchLocal = (id: string, p: ThreadPatch) =>
    setThreads((ts) => ts.map((th) => (th.id === id ? { ...th, ...p } : th)));
  const update = useAction(onUpdateThread ?? (async () => {}), {
    optimistic: ({ id, patch }) => {
      const before = threads.find((th) => th.id === id);
      patchLocal(id, patch);
      return () => {
        if (before)
          patchLocal(id, {
            folder: before.folder,
            starred: before.starred,
            unread: before.unread,
          });
      };
    },
  });
  const change = (id: string, patch: ThreadPatch) => {
    if (onUpdateThread) update.run({ id, patch }, id);
  };

  const open = (id: string, opts?: { reader?: boolean; focus?: boolean }) => {
    setSelectedId(id);
    if (threads.find((th) => th.id === id)?.unread)
      change(id, { unread: false });
    if (opts?.reader !== false) setReaderOpen(true);
    if (opts?.focus) {
      const el = rowRefs.current.get(id);
      el?.focus({ preventScroll: true });
      scrollIntoContainer(
        el?.parentElement?.parentElement ?? null,
        listRef.current
      );
    }
  };
  const move = (delta: number) => {
    if (!visible.length) return;
    const next =
      visible[
        Math.min(
          visible.length - 1,
          Math.max(0, (selectedIndex < 0 ? -1 : selectedIndex) + delta)
        )
      ];
    if (next) open(next.id, { reader: readerOpen, focus: true });
  };
  const moveTo = (
    id: string | undefined,
    target: MailThread["folder"],
    text: string
  ) => {
    const th = threads.find((x) => x.id === id);
    if (!th || !onUpdateThread) return;
    const idx = visible.findIndex((x) => x.id === id);
    const neighbour = visible[idx + 1] ?? visible[idx - 1];
    const prevFolder = th.folder;
    change(th.id, { folder: target });
    setSelectedId(neighbour?.id ?? null);
    if (!neighbour) setReaderOpen(false);
    requestAnimationFrame(() =>
      (neighbour ? rowRefs.current.get(neighbour.id) : rootRef.current)?.focus({
        preventScroll: true,
      })
    );
    setToast({
      key: ++seq.current,
      text,
      undo: () => {
        change(th.id, { folder: prevFolder });
        setSelectedId(th.id);
        setToast(null);
        rootRef.current?.focus({ preventScroll: true });
      },
    });
  };
  const archive = (id = selected?.id) => {
    const th = threads.find((x) => x.id === id);
    if (!th) return;
    if (th.folder === "archive") moveTo(id, "inbox", t.toastInbox);
    else moveTo(id, "archive", t.toastArchived);
  };
  const snooze = (id = selected?.id) => {
    const th = threads.find((x) => x.id === id);
    if (!th) return;
    if (th.folder === "snoozed") moveTo(id, "inbox", t.toastInbox);
    else moveTo(id, "snoozed", t.toastSnoozed);
  };

  const reply = useAction(onReply ?? noReply, {
    onSuccess: (message, { threadId }) => {
      setThreads((ts) =>
        ts.map((th) =>
          th.id === threadId
            ? { ...th, messages: [...th.messages, message] }
            : th
        )
      );
      setDrafts((d) => ({ ...d, [threadId]: "" }));
      setDraftFiles((d) => ({ ...d, [threadId]: [] }));
      setToast({ key: ++seq.current, text: t.toastReply });
      requestAnimationFrame(() =>
        readerRef.current?.scrollTo?.({
          top: readerRef.current.scrollHeight,
          behavior: "smooth",
        })
      );
    },
  });
  const sendReply = () => {
    if (!selected || !onReply) return;
    const body = (drafts[selected.id] ?? "").trim();
    const files = draftFiles[selected.id] ?? [];
    if (!body && !files.length) return;
    reply.run({ threadId: selected.id, body, files: files.map((f) => f.file) });
  };
  const compose = useAction(onSend ?? noSend, {
    onSuccess: (thread) => {
      setThreads((ts) => [thread, ...ts.filter((th) => th.id !== thread.id)]);
      setComposing(false);
      setToast({ key: ++seq.current, text: t.toastSent });
    },
  });

  const goFolder = (f: MailFolder) => {
    setFolder(f);
    setLabel(null);
    setDrawer(false);
    setReaderOpen(false);
    setQuery("");
    listRef.current?.scrollTo?.({ top: 0 });
  };

  // Keyboard: J/K move, E archive, H snooze, S star, U unread, R reply, C compose, / search, Esc back.
  const keysRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keysRef.current = (e) => {
    const target = e.target as HTMLElement;
    const typing =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;
    if (e.key === "Escape") {
      if (composing || drawer) return;
      if (readerOpen) {
        setReaderOpen(false);
        if (selected)
          rowRefs.current.get(selected.id)?.focus({ preventScroll: true });
      }
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey || composing) return;
    const k = e.key.toLowerCase();
    if (k === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (k === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (k === "e" && selected) {
      e.preventDefault();
      archive();
    } else if (k === "h" && selected) {
      e.preventDefault();
      snooze();
    } else if (k === "s" && selected) {
      change(selected.id, { starred: !selected.starred });
    } else if (k === "u" && selected) {
      change(selected.id, { unread: !selected.unread });
    } else if (k === "r" && selected && onReply) {
      e.preventDefault();
      setReaderOpen(true);
      requestAnimationFrame(() => replyRef.current?.focus());
    } else if (k === "c" && onSend) {
      e.preventDefault();
      setComposing(true);
    } else if (e.key === "/") {
      e.preventDefault();
      searchRef.current?.focus();
    } else if (e.key === "Enter" && selected && !readerOpen) {
      setReaderOpen(true);
    }
  };
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => keysRef.current(e);
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  const title = label
    ? (labels.find((l) => l.id === label)?.name ?? "")
    : t[`folder_${folder}`];
  const lastFrom = selected
    ? ([...selected.messages]
        .reverse()
        .find((m) => m.from.email !== account.email)?.from ??
      selected.messages[0]?.from)
    : undefined;
  const navProps = {
    account,
    counts,
    folder,
    label,
    labels,
    storage,
    t,
    onCompose: onSend
      ? () => {
          setDrawer(false);
          setComposing(true);
        }
      : undefined,
    onFolder: goFolder,
    onLabel: (id: string) => {
      setLabel(id);
      setDrawer(false);
      setReaderOpen(false);
    },
  };
  const error = update.error ?? reply.error;

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={500}>
        <div
          className={cn(
            "@container relative isolate flex h-svh w-full overflow-hidden bg-sidebar text-foreground text-sm outline-none",
            className
          )}
          ref={rootRef}
        >
          <aside
            aria-label={t.mailboxes}
            className="hidden w-60 shrink-0 @5xl:block"
          >
            <FolderNav {...navProps} />
          </aside>

          <Sheet onOpenChange={setDrawer} open={drawer}>
            <SheetContent
              className="w-66 max-w-[calc(100%-3rem)] gap-0 bg-sidebar p-0"
              showCloseButton={false}
              side="left"
            >
              <SheetTitle className="sr-only">{t.mailboxes}</SheetTitle>
              <FolderNav {...navProps} onClose={() => setDrawer(false)} />
            </SheetContent>
          </Sheet>

          <main className="relative flex min-w-0 flex-1 overflow-hidden bg-background @5xl:my-2 @5xl:me-2 @5xl:rounded-2xl @5xl:border @5xl:shadow-xs/5">
            <section
              aria-label={interpolate(t.conversations, { title })}
              className="flex w-full min-w-0 flex-col @3xl:w-85 @3xl:shrink-0 @3xl:border-e @6xl:w-95"
            >
              <header className="flex shrink-0 flex-col gap-3 px-3 pt-3 pb-2">
                <div className="flex h-8 items-center gap-1.5">
                  <Button
                    aria-label={t.openMailboxes}
                    className="@5xl:hidden"
                    onClick={() => setDrawer(true)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <MenuIcon />
                  </Button>
                  <h2 className="ps-1 font-heading font-semibold text-base">
                    {title}
                  </h2>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {visible.length}
                  </span>
                  <fieldset className="m-0 ms-auto flex min-w-0 rounded-lg border-0 bg-muted p-0.5">
                    <legend className="sr-only">{t.filter}</legend>
                    {(["all", "unread"] as const).map((f) => (
                      <button
                        aria-pressed={filter === f}
                        className={cn(
                          "relative h-6 cursor-pointer rounded-md px-2 font-medium text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          filter === f
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        key={f}
                        onClick={() => setFilter(f)}
                        type="button"
                      >
                        {filter === f ? (
                          <motion.span
                            className="absolute inset-0 rounded-md bg-background shadow-xs/5 dark:bg-accent"
                            layoutId="mail-filter"
                            transition={spring}
                          />
                        ) : null}
                        <span className="relative">
                          {f === "all" ? t.all : t.unread}
                        </span>
                      </button>
                    ))}
                  </fieldset>
                </div>
                <label className="flex h-8 items-center gap-2 rounded-lg border bg-background px-2.5 text-muted-foreground shadow-xs/5 transition-shadow focus-within:border-ring/60 focus-within:ring-3 focus-within:ring-ring/16 dark:bg-input/32">
                  <SearchIcon aria-hidden className="size-4 shrink-0" />
                  <input
                    aria-label={t.search}
                    className="min-w-0 flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setQuery("");
                        (e.target as HTMLInputElement).blur();
                      }
                      if (e.key === "ArrowDown" || e.key === "Enter") {
                        e.preventDefault();
                        if (visible[0])
                          open(visible[0].id, {
                            reader: e.key === "Enter",
                            focus: true,
                          });
                      }
                    }}
                    placeholder={t.search}
                    ref={searchRef}
                    value={query}
                  />
                  {query ? (
                    <button
                      aria-label={t.clearSearch}
                      className="cursor-pointer rounded text-muted-foreground hover:text-foreground"
                      onClick={() => setQuery("")}
                      type="button"
                    >
                      <XIcon aria-hidden className="size-3.5" />
                    </button>
                  ) : (
                    <Kbd>/</Kbd>
                  )}
                </label>
              </header>

              {error ? (
                <p className="mx-3 mb-2 text-destructive text-xs" role="alert">
                  {error}
                </p>
              ) : null}

              <div
                className="relative min-h-0 flex-1 overflow-y-auto px-1.5 pb-2 scrollbar-thin"
                ref={listRef}
              >
                {visible.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-8 pb-10 text-center">
                    <span
                      aria-hidden
                      className="flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-xs/5"
                    >
                      {query ? (
                        <SearchIcon className="size-5" />
                      ) : (
                        <MailOpenIcon className="size-5" />
                      )}
                    </span>
                    <p className="mt-3 font-medium">
                      {query
                        ? t.noMatches
                        : folder === "inbox" && !label
                          ? t.inboxZero
                          : t.nothingHere}
                    </p>
                    <p className="mt-1 max-w-56 text-pretty text-muted-foreground text-xs">
                      {query
                        ? interpolate(t.noMatchHint, { title, query })
                        : folder === "inbox" && !label
                          ? t.inboxZeroHint
                          : t.nothingHint}
                    </p>
                  </div>
                ) : (
                  <ul
                    className="flex flex-col gap-0.5"
                    key={`${folder}|${label}|${filter}|${query}`}
                  >
                    <AnimatePresence initial={false}>
                      {visible.map((th) => {
                        const last = th.messages.at(-1);
                        return (
                          <motion.li
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            initial={{ opacity: 0, height: 0 }}
                            key={th.id}
                            style={{ overflow: "hidden" }}
                            transition={{ duration: 0.2, ease }}
                          >
                            <ThreadRow
                              account={account}
                              labels={labels}
                              onOpen={() => open(th.id)}
                              onStar={
                                onUpdateThread
                                  ? () =>
                                      change(th.id, { starred: !th.starred })
                                  : undefined
                              }
                              rowRef={(el) => {
                                if (el) rowRefs.current.set(th.id, el);
                                else rowRefs.current.delete(th.id);
                              }}
                              selected={th.id === selected?.id}
                              t={t}
                              thread={th}
                              when={last ? shortWhen(last.sentAt) : ""}
                            />
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                )}
              </div>

              <footer
                aria-hidden
                className="hidden shrink-0 items-center gap-3 border-t px-4 py-2 text-muted-foreground text-xs @3xl:flex"
              >
                <span className="flex items-center gap-1">
                  <Kbd>J</Kbd>
                  <Kbd>K</Kbd>
                  {t.keysMove}
                </span>
                {onUpdateThread ? (
                  <>
                    <span className="flex items-center gap-1">
                      <Kbd>E</Kbd>
                      {t.keysArchive}
                    </span>
                    <span className="flex items-center gap-1">
                      <Kbd>H</Kbd>
                      {t.keysSnooze}
                    </span>
                  </>
                ) : null}
                {onReply ? (
                  <span className="flex items-center gap-1">
                    <Kbd>R</Kbd>
                    {t.keysReply}
                  </span>
                ) : null}
              </footer>
            </section>

            <section
              aria-label={t.conversation}
              className={cn(
                "absolute inset-0 z-20 flex min-w-0 flex-col bg-background transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] @3xl:static @3xl:z-auto @3xl:flex-1 @3xl:translate-x-0 motion-reduce:transition-none",
                readerOpen
                  ? "translate-x-0"
                  : "pointer-events-none translate-x-full @3xl:pointer-events-auto rtl:-translate-x-full"
              )}
              inert={!wide && !readerOpen ? true : undefined}
            >
              {selected && lastFrom ? (
                <>
                  <header className="flex h-12 shrink-0 items-center gap-1 border-b px-2 @lg:px-3">
                    <Button
                      aria-label={t.backToList}
                      className="@3xl:hidden"
                      onClick={() => setReaderOpen(false)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <ArrowLeftIcon className="rtl:-scale-x-100" />
                    </Button>
                    {onUpdateThread ? (
                      <>
                        <Tip
                          keys="E"
                          label={
                            selected.folder === "archive"
                              ? t.moveToInbox
                              : t.archive
                          }
                        >
                          <Button
                            aria-label={
                              selected.folder === "archive"
                                ? t.moveToInbox
                                : t.archive
                            }
                            onClick={() => archive()}
                            size="icon-sm"
                            variant="ghost"
                          >
                            {selected.folder === "archive" ? (
                              <InboxIcon />
                            ) : (
                              <ArchiveIcon />
                            )}
                          </Button>
                        </Tip>
                        <Tip
                          keys="H"
                          label={
                            selected.folder === "snoozed"
                              ? t.unsnooze
                              : t.snoozeUntil
                          }
                        >
                          <Button
                            aria-label={
                              selected.folder === "snoozed"
                                ? t.unsnooze
                                : t.snooze
                            }
                            onClick={() => snooze()}
                            size="icon-sm"
                            variant="ghost"
                          >
                            {selected.folder === "snoozed" ? (
                              <InboxIcon />
                            ) : (
                              <ClockIcon />
                            )}
                          </Button>
                        </Tip>
                        <Tip
                          keys="U"
                          label={selected.unread ? t.markRead : t.markUnread}
                        >
                          <Button
                            aria-label={
                              selected.unread ? t.markRead : t.markUnread
                            }
                            onClick={() =>
                              change(selected.id, { unread: !selected.unread })
                            }
                            size="icon-sm"
                            variant="ghost"
                          >
                            {selected.unread ? <MailOpenIcon /> : <MailIcon />}
                          </Button>
                        </Tip>
                        <Tip
                          keys="S"
                          label={selected.starred ? t.unstar : t.star}
                        >
                          <Button
                            aria-label={selected.starred ? t.unstar : t.star}
                            aria-pressed={Boolean(selected.starred)}
                            onClick={() =>
                              change(selected.id, {
                                starred: !selected.starred,
                              })
                            }
                            size="icon-sm"
                            variant="ghost"
                          >
                            <StarIcon
                              className={cn(
                                selected.starred &&
                                  "fill-category-3 text-category-3-foreground opacity-100"
                              )}
                            />
                          </Button>
                        </Tip>
                      </>
                    ) : null}
                    <span className="ms-auto me-1 text-muted-foreground text-xs tabular-nums">
                      {interpolate(t.position, {
                        n: selectedIndex + 1,
                        total: visible.length,
                      })}
                    </span>
                    <Tip keys="K" label={t.newerTip}>
                      <Button
                        aria-label={t.newer}
                        disabled={selectedIndex <= 0}
                        onClick={() => move(-1)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <ChevronUpIcon />
                      </Button>
                    </Tip>
                    <Tip keys="J" label={t.olderTip}>
                      <Button
                        aria-label={t.older}
                        disabled={selectedIndex >= visible.length - 1}
                        onClick={() => move(1)}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <ChevronDownIcon />
                      </Button>
                    </Tip>
                  </header>

                  <div
                    className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"
                    ref={readerRef}
                  >
                    <div className="mx-auto flex max-w-3xl flex-col px-2 pt-5 pb-6 @lg:px-4">
                      <div className="px-3 pb-3">
                        <h1 className="text-balance font-heading font-semibold text-lg tracking-tight">
                          {selected.subject}
                        </h1>
                        {selected.labels?.length ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {labels
                              .filter((l) => selected.labels?.includes(l.id))
                              .map((l) => (
                                <LabelChip key={l.id} label={l} />
                              ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-1">
                        {selected.messages.map((m, i) => {
                          const isLast = i === selected.messages.length - 1;
                          const key = `${selected.id}:${m.id}`;
                          const isOpen = expanded[key] ?? isLast;
                          return (
                            <div
                              className={cn(i > 0 && "border-t pt-1")}
                              key={m.id}
                            >
                              <MessageBlock
                                fade={toggled === key}
                                message={m}
                                onAttachment={
                                  onOpenAttachment
                                    ? (a) => onOpenAttachment(selected.id, a)
                                    : undefined
                                }
                                onToggle={() => {
                                  setToggled(key);
                                  setExpanded((x) => ({
                                    ...x,
                                    [key]: !isOpen,
                                  }));
                                }}
                                open={isOpen}
                                when={longWhen(m.sentAt)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {onReply ? (
                    <QuickReply
                      draft={drafts[selected.id] ?? ""}
                      files={draftFiles[selected.id] ?? []}
                      onDraft={(v) =>
                        setDrafts((d) => ({ ...d, [selected.id]: v }))
                      }
                      onFiles={(files) =>
                        setDraftFiles((d) => ({ ...d, [selected.id]: files }))
                      }
                      onSend={sendReply}
                      pending={reply.isPending()}
                      quickReplies={quickReplies}
                      t={t}
                      textareaRef={replyRef}
                      to={lastFrom}
                    />
                  ) : null}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span
                    aria-hidden
                    className="flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-xs/5"
                  >
                    <InboxIcon className="size-5" />
                  </span>
                  <p className="mt-3 font-medium">{t.noneSelected}</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {t.pressJ}
                  </p>
                </div>
              )}
            </section>

            <AnimatePresence>
              {composing && onSend ? (
                <Compose
                  error={compose.error}
                  key={`${uid}-compose`}
                  onClose={() => setComposing(false)}
                  onSend={(to, subject, body, files) =>
                    compose.run({ to, subject, body, files })
                  }
                  pending={compose.isPending()}
                  t={t}
                />
              ) : null}
            </AnimatePresence>

            <div
              aria-live="polite"
              className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-4 @3xl:inset-e-auto @3xl:bottom-12 @3xl:w-85 @6xl:w-95"
            >
              <AnimatePresence mode="popLayout">
                {toast && !composing ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="pointer-events-auto flex h-10 items-center gap-3 rounded-full border bg-popover ps-4 pe-1.5 shadow-lg/10"
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    key={toast.key}
                    transition={{ duration: 0.2, ease }}
                  >
                    <span className="text-sm">{toast.text}</span>
                    {toast.undo ? (
                      <Button
                        className="rounded-full"
                        onClick={toast.undo}
                        size="xs"
                        variant="secondary"
                      >
                        {t.undo}
                      </Button>
                    ) : (
                      <span className="w-1" />
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </TooltipProvider>
    </MotionConfig>
  );
}

export function Mail(props: MailProps) {
  return (
    <ScreenBoundary name="Mail">
      <MailScreen {...props} />
    </ScreenBoundary>
  );
}

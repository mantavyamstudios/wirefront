// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `team-chat`).
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@wirefront/ui/dialog";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
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
  ArrowLeftIcon,
  AtSignIcon,
  BellOffIcon,
  BoldIcon,
  BookmarkIcon,
  ChevronDownIcon,
  CodeIcon,
  CornerDownLeftIcon,
  FileTextIcon,
  HashIcon,
  ItalicIcon,
  LockIcon,
  type LucideIcon,
  MenuIcon,
  MessageSquareTextIcon,
  MessagesSquareIcon,
  PaperclipIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SendHorizontalIcon,
  SmilePlusIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
} from "motion/react";
import {
  Fragment,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChatChannel,
  ChatFile,
  ChatMessage,
  ChatPerson,
  ChatReaction,
  ChatReply,
  ChatTone,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("teamChat.<key>"). */
export const TEAM_CHAT_MESSAGES = {
  channels: "Channels",
  directMessages: "Direct messages",
  conversations: "Conversations",
  createChannel: "Create a channel",
  newDm: "New direct message",
  newChannelName: "New channel name",
  newChannelPlaceholder: "new-channel",
  muted: "Muted",
  online: "{n} online",
  closeChannels: "Close channels",
  openChannels: "Open channels",
  jumpTo: "Jump to…",
  jumpKeys: "⌘K",
  view_threads: "Threads",
  view_mentions: "Mentions",
  view_saved: "Saved",
  empty_threads: "Threads you follow show up here when someone replies.",
  empty_mentions: "When someone @mentions you, it lands here.",
  empty_saved:
    "Hover a message and press the bookmark to keep it here for later.",
  nothingYet: "Nothing here yet",
  inThread: "thread",
  today: "Today",
  yesterday: "Yesterday",
  you: "You",
  youSuffix: "(you)",
  reaction: "{emoji} {count}, {names}",
  addReaction: "Add reaction",
  reactWith: "React with {emoji}",
  savedForLater: "Saved for later",
  pages: "{n} pages",
  replies: "{n} replies",
  oneReply: "1 reply",
  lastReply: "Last reply {time}",
  lastShort: "last {time}",
  viewThread: "View thread",
  replyInThread: "Reply in thread",
  saveForLater: "Save for later",
  removeSaved: "Remove from saved",
  bold: "Bold",
  boldTip: "Bold (⌘B)",
  italic: "Italic",
  italicTip: "Italic (⌘I)",
  code: "Code",
  codeTip: "Code (⌘E)",
  attach: "Attach a file",
  remove: "Remove {name}",
  mention: "Mention someone",
  newLineKeys: "⇧↵",
  newLine: "new line",
  sendMessage: "Send message",
  isTyping: "is typing",
  jumpDialog: "Jump to a conversation",
  findPerson: "Find a person",
  findAny: "Find a channel or person",
  messageSomeone: "Message someone…",
  jumpPlaceholder: "Jump to a channel or person…",
  escape: "Esc",
  results: "Results",
  noJump: "Nobody or nothing called “{query}”.",
  memberCount: "{n} members",
  oneMember: "1 member",
  andMore: "and {n} more",
  pinnedMessages: "Pinned messages",
  pinnedTip: "Pinned",
  pinnedIn: "Pinned in {where}",
  thisConversation: "this conversation",
  noPins: "Nothing pinned yet. Pins keep decisions and links easy to find.",
  searchChannel: "Search in channel",
  searchTip: "Search",
  searchIn: "Search {where}",
  closeSearch: "Close search",
  resultCount: "{n} results",
  oneResult: "1 result",
  noMatches: "No messages match",
  noMatchHint: "Nothing in {where} mentions “{query}”.",
  welcome: "Welcome to #{name}",
  dmStart: "This is the start of your conversation with {name}.",
  newChannelHint:
    "You created this channel today. Say what it’s for so people know when to use it.",
  newMarker: "New",
  messageTo: "Message {name}",
  thread: "Thread",
  backToChannel: "Back to channel",
  closeThread: "Close thread",
  someone: "Someone",
};
type Messages = typeof TEAM_CHAT_MESSAGES;

export type ChatView = "threads" | "mentions" | "saved";
/** Where a reaction or bookmark lands: a message, or one reply in its thread. */
export interface ChatTarget {
  channelId: string;
  messageId: string;
  replyId?: string;
}

export interface TeamChatProps {
  workspace: string;
  /** Your person id. */
  me: string;
  people: ChatPerson[];
  /** Channels and direct messages; pass a new array when messages arrive. */
  channels: ChatChannel[];
  /** Who is typing right now, if anyone. */
  typing?: { channelId: string; personId: string } | null;
  /** Posts a message with an optional file and returns it. The composer is hidden without it. */
  onSendMessage?: Action<
    { channelId: string; text: string; file?: File },
    ChatMessage
  >;
  /** Replies in a thread and returns the reply. */
  onReply?: Action<ChatTarget & { text: string }, ChatReply>;
  /** Adds or removes your reaction; shows at once and is undone if this fails. */
  onToggleReaction?: Action<ChatTarget & { emoji: string }>;
  /** Saves a message for later or removes it; shows at once and is undone if this fails. */
  onToggleSaved?: Action<ChatTarget & { saved: boolean }>;
  onCreateChannel?: Action<{ name: string }, ChatChannel>;
  /** Opens (or creates) a direct message with someone. */
  onOpenDirectMessage?: Action<{ personId: string }, ChatChannel>;
  /** Called when you open a channel that had unread messages. */
  onMarkRead?: (channelId: string) => void;
  className?: string;
}

const avatarTone: Record<ChatTone, string> = {
  blue: "bg-category-1/14 text-category-1-foreground",
  orange: "bg-category-7/14 text-category-7-foreground",
  teal: "bg-category-6/16 text-category-6-foreground",
  violet: "bg-category-5/16 text-category-5-foreground",
  rose: "bg-category-4/14 text-category-4-foreground",
  amber: "bg-category-3/18 text-category-3-foreground",
  emerald: "bg-category-2/16 text-category-2-foreground",
  sky: "bg-category-1/16 text-category-1-foreground",
};
const VIEWS: ChatView[] = ["threads", "mentions", "saved"];
const viewIcon: Record<ChatView, LucideIcon> = {
  threads: MessagesSquareIcon,
  mentions: AtSignIcon,
  saved: BookmarkIcon,
};
const EMOJI_CHOICES = ["👍", "🔥", "🎉", "👀", "🙌", "😅", "✅", "❤️"];
const QUICK_EMOJI = ["✅", "👀", "🙌"];
const TYPING_DOTS = ["a", "b", "c"];
const TOKEN = /`[^`]+`|\*\*[^*]+\*\*|\b_[^_]+_\b|@\w+/g;
const spring = { type: "spring", stiffness: 520, damping: 42 } as const;
const ease = [0.23, 1, 0.32, 1] as const;
const headerBtn =
  "flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-muted-foreground text-xs outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent data-popup-open:text-foreground";
const noSend: Action<
  { channelId: string; text: string; file?: File },
  ChatMessage
> = async () => fail();
const noReply: Action<ChatTarget & { text: string }, ChatReply> = async () =>
  fail();
const noCreate: Action<{ name: string }, ChatChannel> = async () => fail();
const noDm: Action<{ personId: string }, ChatChannel> = async () => fail();

type Picked = ChatFile & { file: File };
type ChatHit = {
  channel: ChatChannel;
  message: ChatMessage;
  reply?: ChatReply;
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
const firstName = (name: string) => name.split(" ")[0] ?? name;
const fileExt = (name: string) => name.split(".").pop()?.toUpperCase() ?? "";
const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
const plural = (n: number, one: string, many: string) =>
  n === 1 ? one : interpolate(many, { n });

function toggleReaction(
  reactions: ChatReaction[] | undefined,
  emoji: string,
  me: string
): ChatReaction[] {
  const list = reactions ?? [];
  const hit = list.find((r) => r.emoji === emoji);
  if (!hit) return [...list, { emoji, people: [me] }];
  const who = hit.people.includes(me)
    ? hit.people.filter((p) => p !== me)
    : [...hit.people, me];
  return who.length
    ? list.map((r) => (r.emoji === emoji ? { ...r, people: who } : r))
    : list.filter((r) => r.emoji !== emoji);
}

/** Applies a change to one message or reply inside a channel list. */
function editTarget(
  channels: ChatChannel[],
  target: ChatTarget,
  fn: (m: ChatReply) => ChatReply
): ChatChannel[] {
  return channels.map((c) =>
    c.id !== target.channelId
      ? c
      : {
          ...c,
          messages: c.messages.map((m) => {
            if (m.id !== target.messageId) return m;
            if (!target.replyId) return { ...m, ...fn(m) };
            return {
              ...m,
              replies: m.replies?.map((r) =>
                r.id === target.replyId ? fn(r) : r
              ),
            };
          }),
        }
  );
}

function RichText({
  text,
  people,
  me,
}: {
  text: string;
  people: ChatPerson[];
  me: string;
}) {
  const out: ReactNode[] = [];
  let at = 0;
  for (const match of text.matchAll(TOKEN)) {
    const part = match[0];
    const start = match.index ?? 0;
    if (start > at)
      out.push(<Fragment key={`t${at}`}>{text.slice(at, start)}</Fragment>);
    at = start + part.length;
    if (part.startsWith("`")) {
      out.push(
        <code
          className="rounded-md border bg-muted px-1 py-px font-mono text-[0.8125rem]"
          key={`m${start}`}
        >
          {part.slice(1, -1)}
        </code>
      );
    } else if (part.startsWith("**")) {
      out.push(
        <strong className="font-semibold" key={`m${start}`}>
          {part.slice(2, -2)}
        </strong>
      );
    } else if (part.startsWith("_")) {
      out.push(<em key={`m${start}`}>{part.slice(1, -1)}</em>);
    } else {
      const who = people.find(
        (p) => firstName(p.name).toLowerCase() === part.slice(1).toLowerCase()
      );
      out.push(
        who ? (
          <span
            className={cn(
              "rounded px-0.5 font-medium",
              who.id === me
                ? "bg-warning/16 text-warning-foreground"
                : "bg-info/10 text-info-foreground"
            )}
            key={`m${start}`}
          >
            {part}
          </span>
        ) : (
          <Fragment key={`m${start}`}>{part}</Fragment>
        )
      );
    }
  }
  if (at < text.length)
    out.push(<Fragment key={`t${at}`}>{text.slice(at)}</Fragment>);
  return <>{out}</>;
}

function PersonAvatar({
  person,
  size = "size-9",
  presence,
}: {
  person?: ChatPerson;
  size?: string;
  presence?: boolean;
}) {
  if (!person) return null;
  const tiny = size === "size-5" || size === "size-6";
  const tinyText = size === "size-5" ? "text-[9px]" : "text-[10px]";
  return (
    <span aria-hidden className="relative inline-flex shrink-0">
      <Avatar className={cn(size, tiny ? "rounded-md" : "rounded-lg")}>
        <AvatarFallback
          className={cn(
            "font-medium",
            tiny ? cn("rounded-md", tinyText) : "rounded-lg text-xs",
            avatarTone[person.tone]
          )}
        >
          {initials(person.name)}
        </AvatarFallback>
      </Avatar>
      {presence ? (
        <span
          className={cn(
            "absolute -inset-e-0.5 -bottom-0.5 size-2 rounded-full ring-2 ring-sidebar",
            person.presence === "active"
              ? "bg-success"
              : person.presence === "away"
                ? "bg-warning"
                : "border border-muted-foreground/60 bg-sidebar"
          )}
        />
      ) : null}
    </span>
  );
}

function NavPill() {
  return (
    <motion.span
      className="absolute inset-0 rounded-lg bg-accent"
      layoutId="chat-channel-pill"
      transition={spring}
    />
  );
}

function NewChannelInput({
  onDone,
  t,
}: {
  onDone: (name: string) => void;
  t: Messages;
}) {
  const [name, setName] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  return (
    <label className="flex h-8 items-center gap-2 rounded-lg border bg-background px-2.5 shadow-xs/5 focus-within:border-ring/60 focus-within:ring-3 focus-within:ring-ring/16 dark:bg-input/32">
      <HashIcon
        aria-hidden
        className="size-3.5 shrink-0 text-muted-foreground"
      />
      <input
        aria-label={t.newChannelName}
        className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground"
        onBlur={() => onDone(slugify(name))}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") onDone(slugify(name));
          if (e.key === "Escape") onDone("");
        }}
        placeholder={t.newChannelPlaceholder}
        ref={input}
        value={name}
      />
      <CornerDownLeftIcon
        aria-hidden
        className="size-3.5 shrink-0 text-muted-foreground"
      />
    </label>
  );
}

function ChannelNav({
  workspace,
  channels,
  people,
  active,
  view,
  viewCounts,
  onSelect,
  onView,
  onCreateChannel,
  onJump,
  onNewDm,
  onClose,
  t,
}: {
  workspace: string;
  channels: ChatChannel[];
  people: ChatPerson[];
  active: string;
  view: ChatView | null;
  viewCounts: Record<ChatView, number>;
  onSelect: (id: string) => void;
  onView: (v: ChatView) => void;
  onCreateChannel?: (name: string) => void;
  onJump: () => void;
  onNewDm?: () => void;
  onClose?: () => void;
  t: Messages;
}) {
  const [open, setOpen] = useState({ channel: true, dm: true });
  const [creating, setCreating] = useState(false);
  const row =
    "group/row relative flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const section = (kind: "channel" | "dm", title: string) => {
    const add =
      kind === "channel"
        ? onCreateChannel
          ? () => setCreating(true)
          : undefined
        : onNewDm;
    return (
      <div className="mt-4">
        <div className="flex h-7 items-center ps-1.5 pe-1">
          <button
            aria-expanded={open[kind]}
            className="flex h-7 cursor-pointer items-center gap-1 rounded-md px-1 font-medium text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setOpen((o) => ({ ...o, [kind]: !o[kind] }))}
            type="button"
          >
            {title}
            <ChevronDownIcon
              aria-hidden
              className={cn(
                "size-3 transition-transform duration-200 ease-out",
                !open[kind] && "-rotate-90"
              )}
            />
          </button>
          {add ? (
            <Button
              aria-label={kind === "channel" ? t.createChannel : t.newDm}
              className="ms-auto"
              onClick={() => {
                setOpen((o) => ({ ...o, [kind]: true }));
                add();
              }}
              size="icon-xs"
              variant="ghost"
            >
              <PlusIcon />
            </Button>
          ) : null}
        </div>
        <AnimatePresence initial={false}>
          {open[kind] ? (
            <motion.ul
              animate={{ height: "auto", opacity: 1 }}
              className="-mx-1 flex flex-col gap-0.5 overflow-hidden px-1"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease }}
            >
              {channels
                .filter((c) => c.kind === kind)
                .map((c) => {
                  const on = !view && c.id === active;
                  const loud =
                    !c.muted && ((c.unread ?? 0) > 0 || (c.mentions ?? 0) > 0);
                  const person = c.with
                    ? people.find((p) => p.id === c.with)
                    : undefined;
                  return (
                    <li key={c.id}>
                      <button
                        aria-current={on ? "page" : undefined}
                        className={cn(
                          row,
                          on || loud
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                          c.muted && !on && "[&>svg]:opacity-60"
                        )}
                        onClick={() => onSelect(c.id)}
                        type="button"
                      >
                        {on ? (
                          <NavPill />
                        ) : (
                          <span className="absolute inset-0 rounded-lg transition-colors group-hover/row:bg-accent" />
                        )}
                        {person ? (
                          <span className="relative -ms-0.5">
                            <PersonAvatar
                              person={person}
                              presence
                              size="size-6"
                            />
                          </span>
                        ) : c.private ? (
                          <LockIcon
                            aria-hidden
                            className="relative size-3.5 shrink-0 opacity-70"
                          />
                        ) : (
                          <HashIcon
                            aria-hidden
                            className="relative size-3.5 shrink-0 opacity-70"
                          />
                        )}
                        <span
                          className={cn(
                            "relative min-w-0 flex-1 truncate",
                            loud ? "font-semibold" : "font-medium"
                          )}
                        >
                          {c.name}
                        </span>
                        {c.muted ? (
                          <>
                            <BellOffIcon
                              aria-hidden
                              className="relative size-3 shrink-0"
                            />
                            <span className="sr-only">{t.muted}</span>
                          </>
                        ) : null}
                        {c.mentions ? (
                          <span className="relative flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-category-4-strong px-1 font-semibold text-[11px] text-white tabular-nums">
                            {c.mentions}
                          </span>
                        ) : c.unread && kind === "dm" ? (
                          <span className="relative flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-foreground px-1 font-semibold text-[11px] text-background tabular-nums">
                            {c.unread}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              {kind === "channel" && creating && onCreateChannel ? (
                <li>
                  <NewChannelInput
                    onDone={(name) => {
                      setCreating(false);
                      if (name) onCreateChannel(name);
                    }}
                    t={t}
                  />
                </li>
              ) : null}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span
          aria-hidden
          className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-category-6-strong font-semibold text-[11px] text-white"
        >
          {initials(workspace)}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate font-medium">{workspace}</div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            {interpolate(t.online, {
              n: people.filter((p) => p.presence === "active").length,
            })}
          </div>
        </div>
        {onClose ? (
          <Button
            aria-label={t.closeChannels}
            onClick={onClose}
            size="icon-sm"
            variant="ghost"
          >
            <XIcon />
          </Button>
        ) : null}
      </div>
      <div className="px-2 pb-1">
        <button
          className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg border bg-background px-2.5 text-muted-foreground shadow-xs/5 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring dark:bg-input/32"
          onClick={onJump}
          type="button"
        >
          <SearchIcon aria-hidden className="size-4" />
          <span className="flex-1 text-start">{t.jumpTo}</span>
          <Kbd aria-hidden>{t.jumpKeys}</Kbd>
        </button>
      </div>
      <nav
        aria-label={t.conversations}
        className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin"
      >
        <LayoutGroup id="chat-nav">
          <div className="mt-2 flex flex-col gap-0.5">
            {VIEWS.map((v) => {
              const on = view === v;
              const n = viewCounts[v];
              const Icon = viewIcon[v];
              return (
                <button
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    row,
                    on
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  key={v}
                  onClick={() => onView(v)}
                  type="button"
                >
                  {on ? (
                    <NavPill />
                  ) : (
                    <span className="absolute inset-0 rounded-lg transition-colors group-hover/row:bg-accent" />
                  )}
                  <Icon aria-hidden className="relative size-4" />
                  <span className="relative flex-1 font-medium">
                    {t[`view_${v}`]}
                  </span>
                  {n > 0 ? (
                    <span className="relative text-muted-foreground text-xs tabular-nums">
                      {n}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          {section("channel", t.channels)}
          {section("dm", t.directMessages)}
        </LayoutGroup>
      </nav>
    </div>
  );
}

function Reactions({
  reactions,
  me,
  people,
  onToggle,
  t,
}: {
  reactions: ChatReaction[];
  me: string;
  people: ChatPerson[];
  onToggle?: (emoji: string) => void;
  t: Messages;
}) {
  if (!reactions.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      <AnimatePresence initial={false} mode="popLayout">
        {reactions.map((r) => {
          const mine = r.people.includes(me);
          const names = r.people
            .map((id) =>
              id === me
                ? t.you
                : firstName(people.find((p) => p.id === id)?.name ?? id)
            )
            .join(", ");
          const inner = (
            <>
              <span className="text-[13px] leading-none">{r.emoji}</span>
              <span className="relative inline-flex h-4 overflow-hidden font-medium tabular-nums">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    initial={{ y: 10, opacity: 0 }}
                    key={r.people.length}
                    transition={{ duration: 0.18, ease }}
                  >
                    {r.people.length}
                  </motion.span>
                </AnimatePresence>
              </span>
            </>
          );
          const label = interpolate(t.reaction, {
            emoji: r.emoji,
            count: r.people.length,
            names,
          });
          const chip = cn(
            "flex h-6 items-center gap-1 rounded-full border px-2 text-xs",
            mine
              ? "border-info/40 bg-info/10 text-info-foreground"
              : "bg-background dark:bg-input/32"
          );
          return onToggle ? (
            <motion.button
              animate={{ opacity: 1, scale: 1 }}
              aria-label={label}
              aria-pressed={mine}
              className={cn(
                chip,
                "cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
                !mine && "hover:border-foreground/20"
              )}
              exit={{ opacity: 0, scale: 0.9 }}
              initial={{ opacity: 0, scale: 0.9 }}
              key={r.emoji}
              layout
              onClick={() => onToggle(r.emoji)}
              title={names}
              transition={spring}
              type="button"
            >
              {inner}
            </motion.button>
          ) : (
            <span
              aria-label={label}
              className={chip}
              key={r.emoji}
              role="img"
              title={names}
            >
              {inner}
            </span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function EmojiPicker({
  onPick,
  t,
}: {
  onPick: (emoji: string) => void;
  t: Messages;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        aria-label={t.addReaction}
        className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent"
      >
        <SmilePlusIcon aria-hidden className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0" side="top" sideOffset={6}>
        <div className="grid grid-cols-4 gap-0.5 p-1">
          {EMOJI_CHOICES.map((e) => (
            <button
              aria-label={interpolate(t.reactWith, { emoji: e })}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-lg outline-none transition-[background-color,scale] duration-100 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:scale-90"
              key={e}
              onClick={() => {
                onPick(e);
                setOpen(false);
              }}
              type="button"
            >
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MessageRow({
  message,
  grouped,
  people,
  me,
  inThread,
  isNew,
  onReact,
  onSave,
  onOpenThread,
  threadOpen,
  flash,
  time,
  t,
}: {
  message: ChatMessage | ChatReply;
  grouped: boolean;
  people: ChatPerson[];
  me: string;
  inThread?: boolean;
  isNew?: boolean;
  onReact?: (emoji: string) => void;
  onSave?: () => void;
  onOpenThread?: () => void;
  threadOpen?: boolean;
  flash?: boolean;
  time: (iso: string) => string;
  t: Messages;
}) {
  const author = people.find((p) => p.id === message.author);
  const full = message as ChatMessage;
  const replies = !inThread ? full.replies : undefined;
  const repliers = replies
    ? Array.from(new Set(replies.map((r) => r.author))).slice(0, 3)
    : [];
  const lastReply = replies?.at(-1);
  const hasTools = Boolean(onReact || onSave || (!inThread && onOpenThread));
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group/msg relative flex gap-3 rounded-xl px-3 transition-colors duration-300 focus-within:bg-accent/50 hover:bg-accent/50",
        grouped ? "py-0.5" : "pt-2 pb-1 not-first:mt-1.5",
        threadOpen && "bg-info/6 hover:bg-info/8",
        message.saved && "bg-warning/6 hover:bg-warning/8",
        flash && "bg-warning/16 duration-0"
      )}
      data-msg={message.id}
      initial={isNew ? { opacity: 0, y: 8 } : false}
      transition={spring}
    >
      <div className="w-9 shrink-0">
        {grouped ? (
          <span className="block pt-0.5 text-end text-[10px] text-muted-foreground tabular-nums leading-5 opacity-0 group-hover/msg:opacity-100">
            {time(message.sentAt)}
          </span>
        ) : (
          <PersonAvatar person={author} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {message.saved ? (
          <div className="flex items-center gap-1 pb-0.5 font-medium text-warning-foreground text-xs">
            <BookmarkIcon aria-hidden className="size-3 fill-current" />
            {t.savedForLater}
          </div>
        ) : null}
        {grouped ? null : (
          <div className="flex items-baseline gap-2">
            <span className="font-semibold">{author?.name}</span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {time(message.sentAt)}
            </span>
          </div>
        )}
        <p className="text-pretty leading-6 wrap-anywhere">
          <RichText me={me} people={people} text={message.text} />
        </p>
        {full.file ? (
          <div className="mt-2 flex w-full max-w-sm items-center gap-3 rounded-xl border bg-card p-2.5 shadow-xs/5">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-category-4/12 text-category-4-foreground"
            >
              <FileTextIcon className="size-5" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate font-medium">
                {full.file.name}
              </span>
              <span className="mt-0.5 block text-muted-foreground text-xs tabular-nums">
                {[
                  fileExt(full.file.name),
                  full.file.pages
                    ? interpolate(t.pages, { n: full.file.pages })
                    : null,
                  full.file.size,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          </div>
        ) : null}
        <Reactions
          me={me}
          onToggle={onReact}
          people={people}
          reactions={message.reactions ?? []}
          t={t}
        />
        {replies?.length && lastReply && onOpenThread ? (
          <button
            className="group/thr -ms-1.5 mt-1 flex cursor-pointer items-center gap-2 rounded-lg py-1 ps-1.5 pe-2 text-start outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-accent"
            onClick={onOpenThread}
            type="button"
          >
            <span className="flex gap-0.5">
              {repliers.map((id) => (
                <PersonAvatar
                  key={id}
                  person={people.find((x) => x.id === id)}
                  size="size-5"
                />
              ))}
            </span>
            <span className="font-medium text-info-foreground text-xs">
              {plural(replies.length, t.oneReply, t.replies)}
            </span>
            <span className="text-muted-foreground text-xs group-hover/thr:hidden">
              {interpolate(t.lastReply, { time: time(lastReply.sentAt) })}
            </span>
            <span className="hidden text-muted-foreground text-xs group-hover/thr:inline">
              {t.viewThread}
            </span>
          </button>
        ) : null}
      </div>

      {hasTools ? (
        <div className="pointer-events-none absolute -top-3 inset-e-3 z-10 flex items-center gap-0.5 rounded-lg border bg-popover p-0.5 opacity-0 shadow-xs/5 transition-opacity duration-100 group-focus-within/msg:pointer-events-auto group-hover/msg:pointer-events-auto group-focus-within/msg:opacity-100 group-hover/msg:opacity-100">
          {onReact ? (
            <>
              {QUICK_EMOJI.map((e) => (
                <button
                  aria-label={interpolate(t.reactWith, { emoji: e })}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-md text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  key={e}
                  onClick={() => onReact(e)}
                  type="button"
                >
                  {e}
                </button>
              ))}
              <span aria-hidden className="mx-0.5 h-4 w-px bg-border" />
              <EmojiPicker onPick={onReact} t={t} />
            </>
          ) : null}
          {!inThread && onOpenThread ? (
            <button
              aria-label={t.replyInThread}
              className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onOpenThread}
              type="button"
            >
              <MessageSquareTextIcon aria-hidden className="size-4" />
            </button>
          ) : null}
          {onSave ? (
            <button
              aria-label={message.saved ? t.removeSaved : t.saveForLater}
              aria-pressed={Boolean(message.saved)}
              className={cn(
                "flex size-8 cursor-pointer items-center justify-center rounded-md outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                message.saved
                  ? "text-warning-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={onSave}
              type="button"
            >
              <BookmarkIcon
                aria-hidden
                className={cn("size-4", message.saved && "fill-current")}
              />
            </button>
          ) : null}
        </div>
      ) : null}
    </motion.div>
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

function Composer({
  placeholder,
  value,
  onChange,
  onSend,
  inputRef,
  compact,
  file,
  onFile,
  pending,
  t,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  compact?: boolean;
  file?: Picked;
  onFile?: (file: Picked | undefined) => void;
  pending: boolean;
  t: Messages;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const size = useFileSize();
  const canSend = (Boolean(value.trim()) || Boolean(file)) && !pending;
  const wrap = (left: string, right = left) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    onChange(
      value.slice(0, start) +
        left +
        value.slice(start, end) +
        right +
        value.slice(end)
    );
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + left.length, end + left.length);
    });
  };
  // Grow with the text, up to 160px.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  });
  const tool =
    "flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="rounded-2xl border bg-card shadow-xs/5 transition-shadow focus-within:border-ring/60 focus-within:ring-3 focus-within:ring-ring/16">
      <textarea
        aria-label={placeholder}
        className="block w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-sm leading-6 outline-none placeholder:text-muted-foreground/70"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSend();
          }
          if ((e.metaKey || e.ctrlKey) && !compact) {
            const k = e.key.toLowerCase();
            if (k === "b" || k === "i" || k === "e") {
              e.preventDefault();
              wrap(k === "b" ? "**" : k === "i" ? "_" : "`");
            }
          }
        }}
        placeholder={placeholder}
        ref={inputRef}
        rows={1}
        value={value}
      />
      {file ? (
        <div className="px-2.5 pb-1">
          <span className="inline-flex h-8 max-w-full items-center gap-2 rounded-lg border bg-background ps-2 pe-0.5 text-xs dark:bg-input/32">
            <FileTextIcon
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground"
            />
            <span className="min-w-0 truncate font-medium">{file.name}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {file.size}
            </span>
            <button
              aria-label={interpolate(t.remove, { name: file.name })}
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onFile?.(undefined)}
              type="button"
            >
              <XIcon aria-hidden className="size-3" />
            </button>
          </span>
        </div>
      ) : null}
      <div className="flex items-center gap-0.5 px-2 pb-2">
        {compact ? null : (
          <>
            <button
              aria-label={t.bold}
              className={tool}
              onClick={() => wrap("**")}
              title={t.boldTip}
              type="button"
            >
              <BoldIcon aria-hidden className="size-4" />
            </button>
            <button
              aria-label={t.italic}
              className={tool}
              onClick={() => wrap("_")}
              title={t.italicTip}
              type="button"
            >
              <ItalicIcon aria-hidden className="size-4" />
            </button>
            <button
              aria-label={t.code}
              className={cn(tool, "hidden @lg:flex")}
              onClick={() => wrap("`")}
              title={t.codeTip}
              type="button"
            >
              <CodeIcon aria-hidden className="size-4" />
            </button>
            <span aria-hidden className="mx-1 h-4 w-px bg-border" />
          </>
        )}
        {onFile ? (
          <>
            <input
              aria-hidden
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile({ name: f.name, size: size(f.size), file: f });
                e.target.value = "";
                inputRef.current?.focus();
              }}
              ref={fileInput}
              tabIndex={-1}
              type="file"
            />
            <button
              aria-label={t.attach}
              className={tool}
              onClick={() => fileInput.current?.click()}
              type="button"
            >
              <PaperclipIcon aria-hidden className="size-4" />
            </button>
          </>
        ) : null}
        <button
          aria-label={t.mention}
          className={tool}
          onClick={() => {
            onChange(`${value}${value && !value.endsWith(" ") ? " " : ""}@`);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          type="button"
        >
          <AtSignIcon aria-hidden className="size-4" />
        </button>
        <div className="ms-auto flex items-center gap-2">
          <span
            aria-hidden
            className="hidden text-muted-foreground text-xs @xl:inline"
          >
            <Kbd className="h-4 text-[10px]">{t.newLineKeys}</Kbd> {t.newLine}
          </span>
          <Button
            aria-label={t.sendMessage}
            className="transition-[box-shadow,scale,opacity] duration-150 ease-out active:scale-[0.97]"
            disabled={!canSend}
            onClick={onSend}
            size="icon-sm"
            variant={canSend ? "default" : "ghost"}
          >
            <SendHorizontalIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ name, t }: { name: string | null; t: Messages }) {
  return (
    <div
      aria-live="polite"
      className="flex h-6 items-center gap-2 px-1 text-muted-foreground text-xs"
    >
      <AnimatePresence>
        {name ? (
          <motion.span
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
            exit={{ opacity: 0, y: 2 }}
            initial={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.18, ease }}
          >
            <span aria-hidden className="flex gap-0.5">
              {TYPING_DOTS.map((d, i) => (
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  className="size-1 rounded-full bg-current"
                  key={d}
                  transition={{
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </span>
            <span>
              <span className="font-medium text-foreground">{name}</span>{" "}
              {t.isTyping}
            </span>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function JumpPalette({
  mode,
  onOpenChange,
  channels,
  people,
  me,
  canStartDm,
  onChannel,
  onPerson,
  t,
}: {
  mode: "all" | "people" | null;
  onOpenChange: (open: boolean) => void;
  channels: ChatChannel[];
  people: ChatPerson[];
  me: string;
  canStartDm: boolean;
  onChannel: (id: string) => void;
  onPerson: (id: string) => void;
  t: Messages;
}) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const q = query.trim().toLowerCase();
  const items = [
    ...(mode === "all"
      ? channels
          .filter((c) => c.kind === "channel")
          .map((c) => ({
            key: c.id,
            label: c.name,
            channel: c,
            person: undefined,
          }))
      : []),
    ...people
      .filter((p) => p.id !== me)
      .map((p) => ({
        key: `p-${p.id}`,
        label: p.name,
        channel: channels.find((c) => c.with === p.id),
        person: p,
      }))
      .filter((i) => canStartDm || i.channel),
  ].filter((i) => !q || i.label.toLowerCase().includes(q));
  const current = Math.min(index, Math.max(0, items.length - 1));
  const optionId = (key: string) => `${uid}-${key.replace(/[^\w-]/g, "-")}`;
  const pick = (i: (typeof items)[number] | undefined) => {
    if (!i) return;
    if (i.person) onPerson(i.person.id);
    else onChannel(i.key);
  };
  const active = items[current];
  return (
    <Dialog
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setQuery("");
          setIndex(0);
        }
      }}
      open={mode !== null}
    >
      <DialogContent
        className="top-16 flex max-h-105 translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">
          {mode === "people" ? t.newDm : t.jumpDialog}
        </DialogTitle>
        <div className="flex h-12 shrink-0 items-center gap-2.5 border-b px-4">
          <SearchIcon
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground"
          />
          <input
            aria-activedescendant={active ? optionId(active.key) : undefined}
            aria-autocomplete="list"
            aria-controls={`${uid}-list`}
            aria-expanded={items.length > 0}
            aria-label={mode === "people" ? t.findPerson : t.findAny}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex((current + 1) % Math.max(1, items.length));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex(
                  (current - 1 + items.length) % Math.max(1, items.length)
                );
              } else if (e.key === "Enter") {
                e.preventDefault();
                pick(active);
              }
            }}
            placeholder={
              mode === "people" ? t.messageSomeone : t.jumpPlaceholder
            }
            role="combobox"
            value={query}
          />
          <Kbd aria-hidden>{t.escape}</Kbd>
        </div>
        <div
          aria-label={t.results}
          className="min-h-0 overflow-y-auto p-1.5 scrollbar-thin"
          id={`${uid}-list`}
          role="listbox"
        >
          {items.length === 0 ? (
            <p
              className="px-3 py-6 text-center text-muted-foreground text-xs"
              role="presentation"
            >
              {interpolate(t.noJump, { query })}
            </p>
          ) : (
            items.map((i, n) => (
              <div
                aria-selected={n === current}
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5",
                  n === current
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground"
                )}
                id={optionId(i.key)}
                key={i.key}
                onClick={() => pick(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pick(i);
                  }
                }}
                onMouseMove={() => n !== current && setIndex(n)}
                role="option"
                tabIndex={-1}
              >
                {i.person ? (
                  <PersonAvatar person={i.person} presence size="size-6" />
                ) : i.channel?.private ? (
                  <LockIcon aria-hidden className="size-3.5 shrink-0" />
                ) : (
                  <HashIcon aria-hidden className="size-3.5 shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {i.label}
                </span>
                {i.person?.title ? (
                  <span className="truncate text-xs">{i.person.title}</span>
                ) : null}
                {!i.person && i.channel?.members ? (
                  <span className="text-xs tabular-nums">
                    {interpolate(t.memberCount, { n: i.channel.members })}
                  </span>
                ) : null}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ViewList({
  view,
  hits,
  people,
  me,
  onOpen,
  onMenu,
  time,
  t,
}: {
  view: ChatView;
  hits: ChatHit[];
  people: ChatPerson[];
  me: string;
  onOpen: (hit: ChatHit) => void;
  onMenu: () => void;
  time: (iso: string) => string;
  t: Messages;
}) {
  const Icon = viewIcon[view];
  const title = t[`view_${view}`];
  return (
    <section aria-label={title} className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-13 shrink-0 items-center gap-2 border-b px-3 @lg:px-4">
        <Button
          aria-label={t.openChannels}
          className="@4xl:hidden"
          onClick={onMenu}
          size="icon-sm"
          variant="ghost"
        >
          <MenuIcon />
        </Button>
        <Icon aria-hidden className="size-4 text-muted-foreground" />
        <h2 className="font-semibold">{title}</h2>
        <span className="text-muted-foreground text-xs tabular-nums">
          {hits.length}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-1 py-2 @lg:px-2 scrollbar-thin">
        {hits.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-8 pb-10 text-center">
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-xs/5"
            >
              <Icon className="size-5" />
            </span>
            <p className="mt-3 font-medium">{t.nothingYet}</p>
            <p className="mt-1 max-w-64 text-pretty text-muted-foreground text-xs">
              {t[`empty_${view}`]}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {hits.map((h) => {
              const m = h.reply ?? h.message;
              const author = people.find((p) => p.id === m.author);
              const replies = h.message.replies ?? [];
              const last = replies.at(-1);
              return (
                <li
                  key={`${h.channel.id}:${h.message.id}:${h.reply?.id ?? ""}`}
                >
                  <button
                    className="flex w-full cursor-pointer gap-3 rounded-xl px-3 py-2.5 text-start outline-none transition-colors hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => onOpen(h)}
                    type="button"
                  >
                    <PersonAvatar person={author} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="truncate font-semibold">
                          {author?.name}
                        </span>
                        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                          {time(m.sentAt)}
                        </span>
                        <span className="ms-auto flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                          {h.channel.kind === "dm"
                            ? h.channel.name
                            : `#${h.channel.name}`}
                          {h.reply ? ` · ${t.inThread}` : null}
                        </span>
                      </span>
                      <span className="line-clamp-2 text-pretty leading-6">
                        <RichText me={me} people={people} text={m.text} />
                      </span>
                      {view === "threads" && last ? (
                        <span className="mt-0.5 block font-medium text-info-foreground text-xs">
                          {plural(replies.length, t.oneReply, t.replies)}
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            ·{" "}
                            {interpolate(t.lastShort, {
                              time: time(last.sentAt),
                            })}
                          </span>
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function TeamChatScreen({
  workspace,
  me,
  people,
  channels: initialChannels,
  typing,
  onSendMessage,
  onReply,
  onToggleReaction,
  onToggleSaved,
  onCreateChannel,
  onOpenDirectMessage,
  onMarkRead,
  className,
}: TeamChatProps) {
  const t = useMessages("teamChat", TEAM_CHAT_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone } = useWirefront();
  const [channels, setChannels] = useState(initialChannels);
  const [syncedFrom, setSyncedFrom] = useState(initialChannels);
  if (syncedFrom !== initialChannels) {
    setSyncedFrom(initialChannels);
    setChannels(initialChannels);
  }
  const [active, setActive] = useState(initialChannels[0]?.id ?? "");
  const [view, setView] = useState<ChatView | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [jump, setJump] = useState<"all" | "people" | null>(null);
  const [search, setSearch] = useState<string | null>(null);
  const [pinsOpen, setPinsOpen] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, Picked | undefined>>({});
  const [unreadFrom, setUnreadFrom] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState<string | null>(null);
  // Messages already on screen at first render do not animate in; later ones do.
  const [seen] = useState(
    () =>
      new Set(
        initialChannels.flatMap((c) =>
          c.messages.flatMap((m) => [
            m.id,
            ...(m.replies ?? []).map((r) => r.id),
          ])
        )
      )
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const threadScrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const threadComposerRef = useRef<HTMLTextAreaElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const atBottom = useRef(true);

  const channel = channels.find((c) => c.id === active) ?? channels[0];
  const thread =
    view || !channel
      ? null
      : (channel.messages.find((m) => m.id === threadId) ?? null);
  const dmPerson = channel?.with
    ? people.find((p) => p.id === channel.with)
    : undefined;
  const meName = firstName(people.find((p) => p.id === me)?.name ?? me);
  const nameOf = (id: string) =>
    firstName(people.find((p) => p.id === id)?.name ?? t.someone);
  const where = dmPerson ? t.thisConversation : `#${channel?.name ?? ""}`;

  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  const dayLabel = (iso: string) => {
    const diff = Math.round(
      (Date.parse(dayKey(now())) - Date.parse(dayKey(new Date(iso)))) /
        86_400_000
    );
    return diff <= 0
      ? t.today
      : diff === 1
        ? t.yesterday
        : fmt.date(iso, { weekday: "long", month: "short", day: "numeric" });
  };
  const time = (iso: string) => fmt.time(iso);

  const hits = useMemo(() => {
    const mention = new RegExp(`@${meName}\\b`, "i");
    const out: Record<ChatView, ChatHit[]> = {
      threads: [],
      mentions: [],
      saved: [],
    };
    for (const c of channels) {
      for (const m of c.messages) {
        if (m.replies?.length) out.threads.push({ channel: c, message: m });
        if (mention.test(m.text)) out.mentions.push({ channel: c, message: m });
        if (m.saved) out.saved.push({ channel: c, message: m });
        for (const r of m.replies ?? []) {
          if (mention.test(r.text))
            out.mentions.push({ channel: c, message: m, reply: r });
          if (r.saved) out.saved.push({ channel: c, message: m, reply: r });
        }
      }
    }
    return out;
  }, [channels, meName]);

  const q = search?.trim().toLowerCase() ?? "";
  const shown = !channel
    ? []
    : q
      ? channel.messages.filter((m) => m.text.toLowerCase().includes(q))
      : channel.messages;

  // Jump to the newest message when the conversation, its length or the search changes.
  const scrollKey = `${channel?.id}|${channel?.messages.length}|${view}|${q}`;
  const lastScrollKey = useRef("");
  useLayoutEffect(() => {
    if (lastScrollKey.current === scrollKey) return;
    lastScrollKey.current = scrollKey;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    atBottom.current = true;
  });
  // Stay pinned to the bottom while content grows (images, reactions, typing).
  const followContent = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const box = scrollRef.current;
      if (box && atBottom.current) box.scrollTop = box.scrollHeight;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => {
    if (!flash) return;
    const box = scrollRef.current;
    const target = box?.querySelector<HTMLElement>(`[data-msg="${flash}"]`);
    if (box && target) {
      const offset =
        target.getBoundingClientRect().top - box.getBoundingClientRect().top;
      box.scrollTo?.({
        top:
          box.scrollTop + offset - (box.clientHeight - target.offsetHeight) / 2,
      });
    }
    const id = window.setTimeout(() => setFlash(null), 1400);
    return () => window.clearTimeout(id);
  }, [flash]);
  // A thread opens at the top; a new reply scrolls it to the bottom.
  const threadCount = thread?.replies?.length ?? 0;
  const lastThread = useRef<{ id: string | null; count: number }>({
    id: null,
    count: 0,
  });
  useLayoutEffect(() => {
    const el = threadScrollRef.current;
    const prev = lastThread.current;
    if (prev.id === threadId && prev.count === threadCount) return;
    lastThread.current = { id: threadId, count: threadCount };
    if (el) el.scrollTop = prev.id === threadId ? el.scrollHeight : 0;
  });

  const reset = () => {
    setView(null);
    setSearch(null);
    setThreadId(null);
    setDrawer(false);
  };
  const select = (id: string) => {
    const target = channels.find((c) => c.id === id);
    if (target?.unread && target.messages.length >= target.unread) {
      const first = target.messages[target.messages.length - target.unread];
      if (first) setUnreadFrom((u) => ({ ...u, [id]: first.id }));
    }
    if (target?.unread || target?.mentions) {
      setChannels((cs) =>
        cs.map((c) => (c.id === id ? { ...c, unread: 0, mentions: 0 } : c))
      );
      onMarkRead?.(id);
    }
    setActive(id);
    reset();
  };
  const focusComposer = () =>
    requestAnimationFrame(() =>
      composerRef.current?.focus({ preventScroll: true })
    );

  const addChannel = (c: ChatChannel) =>
    setChannels((cs) => {
      if (cs.some((x) => x.id === c.id)) return cs;
      if (c.kind === "dm") return [...cs, c];
      const firstDm = cs.findIndex((x) => x.kind === "dm");
      return firstDm < 0
        ? [...cs, c]
        : [...cs.slice(0, firstDm), c, ...cs.slice(firstDm)];
    });
  const dm = useAction(onOpenDirectMessage ?? noDm, {
    onSuccess: (c) => {
      addChannel(c);
      setActive(c.id);
      reset();
      focusComposer();
    },
  });
  const openDm = (personId: string) => {
    setJump(null);
    const existing = channels.find((c) => c.with === personId);
    if (existing) {
      select(existing.id);
      focusComposer();
    } else if (onOpenDirectMessage) dm.run({ personId });
  };
  const create = useAction(onCreateChannel ?? noCreate, {
    onSuccess: (c) => {
      addChannel(c);
      setActive(c.id);
      reset();
      focusComposer();
    },
  });
  const createChannel = (name: string) => {
    if (channels.some((c) => c.id === name || c.name === name))
      select(
        channels.find((c) => c.id === name || c.name === name)?.id ?? name
      );
    else create.run({ name });
  };

  const react = useAction(onToggleReaction ?? (async () => {}), {
    optimistic: ({ emoji, ...target }) => {
      setChannels((cs) =>
        editTarget(cs, target, (m) => ({
          ...m,
          reactions: toggleReaction(m.reactions, emoji, me),
        }))
      );
      return () =>
        setChannels((cs) =>
          editTarget(cs, target, (m) => ({
            ...m,
            reactions: toggleReaction(m.reactions, emoji, me),
          }))
        );
    },
  });
  const save = useAction(onToggleSaved ?? (async () => {}), {
    optimistic: ({ saved, ...target }) => {
      setChannels((cs) => editTarget(cs, target, (m) => ({ ...m, saved })));
      return () =>
        setChannels((cs) =>
          editTarget(cs, target, (m) => ({ ...m, saved: !saved }))
        );
    },
  });
  const reactTo = onToggleReaction
    ? (target: ChatTarget) => (emoji: string) => react.run({ ...target, emoji })
    : () => undefined;
  const saveFor = onToggleSaved
    ? (target: ChatTarget, saved?: boolean) => () =>
        save.run({ ...target, saved: !saved })
    : () => undefined;

  const post = useAction(onSendMessage ?? noSend, {
    onSuccess: (message, { channelId }) => {
      setChannels((cs) =>
        cs.map((c) =>
          c.id === channelId
            ? {
                ...c,
                messages: [
                  ...c.messages.filter((m) => m.id !== message.id),
                  message,
                ],
              }
            : c
        )
      );
      setDrafts((d) => ({ ...d, [channelId]: "" }));
      setFiles((f) => ({ ...f, [channelId]: undefined }));
      setSearch(null);
    },
  });
  const send = () => {
    if (!channel || !onSendMessage) return;
    const text = (drafts[channel.id] ?? "").trim();
    const file = files[channel.id];
    if (!text && !file) return;
    post.run({ channelId: channel.id, text, file: file?.file });
  };
  const reply = useAction(onReply ?? noReply, {
    onSuccess: (r, { channelId, messageId }) => {
      setChannels((cs) =>
        cs.map((c) =>
          c.id === channelId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === messageId
                    ? {
                        ...m,
                        replies: [
                          ...(m.replies ?? []).filter((x) => x.id !== r.id),
                          r,
                        ],
                      }
                    : m
                ),
              }
            : c
        )
      );
      setDrafts((d) => ({ ...d, [`thread:${messageId}`]: "" }));
    },
  });
  const sendReply = () => {
    if (!thread || !channel || !onReply) return;
    const text = (drafts[`thread:${thread.id}`] ?? "").trim();
    if (text) reply.run({ channelId: channel.id, messageId: thread.id, text });
  };

  const openThread = (id: string) => {
    setThreadId(id);
    requestAnimationFrame(() =>
      threadComposerRef.current?.focus({ preventScroll: true })
    );
  };
  const openHit = (h: ChatHit) => {
    const fromThreads = view === "threads";
    select(h.channel.id);
    if (h.reply || fromThreads) openThread(h.message.id);
    else setFlash(h.message.id);
  };

  // Keyboard: ⌘K jump, Alt+↑/↓ switch conversation, Esc closes the thread, typing focuses the composer.
  const keysRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keysRef.current = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setDrawer(false);
      setJump("all");
      return;
    }
    if (e.key === "Escape") {
      if (threadId) {
        setThreadId(null);
        composerRef.current?.focus({ preventScroll: true });
      }
      return;
    }
    if (
      e.altKey &&
      (e.key === "ArrowDown" || e.key === "ArrowUp") &&
      channels.length
    ) {
      e.preventDefault();
      const idx = view ? -1 : channels.findIndex((c) => c.id === active);
      const next =
        channels[
          (idx + (e.key === "ArrowDown" ? 1 : -1) + channels.length) %
            channels.length
        ];
      if (next) select(next.id);
      return;
    }
    const target = e.target as HTMLElement;
    const typingNow =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;
    if (typingNow || e.metaKey || e.ctrlKey || e.altKey || view) return;
    if (e.key.length === 1 && /\S/.test(e.key))
      composerRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => keysRef.current(e);
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  const typingHere =
    typing &&
    channel &&
    typing.channelId === channel.id &&
    typing.personId !== me
      ? nameOf(typing.personId)
      : null;
  const marker = q || !channel ? undefined : unreadFrom[channel.id];
  const pinned = channel
    ? (channel.pinned ?? [])
        .map((id) => channel.messages.find((m) => m.id === id))
        .filter((m): m is ChatMessage => Boolean(m))
    : [];
  const error =
    post.error ??
    reply.error ??
    react.error ??
    save.error ??
    create.error ??
    dm.error;

  const navProps = {
    workspace,
    channels,
    people,
    active,
    view,
    t,
    viewCounts: {
      threads: 0,
      mentions: hits.mentions.length,
      saved: hits.saved.length,
    },
    onSelect: select,
    onView: (v: ChatView) => {
      setView(v);
      setThreadId(null);
      setSearch(null);
      setDrawer(false);
    },
    onCreateChannel: onCreateChannel ? createChannel : undefined,
    onJump: () => {
      setDrawer(false);
      setJump("all");
    },
    onNewDm: onOpenDirectMessage
      ? () => {
          setDrawer(false);
          setJump("people");
        }
      : undefined,
  };

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
            aria-label={t.channels}
            className="hidden w-60 shrink-0 @4xl:block"
          >
            <ChannelNav {...navProps} />
          </aside>

          <Sheet onOpenChange={setDrawer} open={drawer}>
            <SheetContent
              className="w-66 max-w-[calc(100%-3rem)] gap-0 bg-sidebar p-0"
              showCloseButton={false}
              side="left"
            >
              <SheetTitle className="sr-only">{t.channels}</SheetTitle>
              <ChannelNav {...navProps} onClose={() => setDrawer(false)} />
            </SheetContent>
          </Sheet>

          <JumpPalette
            canStartDm={Boolean(onOpenDirectMessage)}
            channels={channels}
            me={me}
            mode={jump}
            onChannel={(id) => {
              setJump(null);
              select(id);
              focusComposer();
            }}
            onOpenChange={(open) => {
              if (!open) setJump(null);
            }}
            onPerson={openDm}
            people={people}
            t={t}
          />

          <main className="relative flex min-w-0 flex-1 overflow-hidden bg-background @4xl:my-2 @4xl:me-2 @4xl:rounded-2xl @4xl:border @4xl:shadow-xs/5">
            {view ? (
              <ViewList
                hits={hits[view]}
                me={me}
                onMenu={() => setDrawer(true)}
                onOpen={openHit}
                people={people}
                t={t}
                time={time}
                view={view}
              />
            ) : channel ? (
              <section
                aria-label={
                  channel.kind === "dm" ? channel.name : `#${channel.name}`
                }
                className="flex min-w-0 flex-1 flex-col"
              >
                <header className="flex h-13 shrink-0 items-center gap-1.5 border-b px-3 @lg:px-4">
                  <Button
                    aria-label={t.openChannels}
                    className="@4xl:hidden"
                    onClick={() => setDrawer(true)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <MenuIcon />
                  </Button>
                  {dmPerson ? (
                    <PersonAvatar person={dmPerson} size="size-6" />
                  ) : channel.private ? (
                    <LockIcon
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  ) : (
                    <HashIcon
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  )}
                  <div className="ms-0.5 flex min-w-0 flex-1 items-baseline gap-2">
                    <h2 className="truncate font-semibold">{channel.name}</h2>
                    {channel.topic ? (
                      <span className="hidden truncate text-muted-foreground text-xs @2xl:block">
                        {channel.topic}
                      </span>
                    ) : null}
                    {dmPerson?.title ? (
                      <span className="hidden truncate text-muted-foreground text-xs @2xl:block">
                        {dmPerson.title}
                      </span>
                    ) : null}
                  </div>
                  {channel.members ? (
                    <Popover>
                      <PopoverTrigger
                        aria-label={plural(
                          channel.members,
                          t.oneMember,
                          t.memberCount
                        )}
                        className={cn(headerBtn, "me-1 hidden @md:flex")}
                      >
                        <UsersIcon aria-hidden className="size-3.5" />
                        <span className="tabular-nums">{channel.members}</span>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-64">
                        <div className="-mx-1 -my-1.5 flex flex-col gap-0.5">
                          <p className="px-1 pb-1.5 font-medium text-muted-foreground text-xs">
                            {plural(
                              channel.members,
                              t.oneMember,
                              t.memberCount
                            )}
                          </p>
                          {(channel.members === 1
                            ? people.filter((p) => p.id === me)
                            : people
                          ).map((p) => (
                            <div
                              className="flex h-9 items-center gap-2.5 px-1"
                              key={p.id}
                            >
                              <PersonAvatar person={p} presence size="size-6" />
                              <span className="min-w-0 flex-1 truncate font-medium">
                                {p.name}
                                {p.id === me ? (
                                  <span className="font-normal text-muted-foreground">
                                    {" "}
                                    {t.youSuffix}
                                  </span>
                                ) : null}
                              </span>
                              <span className="truncate text-muted-foreground text-xs">
                                {p.title}
                              </span>
                            </div>
                          ))}
                          {channel.members > people.length ? (
                            <p className="px-1 pt-1 text-muted-foreground text-xs tabular-nums">
                              {interpolate(t.andMore, {
                                n: channel.members - people.length,
                              })}
                            </p>
                          ) : null}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : null}
                  <Popover onOpenChange={setPinsOpen} open={pinsOpen}>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <PopoverTrigger
                            render={
                              <Button
                                aria-label={t.pinnedMessages}
                                size="icon-sm"
                                variant="ghost"
                              />
                            }
                          />
                        }
                      >
                        <PinIcon />
                      </TooltipTrigger>
                      <TooltipContent>{t.pinnedTip}</TooltipContent>
                    </Tooltip>
                    <PopoverContent align="end" className="w-80">
                      <div className="-mx-1 -my-1.5">
                        <p className="px-1 pb-1.5 font-medium text-muted-foreground text-xs">
                          {interpolate(t.pinnedIn, { where })}
                        </p>
                        {pinned.length === 0 ? (
                          <p className="px-1 py-3 text-pretty text-muted-foreground text-xs">
                            {t.noPins}
                          </p>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            {pinned.map((m) => {
                              const a = people.find((p) => p.id === m.author);
                              return (
                                <button
                                  className="flex w-full cursor-pointer gap-2.5 rounded-lg p-1.5 text-start outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                                  key={m.id}
                                  onClick={() => {
                                    setPinsOpen(false);
                                    setSearch(null);
                                    setFlash(m.id);
                                  }}
                                  type="button"
                                >
                                  <PersonAvatar person={a} size="size-6" />
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-baseline gap-1.5 text-xs">
                                      <span className="font-semibold">
                                        {a?.name}
                                      </span>
                                      <span className="text-muted-foreground tabular-nums">
                                        {dayLabel(m.sentAt)} {time(m.sentAt)}
                                      </span>
                                    </span>
                                    <span className="line-clamp-2 text-pretty text-xs leading-5">
                                      <RichText
                                        me={me}
                                        people={people}
                                        text={m.text}
                                      />
                                    </span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          aria-label={t.searchChannel}
                          aria-pressed={search !== null}
                          onClick={() => {
                            if (search === null) {
                              setSearch("");
                              requestAnimationFrame(() =>
                                searchRef.current?.focus()
                              );
                            } else setSearch(null);
                          }}
                          size="icon-sm"
                          variant="ghost"
                        />
                      }
                    >
                      <SearchIcon />
                    </TooltipTrigger>
                    <TooltipContent>{t.searchTip}</TooltipContent>
                  </Tooltip>
                </header>

                {search !== null ? (
                  <div className="flex h-11 shrink-0 items-center gap-2 border-b px-4">
                    <SearchIcon
                      aria-hidden
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                    <input
                      aria-label={interpolate(t.searchIn, {
                        where: dmPerson ? dmPerson.name : `#${channel.name}`,
                      })}
                      className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.stopPropagation();
                          setSearch(null);
                          composerRef.current?.focus({ preventScroll: true });
                        }
                      }}
                      placeholder={interpolate(t.searchIn, {
                        where: dmPerson
                          ? firstName(dmPerson.name)
                          : `#${channel.name}`,
                      })}
                      ref={searchRef}
                      value={search}
                    />
                    {q ? (
                      <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                        {plural(shown.length, t.oneResult, t.resultCount)}
                      </span>
                    ) : null}
                    <Button
                      aria-label={t.closeSearch}
                      onClick={() => setSearch(null)}
                      size="icon-xs"
                      variant="ghost"
                    >
                      <XIcon />
                    </Button>
                  </div>
                ) : null}

                <div
                  className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    atBottom.current =
                      el.scrollHeight - el.scrollTop - el.clientHeight < 24;
                  }}
                  ref={scrollRef}
                >
                  <div
                    className="flex min-h-full flex-col justify-end px-1 pt-6 pb-2 @lg:px-2"
                    ref={followContent}
                  >
                    {q && shown.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center pb-10 text-center">
                        <span
                          aria-hidden
                          className="flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-xs/5"
                        >
                          <SearchIcon className="size-5" />
                        </span>
                        <p className="mt-3 font-medium">{t.noMatches}</p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {interpolate(t.noMatchHint, {
                            where,
                            query: search?.trim() ?? "",
                          })}
                        </p>
                      </div>
                    ) : q ? null : (
                      <div className="mb-4 px-3">
                        <span
                          aria-hidden
                          className="flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-xs/5"
                        >
                          {dmPerson ? (
                            <PersonAvatar person={dmPerson} size="size-10" />
                          ) : (
                            <HashIcon className="size-5" />
                          )}
                        </span>
                        <h3 className="mt-3 font-heading font-semibold text-base">
                          {dmPerson
                            ? dmPerson.name
                            : interpolate(t.welcome, { name: channel.name })}
                        </h3>
                        <p className="mt-0.5 text-pretty text-muted-foreground text-xs">
                          {dmPerson
                            ? interpolate(t.dmStart, {
                                name: firstName(dmPerson.name),
                              })
                            : (channel.topic ?? t.newChannelHint)}
                        </p>
                      </div>
                    )}
                    {shown.map((m, i) => {
                      const prev = shown[i - 1];
                      const day = dayLabel(m.sentAt);
                      const newDay = !prev || dayLabel(prev.sentAt) !== day;
                      const grouped = Boolean(
                        !q &&
                          prev &&
                          !newDay &&
                          prev.author === m.author &&
                          !prev.replies?.length &&
                          marker !== m.id &&
                          !m.saved
                      );
                      const target = { channelId: channel.id, messageId: m.id };
                      return (
                        <Fragment key={m.id}>
                          {newDay ? (
                            <>
                              <div
                                aria-hidden
                                className="mx-3 mt-4 h-px bg-border"
                              />
                              <div className="pointer-events-none sticky top-2 z-10 -mt-2.75 mb-3 flex justify-center">
                                <h4 className="h-5.5 rounded-full border bg-background px-2.5 font-medium text-muted-foreground text-xs leading-5">
                                  {day}
                                </h4>
                              </div>
                            </>
                          ) : null}
                          {marker === m.id ? (
                            <div className="relative my-2 flex items-center">
                              <span
                                aria-hidden
                                className="absolute inset-x-3 h-px bg-destructive/50"
                              />
                              <span className="relative ms-auto me-3 rounded-full bg-background ps-2 font-semibold text-[11px] text-destructive-foreground">
                                {t.newMarker}
                              </span>
                            </div>
                          ) : null}
                          <MessageRow
                            flash={flash === m.id}
                            grouped={grouped}
                            isNew={!seen.has(m.id)}
                            me={me}
                            message={m}
                            onOpenThread={
                              onReply || m.replies?.length
                                ? () => openThread(m.id)
                                : undefined
                            }
                            onReact={
                              onToggleReaction ? reactTo(target) : undefined
                            }
                            onSave={
                              onToggleSaved
                                ? saveFor(target, m.saved)
                                : undefined
                            }
                            people={people}
                            t={t}
                            threadOpen={threadId === m.id}
                            time={time}
                          />
                        </Fragment>
                      );
                    })}
                  </div>
                </div>

                <div className="shrink-0 px-3 pb-3 @lg:px-4">
                  <TypingIndicator name={typingHere} t={t} />
                  {error ? (
                    <p
                      className="px-1 pb-2 text-destructive text-xs"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}
                  {onSendMessage ? (
                    <Composer
                      file={files[channel.id]}
                      inputRef={composerRef}
                      onChange={(v) =>
                        setDrafts((d) => ({ ...d, [channel.id]: v }))
                      }
                      onFile={(f) =>
                        setFiles((x) => ({ ...x, [channel.id]: f }))
                      }
                      onSend={send}
                      pending={post.isPending()}
                      placeholder={interpolate(t.messageTo, {
                        name: dmPerson
                          ? firstName(dmPerson.name)
                          : `#${channel.name}`,
                      })}
                      t={t}
                      value={drafts[channel.id] ?? ""}
                    />
                  ) : null}
                </div>
              </section>
            ) : null}

            <AnimatePresence>
              {thread && channel ? (
                <motion.aside
                  animate={{ x: 0, opacity: 1 }}
                  aria-label={t.thread}
                  className="absolute inset-0 z-30 flex flex-col border-s bg-background @5xl:static @5xl:z-auto @5xl:w-95 @5xl:shrink-0"
                  exit={{ x: 40, opacity: 0 }}
                  initial={{ x: 40, opacity: 0 }}
                  key="thread"
                  transition={{ duration: 0.22, ease }}
                >
                  <header className="flex h-13 shrink-0 items-center gap-2 border-b px-3">
                    <Button
                      aria-label={t.backToChannel}
                      className="@5xl:hidden"
                      onClick={() => setThreadId(null)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <ArrowLeftIcon className="rtl:-scale-x-100" />
                    </Button>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="font-semibold">{t.thread}</div>
                      <div className="truncate text-muted-foreground text-xs">
                        {dmPerson ? dmPerson.name : `#${channel.name}`}
                      </div>
                    </div>
                    <span
                      aria-hidden
                      className="hidden text-muted-foreground text-xs @5xl:inline"
                    >
                      <Kbd>{t.escape}</Kbd>
                    </span>
                    <Button
                      aria-label={t.closeThread}
                      className="hidden @5xl:inline-flex"
                      onClick={() => setThreadId(null)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <XIcon />
                    </Button>
                  </header>
                  <div
                    className="min-h-0 flex-1 overflow-y-auto px-1 py-3 scrollbar-thin"
                    ref={threadScrollRef}
                  >
                    <MessageRow
                      grouped={false}
                      inThread
                      me={me}
                      message={thread}
                      onReact={
                        onToggleReaction
                          ? reactTo({
                              channelId: channel.id,
                              messageId: thread.id,
                            })
                          : undefined
                      }
                      onSave={
                        onToggleSaved
                          ? saveFor(
                              { channelId: channel.id, messageId: thread.id },
                              thread.saved
                            )
                          : undefined
                      }
                      people={people}
                      t={t}
                      time={time}
                    />
                    <div className="relative my-3 flex items-center px-3">
                      <span className="pe-2 text-muted-foreground text-xs tabular-nums">
                        {plural(threadCount, t.oneReply, t.replies)}
                      </span>
                      <span aria-hidden className="h-px flex-1 bg-border" />
                    </div>
                    {(thread.replies ?? []).map((r, i, all) => {
                      const target = {
                        channelId: channel.id,
                        messageId: thread.id,
                        replyId: r.id,
                      };
                      return (
                        <MessageRow
                          grouped={
                            i > 0 && all[i - 1]?.author === r.author && !r.saved
                          }
                          inThread
                          isNew={!seen.has(r.id)}
                          key={r.id}
                          me={me}
                          message={r}
                          onReact={
                            onToggleReaction ? reactTo(target) : undefined
                          }
                          onSave={
                            onToggleSaved ? saveFor(target, r.saved) : undefined
                          }
                          people={people}
                          t={t}
                          time={time}
                        />
                      );
                    })}
                  </div>
                  {onReply ? (
                    <div className="shrink-0 px-3 pt-1 pb-3">
                      <Composer
                        compact
                        inputRef={threadComposerRef}
                        onChange={(v) =>
                          setDrafts((d) => ({
                            ...d,
                            [`thread:${thread.id}`]: v,
                          }))
                        }
                        onSend={sendReply}
                        pending={reply.isPending()}
                        placeholder={t.replyInThread}
                        t={t}
                        value={drafts[`thread:${thread.id}`] ?? ""}
                      />
                    </div>
                  ) : null}
                </motion.aside>
              ) : null}
            </AnimatePresence>
          </main>
        </div>
      </TooltipProvider>
    </MotionConfig>
  );
}

export function TeamChat(props: TeamChatProps) {
  return (
    <ScreenBoundary name="TeamChat">
      <TeamChatScreen {...props} />
    </ScreenBoundary>
  );
}

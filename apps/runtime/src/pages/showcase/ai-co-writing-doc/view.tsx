// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `co-writing-doc`).
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
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
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";
import type { Action } from "@wirefront/ui/wirefront/types";
import {
  BoldIcon,
  CheckIcon,
  ChevronRightIcon,
  FileTextIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  MessageSquarePlusIcon,
  MessageSquareTextIcon,
  QuoteIcon,
  RedoIcon,
  Share2Icon,
  SparklesIcon,
  StrikethroughIcon,
  UnderlineIcon,
  UndoIcon,
  XIcon,
} from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  Fragment,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type {
  Collaborator,
  CollaboratorTone,
  DocBlock,
  DocComment,
  DocCursor,
  DocSuggestion,
  SharedDoc,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("coWritingDoc.<key>"). */
export const CO_WRITING_DOC_MESSAGES = {
  breadcrumb: "Breadcrumb",
  saved: "Saved · {count} agents editing",
  savedOne: "Saved · 1 agent editing",
  agent: "{name} (agent)",
  agentTip: "{name} · agent",
  share: "Share",
  toolbar: "Formatting",
  undo: "Undo",
  redo: "Redo",
  bold: "Bold",
  italic: "Italic",
  underline: "Underline",
  strikethrough: "Strikethrough",
  link: "Link",
  list: "List",
  quote: "Quote",
  addComment: "Add comment",
  askAgent: "Ask an agent",
  edited: "Edited {when}",
  activity: "{name} · {activity}",
  suggesting: "{name} · suggesting",
  waiting: "{name} · waiting",
  accepted: "Accepted",
  accept: "Accept",
  reject: "Reject",
  suggestion: "suggestion",
  writing: "Writing",
  acceptHint: "accept",
  rejectHint: "reject",
  comments: "Comments",
  commentsOne: "1 comment · {name}",
  commentsMany: "{count} comments · {name}",
  resolve: "Resolve",
  reply: "Reply",
  replyPlaceholder: "Reply…",
  send: "Send",
};

export type DocFormat =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "link"
  | "list"
  | "quote";

export interface CoWritingDocProps {
  doc: SharedDoc;
  people: Collaborator[];
  comments: DocComment[];
  /** The suggestion waiting for review, if any. */
  suggestion?: DocSuggestion;
  /** True while the agent is still writing the suggestion; accept and reject wait for it. */
  suggestionStreaming?: boolean;
  /** Live carets from other collaborators. */
  cursors?: DocCursor[];
  /** The signed-in collaborator's id, used for replies. */
  currentUser: string;
  /** The accepted text shows in place until `doc.blocks` changes, and is removed if this fails. */
  onAcceptSuggestion?: Action<{ id: string }>;
  onRejectSuggestion?: Action<{ id: string }>;
  /** The comment hides at once and comes back if this fails. Hidden without it. */
  onResolveComment?: Action<{ id: string }>;
  /** The reply shows at once and is removed if this fails. Hidden without it. */
  onReplyToComment?: Action<{ commentId: string; text: string }>;
  /** Formatting buttons show only when this is given. */
  onFormat?: (format: DocFormat) => void;
  /** Formats that are on at the selection, shown as pressed. */
  activeFormats?: DocFormat[];
  /** Each toolbar or header button shows only when its handler is given. */
  onUndo?: () => void;
  onRedo?: () => void;
  onAddComment?: () => void;
  onAskAgent?: () => void;
  onShare?: () => void;
  className?: string;
}

const toneCls: Record<
  CollaboratorTone,
  {
    caret: string;
    tag: string;
    soft: string;
    avatar: string;
    mark: string;
    text: string;
    border: string;
  }
> = {
  info: {
    caret: "bg-info",
    tag: "bg-category-1-strong text-white",
    soft: "bg-info/12",
    avatar: "bg-info/16 text-info-foreground",
    mark: "decoration-info/60",
    text: "text-info-foreground",
    border: "border-info/32",
  },
  success: {
    caret: "bg-success",
    tag: "bg-category-2-strong text-white",
    soft: "bg-success/16",
    avatar: "bg-success/16 text-success-foreground",
    mark: "decoration-success/60",
    text: "text-success-foreground",
    border: "border-success/32",
  },
  violet: {
    caret: "bg-category-5",
    tag: "bg-category-5-strong text-white",
    soft: "bg-category-5/14",
    avatar: "bg-category-5/16 text-category-5-foreground",
    mark: "decoration-category-5-foreground/60",
    text: "text-category-5-foreground",
    border: "border-category-5/32",
  },
  warning: {
    caret: "bg-warning",
    tag: "bg-category-3-strong text-white",
    soft: "bg-warning/14",
    avatar:
      "bg-warning/18 text-category-3-foreground dark:text-warning-foreground",
    mark: "decoration-warning/70",
    text: "text-warning-foreground",
    border: "border-warning/32",
  },
};

const FALLBACK: Collaborator = {
  id: "?",
  name: "?",
  initials: "?",
  tone: "info",
};

function Caret({
  person,
  label,
  layoutId,
  idle,
}: {
  person: Collaborator;
  label: string;
  layoutId: string;
  idle?: boolean;
}) {
  const t = toneCls[person.tone];
  const reduce = useReducedMotion();
  // Show the name tag for a moment whenever the label changes, then shrink to a dot.
  const [hiddenFor, setHiddenFor] = useState<string | null>(null);
  const tag = hiddenFor !== label;
  useEffect(() => {
    const id = setTimeout(() => setHiddenFor(label), 1800);
    return () => clearTimeout(id);
  }, [label]);
  return (
    <motion.span
      aria-hidden
      className="group/caret relative inline-block h-[1.15em] w-0 translate-y-[0.18em] align-baseline"
      layoutId={layoutId}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
    >
      <span className="absolute -inset-x-1.5 -top-1.5 bottom-0" />
      <motion.span
        animate={
          idle && !reduce ? { opacity: [1, 1, 0.25, 1] } : { opacity: 1 }
        }
        className={cn(
          "absolute inset-y-0 -inset-s-px w-0.5 rounded-full",
          t.caret
        )}
        transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
      />
      <span
        className={cn(
          "absolute -top-1 -inset-s-px size-1.5 rounded-[calc(var(--radius)*0.2)] transition-opacity duration-200",
          t.caret,
          tag ? "opacity-0" : "opacity-100 group-hover/caret:opacity-0"
        )}
      />
      <span
        className={cn(
          "pointer-events-none absolute bottom-full -inset-s-px mb-0.5 inline-flex origin-bottom-left items-center gap-1 whitespace-nowrap rounded-md rounded-es-none px-1.5 py-px font-medium font-sans text-[10px] leading-4 shadow-xs/5 transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none",
          t.tag,
          tag
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0 group-hover/caret:scale-100 group-hover/caret:opacity-100"
        )}
      >
        {person.agent ? <SparklesIcon className="size-2.5" /> : null}
        {label}
      </span>
    </motion.span>
  );
}

function PersonAvatar({
  person,
  className,
  fallback,
}: {
  person: Collaborator;
  className?: string;
  fallback?: string;
}) {
  return (
    <Avatar className={cn(className, person.agent && "rounded-md")}>
      <AvatarFallback
        className={cn(
          fallback,
          toneCls[person.tone].avatar,
          person.agent && "rounded-md"
        )}
      >
        {person.agent ? <SparklesIcon className="size-3" /> : person.initials}
      </AvatarFallback>
    </Avatar>
  );
}

function CoWritingDocScreen({
  doc,
  people,
  comments: initialComments,
  suggestion: incoming,
  suggestionStreaming = false,
  cursors = [],
  currentUser,
  onAcceptSuggestion,
  onRejectSuggestion,
  onResolveComment,
  onReplyToComment,
  onFormat,
  activeFormats = [],
  onUndo,
  onRedo,
  onAddComment,
  onAskAgent,
  onShare,
  className,
}: CoWritingDocProps) {
  const t = useMessages("coWritingDoc", CO_WRITING_DOC_MESSAGES);
  const fmt = useFormat();
  const { locale } = useWirefront();
  const group = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLInputElement>(null);
  const byId = (pid: string) =>
    people.find((p) => p.id === pid) ?? people[0] ?? FALLBACK;

  // Accepted text shows in its block until the doc's blocks change (the backend applied it).
  const [acceptedState, setAcceptedState] = useState<{
    blocks: DocBlock[];
    text: Record<string, string>;
  }>({ blocks: doc.blocks, text: {} });
  const accepted =
    acceptedState.blocks === doc.blocks ? acceptedState.text : {};
  const setAccepted = (
    update: (text: Record<string, string>) => Record<string, string>
  ) =>
    setAcceptedState((a) => ({
      blocks: doc.blocks,
      text: update(a.blocks === doc.blocks ? a.text : {}),
    }));
  const [settled, setSettled] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 1400);
    return () => clearTimeout(id);
  }, [flash]);
  const suggestion =
    incoming && !settled.includes(incoming.id) ? incoming : undefined;
  const pending = Boolean(suggestion) && !suggestionStreaming;
  const writer = suggestion ? byId(suggestion.author) : undefined;

  const settle = (id: string) => {
    setSettled((s) => [...s, id]);
    return () => setSettled((s) => s.filter((x) => x !== id));
  };
  const accept = useAction(onAcceptSuggestion ?? (async () => {}), {
    optimistic: ({ id }) => {
      const s = incoming;
      const undoSettle = settle(id);
      if (!s) return undoSettle;
      setAccepted((a) => ({ ...a, [s.block]: (a[s.block] ?? "") + s.text }));
      setFlash(s.block);
      return () => {
        undoSettle();
        setFlash(null);
        setAccepted((a) => ({
          ...a,
          [s.block]: (a[s.block] ?? "").slice(0, -s.text.length),
        }));
      };
    },
  });
  const reject = useAction(onRejectSuggestion ?? (async () => {}), {
    optimistic: ({ id }) => settle(id),
  });
  const decide = (yes: boolean) => {
    if (!suggestion || !pending) return;
    (yes ? accept : reject).run({ id: suggestion.id });
  };

  // ⌘↵ accepts and ⌫ rejects a waiting suggestion, unless focus is in a text field.
  const decideRef = useRef(decide);
  decideRef.current = decide;
  const canDecide =
    pending && Boolean(onAcceptSuggestion || onRejectSuggestion);
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !canDecide) return;
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && onAcceptSuggestion) {
        e.preventDefault();
        decideRef.current(true);
      } else if (e.key === "Backspace" && onRejectSuggestion) {
        e.preventDefault();
        decideRef.current(false);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [canDecide, onAcceptSuggestion, onRejectSuggestion]);

  const [comments, setComments] = useState(initialComments);
  useEffect(() => setComments(initialComments), [initialComments]);
  const [resolved, setResolved] = useState<string[]>([]);
  const resolve = useAction(onResolveComment ?? (async () => {}), {
    optimistic: ({ id }) => {
      setResolved((r) => [...r, id]);
      return () => setResolved((r) => r.filter((x) => x !== id));
    },
  });
  const reply = useAction(onReplyToComment ?? (async () => {}), {
    optimistic: ({ commentId, text }) => {
      const before = comments.find((c) => c.id === commentId)?.reply;
      setComments((cs) =>
        cs.map((c) =>
          c.id === commentId
            ? { ...c, reply: { author: currentUser, text } }
            : c
        )
      );
      return () =>
        setComments((cs) =>
          cs.map((c) => (c.id === commentId ? { ...c, reply: before } : c))
        );
    },
  });
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [openInline, setOpenInline] = useState<string | null>(null);
  const [draftFor, setDraftFor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    if (draftFor) replyRef.current?.focus();
  }, [draftFor]);
  const visibleComments = comments.filter((c) => !resolved.includes(c.id));
  const error = accept.error ?? reject.error ?? resolve.error ?? reply.error;

  const renderText = (b: DocBlock) => {
    const base = b.text + (accepted[b.id] ?? "");
    const markFrom = b.mark ? base.indexOf(b.mark.phrase) : -1;
    const mark =
      b.mark && markFrom >= 0
        ? { from: markFrom, to: markFrom + b.mark.phrase.length, by: b.mark.by }
        : undefined;
    const carets = cursors
      .filter((c) => c.block === b.id)
      .map((c) => {
        const found = base.indexOf(c.after);
        return { ...c, at: found >= 0 ? found + c.after.length : -1 };
      })
      .filter((c) => c.at >= 0);
    const cuts = new Set<number>([0, base.length, ...carets.map((c) => c.at)]);
    if (mark) {
      cuts.add(mark.from);
      cuts.add(mark.to);
    }
    const points = [...cuts].sort((a, z) => a - z);
    const parts: ReactNode[] = [];
    const caretsAt = (n: number) =>
      carets
        .filter((c) => c.at === n)
        .map((c) => {
          const who = byId(c.person);
          return (
            <Caret
              idle={c.idle}
              key={`caret-${c.person}`}
              label={
                c.activity
                  ? interpolate(t.activity, {
                      name: who.name,
                      activity: c.activity,
                    })
                  : who.name
              }
              layoutId={`${group}-${c.person}`}
              person={who}
            />
          );
        });
    for (let i = 0; i < points.length - 1; i++) {
      const from = points[i] ?? 0;
      const to = points[i + 1] ?? base.length;
      const seg = base.slice(from, to);
      if (mark && from >= mark.from && to <= mark.to) {
        const who = byId(mark.by);
        const comment = visibleComments.find((c) => c.block === b.id);
        parts.push(
          <span
            className={cn(
              "rounded-[calc(var(--radius)*0.3)] underline decoration-2 underline-offset-4 transition-colors",
              toneCls[who.tone].soft,
              toneCls[who.tone].mark,
              comment &&
                activeComment === comment.id &&
                "ring-2 ring-current/10"
            )}
            key={`m-${from}`}
          >
            {seg}
          </span>
        );
      } else {
        parts.push(<Fragment key={`t-${from}`}>{seg}</Fragment>);
      }
      parts.push(...caretsAt(to));
    }

    if (flash === b.id) {
      parts.push(
        <motion.span
          animate={{ opacity: [0.9, 0] }}
          className="ms-1 inline-flex -translate-y-px items-center gap-1 rounded-full bg-success/12 px-1.5 align-middle font-medium font-sans text-[10px] text-success-foreground"
          key="flash"
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
        >
          <CheckIcon className="size-2.5" />
          {t.accepted}
        </motion.span>
      );
    } else if (suggestion && writer && suggestion.block === b.id) {
      parts.push(
        <span
          className={cn(
            "rounded-[calc(var(--radius)*0.3)] underline decoration-dotted underline-offset-4",
            toneCls[writer.tone].soft,
            toneCls[writer.tone].text,
            toneCls[writer.tone].mark
          )}
          key="sugg"
        >
          {suggestion.text}
        </span>,
        <Caret
          idle={pending}
          key="writer"
          label={interpolate(suggestionStreaming ? t.suggesting : t.waiting, {
            name: writer.name,
          })}
          layoutId={`${group}-${writer.id}`}
          person={writer}
        />
      );
      if (pending && (onAcceptSuggestion || onRejectSuggestion)) {
        parts.push(
          <motion.span
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="ms-2 inline-flex origin-left -translate-y-0.5 items-center gap-0.5 rounded-lg border bg-popover p-0.5 align-middle font-sans text-xs shadow-sm/5"
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            key="actions"
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            {onAcceptSuggestion ? (
              <button
                className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 font-medium text-success-foreground outline-none transition-[background-color,scale] duration-150 ease-out hover:bg-success/10 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                onClick={() => decide(true)}
                type="button"
              >
                <CheckIcon aria-hidden className="size-3.5" />
                {t.accept}
              </button>
            ) : null}
            {onRejectSuggestion ? (
              <button
                className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 text-muted-foreground outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
                onClick={() => decide(false)}
                type="button"
              >
                <XIcon aria-hidden className="size-3.5" />
                {t.reject}
              </button>
            ) : null}
          </motion.span>
        );
      }
    }
    return parts;
  };

  const commentCard = (c: DocComment, compact = false) => {
    const a = byId(c.author);
    const anchor = doc.blocks.find((b) => b.id === c.block);
    const quote = anchor?.mark;
    const r = c.reply ? byId(c.reply.author) : null;
    const replyId = `${group}-${c.id}-reply`;
    return (
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "rounded-xl border bg-card px-3 pt-2.5 pb-3 text-start shadow-xs/5 transition-[border-color,box-shadow]",
          activeComment === c.id && "border-foreground/16 shadow-sm/5",
          compact && "mt-2"
        )}
        exit={{ opacity: 0, x: 12, height: 0, marginTop: 0, padding: 0 }}
        initial={{ opacity: 0, x: 12 }}
        layout
        onMouseEnter={() => setActiveComment(c.id)}
        onMouseLeave={() => setActiveComment(null)}
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
      >
        <div className="flex h-6 items-center gap-2">
          <PersonAvatar
            className="size-5"
            fallback="font-medium text-[9px]"
            person={a}
          />
          <span className="font-medium text-xs">{a.name}</span>
          <time
            className="text-[11px] text-muted-foreground tabular-nums"
            dateTime={c.createdAt}
          >
            {fmt.relative(c.createdAt)}
          </time>
          {onResolveComment ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label={t.resolve}
                    className="-me-1 ms-auto text-muted-foreground"
                    onClick={() => resolve.run({ id: c.id }, c.id)}
                    size="icon-xs"
                    variant="ghost"
                  />
                }
              >
                <CheckIcon />
              </TooltipTrigger>
              <TooltipContent>{t.resolve}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        {quote ? (
          <p className="mt-2 flex items-stretch gap-2 text-muted-foreground text-xs">
            <span
              aria-hidden
              className={cn(
                "w-0.5 shrink-0 rounded-full opacity-64",
                toneCls[byId(quote.by).tone].caret
              )}
            />
            <span className="truncate">{quote.phrase}</span>
          </p>
        ) : null}
        <p className="mt-1.5 text-pretty text-xs leading-relaxed">{c.text}</p>
        {c.reply && r ? (
          <div className="mt-2.5 flex gap-2 border-t pt-2.5">
            <PersonAvatar
              className="size-5 shrink-0"
              fallback="font-medium text-[9px]"
              person={r}
            />
            <p className="text-muted-foreground text-xs leading-relaxed">
              <span className="font-medium text-foreground">{r.name}</span>{" "}
              {c.reply.text}
            </p>
          </div>
        ) : null}
        {onReplyToComment ? (
          draftFor === c.id ? (
            <form
              className="mt-2.5 flex items-center gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                const text = draft.trim();
                if (!text) return;
                reply.run({ commentId: c.id, text }, c.id);
                setDraft("");
                setDraftFor(null);
              }}
            >
              <label className="sr-only" htmlFor={replyId}>
                {t.reply}
              </label>
              <input
                className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-ring dark:bg-input/32"
                id={replyId}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setDraftFor(null);
                }}
                placeholder={t.replyPlaceholder}
                ref={replyRef}
                value={draft}
              />
              <Button size="xs" type="submit">
                {t.send}
              </Button>
            </form>
          ) : (
            <button
              className="mt-2.5 flex h-7 w-full cursor-text items-center rounded-md border border-input bg-background px-2 text-muted-foreground text-xs outline-none hover:border-foreground/16 focus-visible:ring-2 focus-visible:ring-ring dark:bg-input/32"
              onClick={() => setDraftFor(c.id)}
              type="button"
            >
              {t.replyPlaceholder}
            </button>
          )
        ) : null}
      </motion.div>
    );
  };

  const formats: {
    format: DocFormat;
    icon: ReactNode;
    label: string;
    kbd?: string;
    wide?: boolean;
  }[] = [
    { format: "bold", icon: <BoldIcon />, label: t.bold, kbd: "⌘B" },
    { format: "italic", icon: <ItalicIcon />, label: t.italic, kbd: "⌘I" },
    {
      format: "underline",
      icon: <UnderlineIcon />,
      label: t.underline,
      kbd: "⌘U",
      wide: true,
    },
    {
      format: "strikethrough",
      icon: <StrikethroughIcon />,
      label: t.strikethrough,
      wide: true,
    },
    { format: "link", icon: <LinkIcon />, label: t.link, wide: true },
    { format: "list", icon: <ListIcon />, label: t.list, wide: true },
    { format: "quote", icon: <QuoteIcon />, label: t.quote, wide: true },
  ];
  const agents = people.filter((p) => p.agent).length;
  const authors = new Intl.ListFormat(locale, { type: "conjunction" }).format(
    doc.authors.map((id) => byId(id).name)
  );
  const hasToolbar = Boolean(
    onUndo || onRedo || onFormat || onAddComment || onAskAgent
  );

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={400}>
        <div
          className={cn(
            "@container relative flex h-svh w-full flex-col overflow-hidden bg-background text-foreground text-sm",
            className
          )}
          ref={rootRef}
        >
          <header className="flex h-12 shrink-0 items-center gap-3 border-b px-3 @3xl:px-4">
            <nav
              aria-label={t.breadcrumb}
              className="flex min-w-0 flex-1 items-center gap-1 text-muted-foreground"
            >
              <span className="hidden items-center gap-1 @md:flex">
                {doc.path.map((folder) => (
                  <Fragment key={folder}>
                    <span className="px-1">{folder}</span>
                    <ChevronRightIcon
                      aria-hidden
                      className="size-3.5 opacity-56 rtl:rotate-180"
                    />
                  </Fragment>
                ))}
              </span>
              <FileTextIcon aria-hidden className="ms-1 size-4 shrink-0" />
              <span
                aria-current="page"
                className="truncate px-1 font-medium text-foreground"
              >
                {doc.title}
              </span>
            </nav>
            <div className="hidden items-center gap-1.5 text-muted-foreground text-xs @2xl:flex">
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
              {agents === 1
                ? t.savedOne
                : interpolate(t.saved, { count: agents })}
            </div>
            <div className="flex -space-x-1">
              {people.map((p, i) => (
                <Tooltip key={p.id}>
                  <TooltipTrigger
                    render={
                      <span
                        aria-label={
                          p.agent
                            ? interpolate(t.agent, { name: p.name })
                            : p.name
                        }
                        className={cn(
                          "relative rounded-full ring-2 ring-background",
                          i >= 3 && "hidden @md:inline-flex"
                        )}
                        role="img"
                      />
                    }
                  >
                    <Avatar
                      className={cn(
                        "size-7 bg-background",
                        p.agent && "rounded-lg"
                      )}
                    >
                      <AvatarFallback
                        className={cn(
                          "text-[10px]",
                          toneCls[p.tone].avatar,
                          p.agent && "rounded-lg"
                        )}
                      >
                        {p.agent ? (
                          <SparklesIcon className="size-3.5" />
                        ) : (
                          p.initials
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 inset-s-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full rtl:translate-x-1/2",
                        toneCls[p.tone].caret
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    {p.agent
                      ? interpolate(t.agentTip, { name: p.name })
                      : p.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            {onShare ? (
              <Button
                className="hidden @md:inline-flex"
                onClick={onShare}
                size="sm"
              >
                <Share2Icon />
                {t.share}
              </Button>
            ) : null}
          </header>

          {hasToolbar ? (
            <div
              aria-label={t.toolbar}
              className="flex h-11 shrink-0 items-center gap-0.5 overflow-x-auto border-b px-2 scrollbar-none @3xl:px-3"
              role="toolbar"
            >
              {onUndo ? (
                <Button
                  aria-label={t.undo}
                  onClick={onUndo}
                  size="icon-sm"
                  variant="ghost"
                >
                  <UndoIcon />
                </Button>
              ) : null}
              {onRedo ? (
                <Button
                  aria-label={t.redo}
                  onClick={onRedo}
                  size="icon-sm"
                  variant="ghost"
                >
                  <RedoIcon />
                </Button>
              ) : null}
              {onFormat ? (
                <>
                  <span
                    aria-hidden
                    className="mx-1.5 h-5 w-px shrink-0 bg-border"
                  />
                  {formats.map((f) => {
                    const on = activeFormats.includes(f.format);
                    return (
                      <Tooltip key={f.format}>
                        <TooltipTrigger
                          render={
                            <Button
                              aria-label={f.label}
                              aria-pressed={on}
                              className={cn(
                                f.wide && "hidden @md:inline-flex",
                                on && "bg-accent text-foreground"
                              )}
                              onClick={() => onFormat(f.format)}
                              size="icon-sm"
                              variant="ghost"
                            />
                          }
                        >
                          {f.icon}
                        </TooltipTrigger>
                        <TooltipContent>
                          {f.label}
                          {f.kbd ? <Kbd className="ms-1.5">{f.kbd}</Kbd> : null}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </>
              ) : null}
              {onAddComment ? (
                <Button
                  aria-label={t.addComment}
                  onClick={onAddComment}
                  size="icon-sm"
                  variant="ghost"
                >
                  <MessageSquarePlusIcon />
                </Button>
              ) : null}
              {onAskAgent ? (
                <div className="ms-auto flex shrink-0 items-center gap-1.5 ps-2">
                  <Button
                    aria-label={t.askAgent}
                    onClick={onAskAgent}
                    size="sm"
                    variant="outline"
                  >
                    <SparklesIcon />
                    <span className="hidden @md:inline">{t.askAgent}</span>
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p
              className="shrink-0 border-b bg-destructive/8 px-4 py-2 text-destructive text-xs"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <ScrollRegion aria-label={doc.title} className="min-h-0 flex-1">
            <LayoutGroup id={group}>
              <article className="mx-auto grid max-w-5xl grid-cols-1 gap-x-8 px-5 pt-10 pb-24 @4xl:grid-cols-[minmax(0,1fr)_16rem] @4xl:px-10">
                {doc.blocks.map((b, i) => {
                  const anchored = visibleComments.filter(
                    (c) => c.block === b.id
                  );
                  const prevIsLi = doc.blocks[i - 1]?.type === "li";
                  const first = anchored[0];
                  return (
                    <Fragment key={b.id}>
                      <div
                        className={cn(
                          "relative min-w-0",
                          b.type === "h1" && "mb-2",
                          b.type === "h2" && "mt-7 mb-2",
                          b.type === "p" && "mb-4",
                          b.type === "li" &&
                            cn("mb-1.5 ps-5", !prevIsLi && "mt-1")
                        )}
                      >
                        {b.type === "h1" ? (
                          <h1 className="font-heading font-semibold text-2xl tracking-tight @3xl:text-3xl">
                            {renderText(b)}
                          </h1>
                        ) : b.type === "h2" ? (
                          <h2 className="font-heading font-semibold text-lg tracking-tight">
                            {renderText(b)}
                          </h2>
                        ) : (
                          <p className="text-[15px] text-foreground/88 leading-7">
                            {b.type === "li" ? (
                              <span
                                aria-hidden
                                className="absolute inset-s-1.5 top-[0.8em] size-1.5 rounded-full bg-muted-foreground/60"
                              />
                            ) : null}
                            {renderText(b)}
                          </p>
                        )}
                        {b.type === "h1" ? (
                          <div className="mt-3 mb-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-muted-foreground text-xs">
                            <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground/80">
                              {doc.status}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span aria-hidden className="flex -space-x-1">
                                {doc.authors.map((id) => {
                                  const p = byId(id);
                                  return (
                                    <Avatar
                                      className={cn(
                                        "size-4 ring-2 ring-background",
                                        p.agent &&
                                          "rounded-[calc(var(--radius)*0.5)]"
                                      )}
                                      key={id}
                                    >
                                      <AvatarFallback
                                        className={cn(
                                          "font-medium text-[7px]",
                                          toneCls[p.tone].avatar,
                                          p.agent &&
                                            "rounded-[calc(var(--radius)*0.5)]"
                                        )}
                                      >
                                        {p.agent ? (
                                          <SparklesIcon className="size-2.5" />
                                        ) : (
                                          p.initials
                                        )}
                                      </AvatarFallback>
                                    </Avatar>
                                  );
                                })}
                              </span>
                              {authors}
                            </span>
                            <span aria-hidden className="hidden @md:inline">
                              ·
                            </span>
                            <span>
                              {interpolate(t.edited, {
                                when: fmt.relative(doc.editedAt),
                              })}
                            </span>
                          </div>
                        ) : null}

                        {first ? (
                          <div className="@4xl:hidden">
                            <button
                              aria-expanded={openInline === b.id}
                              className="mt-1 inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-full border bg-card px-2 text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={() =>
                                setOpenInline(openInline === b.id ? null : b.id)
                              }
                              type="button"
                            >
                              <MessageSquareTextIcon
                                aria-hidden
                                className="size-3"
                              />
                              {interpolate(
                                anchored.length === 1
                                  ? t.commentsOne
                                  : t.commentsMany,
                                {
                                  count: anchored.length,
                                  name: byId(first.author).name,
                                }
                              )}
                            </button>
                            <AnimatePresence initial={false}>
                              {openInline === b.id ? (
                                <motion.div
                                  animate={{ height: "auto", opacity: 1 }}
                                  className="overflow-hidden"
                                  exit={{ height: 0, opacity: 0 }}
                                  initial={{ height: 0, opacity: 0 }}
                                >
                                  {anchored.map((c) => (
                                    <Fragment key={c.id}>
                                      {commentCard(c, true)}
                                    </Fragment>
                                  ))}
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        ) : null}
                      </div>

                      <aside
                        aria-label={anchored.length ? t.comments : undefined}
                        className="relative hidden @4xl:block"
                      >
                        <AnimatePresence>
                          {anchored.map((c) => (
                            <div
                              className="absolute inset-x-0 top-0 z-10"
                              key={c.id}
                            >
                              {commentCard(c)}
                            </div>
                          ))}
                          {suggestion && writer && suggestion.block === b.id ? (
                            <motion.div
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "absolute inset-x-0 top-0 z-10 rounded-xl border bg-card p-3 shadow-xs/5",
                                toneCls[writer.tone].border
                              )}
                              exit={{ opacity: 0, x: 12 }}
                              initial={{ opacity: 0, x: 12 }}
                              key={`s-${suggestion.id}`}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="size-5 rounded-md">
                                  <AvatarFallback
                                    className={cn(
                                      "rounded-md",
                                      toneCls[writer.tone].avatar
                                    )}
                                  >
                                    <SparklesIcon className="size-3" />
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-xs">
                                  {writer.name}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full px-1.5 text-[10px]",
                                    toneCls[writer.tone].avatar
                                  )}
                                >
                                  {t.suggestion}
                                </span>
                              </div>
                              <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
                                {suggestionStreaming ? (
                                  <span className="inline-flex items-center gap-1.5">
                                    {t.writing}
                                    <span
                                      aria-hidden
                                      className="inline-flex gap-0.5"
                                    >
                                      {[0, 0.15, 0.3].map((delay) => (
                                        <motion.span
                                          animate={{ opacity: [0.25, 1, 0.25] }}
                                          className="size-1 rounded-full bg-current"
                                          key={delay}
                                          transition={{
                                            duration: 1,
                                            repeat: Number.POSITIVE_INFINITY,
                                            delay,
                                          }}
                                        />
                                      ))}
                                    </span>
                                  </span>
                                ) : (
                                  suggestion.note
                                )}
                              </p>
                              {pending &&
                              onAcceptSuggestion &&
                              onRejectSuggestion ? (
                                <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                  <Kbd>⌘↵</Kbd> {t.acceptHint}
                                  <Kbd className="ms-1">⌫</Kbd> {t.rejectHint}
                                </div>
                              ) : null}
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </aside>
                    </Fragment>
                  );
                })}
              </article>
            </LayoutGroup>
          </ScrollRegion>
        </div>
      </TooltipProvider>
    </MotionConfig>
  );
}

export function CoWritingDoc(props: CoWritingDocProps) {
  return (
    <ScreenBoundary name="CoWritingDoc">
      <CoWritingDocScreen {...props} />
    </ScreenBoundary>
  );
}

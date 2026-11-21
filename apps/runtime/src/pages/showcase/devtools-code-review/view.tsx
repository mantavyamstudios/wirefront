// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `code-review`).
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, CircleCheckIcon, FileCode2Icon, FileDiffIcon, FilePlus2Icon, FolderIcon, GitBranchIcon, GitPullRequestIcon, MessageSquareIcon, PanelLeftIcon, PlusIcon, XIcon } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Fragment, type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import type { DiffFile, PullRequest, ReviewPerson, ReviewThread, ReviewTone, ReviewVerdict } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("codeReview.<key>"). */
export const CODE_REVIEW_MESSAGES = {
  open: "Open",
  wantsToMerge: "wants to merge {count} commits into",
  checks: "{passed}/{total} checks",
  you: "You",
  review: "Review",
  approved: "Approved",
  changesRequested: "Changes requested",
  reviewed: "Reviewed",
  hideTree: "Hide file tree",
  showTree: "Show file tree",
  filesChanged: "Files changed",
  viewedCount: "{viewed} of {total} viewed",
  openThreads: "{count} open",
  diffLayout: "Diff layout",
  split: "Split",
  unified: "Unified",
  changedFiles: "Changed files",
  viewed: "Viewed",
  keysFiles: "files",
  keysViewed: "viewed",
  keysThread: "next thread",
  keysReview: "review",
  expand: "Expand {path}",
  collapse: "Collapse {path}",
  newFile: "New",
  commentOnLine: "Comment on line {line}",
  allFiles: "That’s every file. Press R to finish your review.",
  resolved: "Resolved",
  reopen: "Reopen",
  reply: "Reply",
  replyPlaceholder: "Reply…",
  cancel: "Cancel",
  resolve: "Resolve",
  newComment: "New comment",
  newCommentPlaceholder: "Leave a comment on this line…",
  toPost: "to post",
  comment: "Comment",
  finish: "Finish your review",
  close: "Close",
  summary: "Review summary",
  summaryPlaceholder: "Leave a summary (optional)",
  verdict: "Verdict",
  verdictComment: "Comment",
  verdictCommentNote: "General feedback, no verdict.",
  verdictApprove: "Approve",
  verdictApproveNote: "Good to merge as it is.",
  verdictChanges: "Request changes",
  verdictChangesNote: "Needs another pass before merging.",
  threadsOne: "1 open thread",
  threadsMany: "{count} open threads",
  submit: "Submit review",
  toastApproved: "Approved. {name} can merge when ready.",
  toastChanges: "Changes requested",
  toastComment: "Review submitted",
};
type Messages = typeof CODE_REVIEW_MESSAGES;

export interface CodeReviewProps {
  pr: PullRequest;
  people: ReviewPerson[];
  files: DiffFile[];
  threads: ReviewThread[];
  /** The signed-in reviewer's person id. */
  me: string;
  /** Paths already marked viewed. */
  viewed?: string[];
  onViewedChange?: (path: string, viewed: boolean) => void;
  /** Each comment action shows at once and is undone if it fails. Commenting is hidden without them. */
  onComment?: Action<{ file: string; line: number; side: "new" | "old"; body: string }>;
  onReply?: Action<{ threadId: string; body: string }>;
  onResolve?: Action<{ threadId: string; resolved: boolean }>;
  /** Submits the review. The button is hidden without it. */
  onSubmitReview?: Action<{ verdict: ReviewVerdict; summary: string }>;
  className?: string;
}

const avatarTone: Record<ReviewTone, string> = {
  blue: "bg-category-1/14 text-category-1-foreground",
  orange: "bg-category-7/14 text-category-7-foreground",
  teal: "bg-category-6/16 text-category-6-foreground",
  violet: "bg-category-5/16 text-category-5-foreground",
  rose: "bg-category-4/14 text-category-4-foreground",
  amber: "bg-category-3/18 text-category-3-foreground",
  emerald: "bg-category-2/16 text-category-2-foreground",
  sky: "bg-category-1/16 text-category-1-foreground",
};
const ease = [0.23, 1, 0.32, 1] as const;

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

function PersonAvatar({ person, size = "size-6" }: { person?: ReviewPerson; size?: string }) {
  if (!person) return null;
  return (
    <Avatar aria-hidden className={size}>
      <AvatarFallback className={cn("font-medium text-[10px]", avatarTone[person.tone])}>{initials(person.name)}</AvatarFallback>
    </Avatar>
  );
}

interface Line {
  kind: "ctx" | "add" | "del";
  text: string;
  old?: number;
  new?: number;
}

function parseHunk(h: DiffFile["hunks"][number]): Line[] {
  let o = h.oldStart;
  let n = h.newStart;
  return h.lines.split("\n").map((raw) => {
    const sign = raw[0];
    const text = raw.slice(1);
    if (sign === "+") return { kind: "add", text, new: n++ };
    if (sign === "-") return { kind: "del", text, old: o++ };
    return { kind: "ctx", text, old: o++, new: n++ };
  });
}

type SplitRow = { key: string; left?: Line; right?: Line };
const lineKey = (l?: Line) => (l ? `${l.kind}${l.old ?? ""}:${l.new ?? ""}` : "-");

function toSplit(lines: Line[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l?.kind === "ctx") {
      rows.push({ key: lineKey(l), left: l, right: l });
      i++;
      continue;
    }
    const dels: Line[] = [];
    const adds: Line[] = [];
    while (lines[i]?.kind === "del") dels.push(lines[i++] as Line);
    while (lines[i]?.kind === "add") adds.push(lines[i++] as Line);
    for (let k = 0; k < Math.max(dels.length, adds.length); k++) rows.push({ key: `${lineKey(dels[k])}|${lineKey(adds[k])}`, left: dels[k], right: adds[k] });
  }
  return rows;
}

function pairs(lines: Line[]) {
  const map = new Map<Line, Line>();
  for (const row of toSplit(lines)) {
    if (row.left?.kind === "del" && row.right?.kind === "add") {
      map.set(row.left, row.right);
      map.set(row.right, row.left);
    }
  }
  return map;
}

function changedRange(a: string, b: string) {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let end = 0;
  while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++;
  return { start, endA: a.length - end, endB: b.length - end };
}

const KEYWORDS = /^(import|from|export|const|let|var|return|if|else|await|async|function|type|interface|new|throw|try|catch|for|of|in|true|false|null|undefined)$/;
const TOKENS = /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d[\d_]*\b)|([A-Za-z_$][\w$]*)/g;

/** Light syntax colouring for code, and headings for markdown. */
function highlight(text: string, md: boolean): ReactNode[] {
  if (md) {
    if (text.startsWith("#")) return [<span className="font-semibold text-category-1-foreground" key="h">{text}</span>];
    return [text];
  }
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKENS)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    const [tok] = m;
    const after = at + tok.length;
    const tone = m[1] ? "text-muted-foreground italic" : m[2] ? "text-category-2-foreground" : m[3] ? "text-category-3-foreground" : KEYWORDS.test(tok) ? "text-category-5-foreground" : /^[A-Z]/.test(tok) || text[after] === "(" ? "text-category-1-foreground" : null;
    out.push(
      tone ? (
        <span className={tone} key={at}>
          {tok}
        </span>
      ) : (
        tok
      ),
    );
    last = after;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function CodeText({ line, partner, md }: { line: Line; partner?: Line; md: boolean }) {
  if (!partner || line.kind === "ctx") return <>{highlight(line.text, md)}</>;
  const r = line.kind === "del" ? changedRange(line.text, partner.text) : changedRange(partner.text, line.text);
  const end = line.kind === "del" ? r.endA : r.endB;
  if (end <= r.start) return <>{highlight(line.text, md)}</>;
  return (
    <>
      {highlight(line.text.slice(0, r.start), md)}
      <span className={cn("rounded-[calc(var(--radius)*0.3)]", line.kind === "del" ? "bg-destructive/22" : "bg-success/24")}>{highlight(line.text.slice(r.start, end), md)}</span>
      {highlight(line.text.slice(end), md)}
    </>
  );
}

/** Comment text with `code` spans. */
function CommentBody({ body }: { body: string }) {
  let at = 0;
  return (
    <>
      {body.split(/(`[^`]+`)/g).filter(Boolean).map((part) => {
        const key = at;
        at += part.length;
        return part.startsWith("`") && part.length > 1 ? (
          <code className="rounded-[calc(var(--radius)*0.5)] border bg-muted px-1 py-px font-mono text-[12px]" key={key}>
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={key}>{part}</Fragment>
        );
      })}
    </>
  );
}

function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}

function ThreadView({ thread, people, me, onReply, onResolve, t }: { thread: ReviewThread; people: ReviewPerson[]; me: string; onReply?: (body: string) => void; onResolve?: (resolved: boolean) => void; t: Messages }) {
  const fmt = useFormat();
  const [draft, setDraft] = useState("");
  const [replying, setReplying] = useState(false);
  const person = (id: string) => people.find((p) => p.id === id);
  const send = () => {
    if (!draft.trim() || !onReply) return;
    onReply(draft.trim());
    setDraft("");
    setReplying(false);
  };
  const first = thread.comments[0];
  const last = thread.comments.at(-1);
  if (thread.resolved && first) {
    return (
      <div className="mx-3 my-2 flex items-center gap-2 rounded-xl border border-dashed px-3 py-2 font-sans text-muted-foreground text-xs">
        <CircleCheckIcon aria-hidden className="size-3.5 text-success" />
        <span className="min-w-0 flex-1 truncate">
          {t.resolved} · <span className="text-foreground">{person(first.author)?.name.split(" ")[0]}</span>: {first.body}
        </span>
        {last ? <span className="hidden @lg:inline">{fmt.relative(last.createdAt)}</span> : null}
        {onResolve ? (
          <button className="cursor-pointer rounded font-medium text-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onResolve(false)} type="button">
            {t.reopen}
          </button>
        ) : null}
      </div>
    );
  }
  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="mx-3 my-2 max-w-2xl overflow-hidden rounded-xl border bg-card font-sans text-sm shadow-xs/5" initial={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease }}>
      <ul className="flex flex-col">
        {thread.comments.map((c, i) => (
          <li className={cn("flex gap-2.5 px-3 py-3", i > 0 && "border-t")} key={c.id}>
            <PersonAvatar person={person(c.author)} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 text-xs">
                <span className="font-medium text-foreground">{c.author === me ? t.you : person(c.author)?.name}</span>
                <time className="text-muted-foreground" dateTime={c.createdAt}>
                  {fmt.relative(c.createdAt)}
                </time>
              </div>
              <p className="mt-1 text-pretty text-[13px] text-foreground/90 leading-5 wrap-anywhere">
                <CommentBody body={c.body} />
              </p>
            </div>
          </li>
        ))}
      </ul>
      {onReply || onResolve ? (
        <div className="border-t px-2 py-2">
          {replying ? (
            <ReplyBox draft={draft} onCancel={() => setReplying(false)} onChange={setDraft} onSend={send} t={t} />
          ) : (
            <div className="flex items-center gap-2">
              {onReply ? (
                <button className="h-7 flex-1 cursor-text rounded-md border bg-background px-2.5 text-start text-[13px] text-muted-foreground outline-none transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring dark:bg-input/32" onClick={() => setReplying(true)} type="button">
                  {t.replyPlaceholder}
                </button>
              ) : null}
              {onResolve ? (
                <Button className={cn(!onReply && "ms-auto")} onClick={() => onResolve(true)} size="xs" variant="outline">
                  <CheckIcon />
                  {t.resolve}
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}

function ReplyBox({ draft, onChange, onSend, onCancel, t }: { draft: string; onChange: (v: string) => void; onSend: () => void; onCancel: () => void; t: Messages }) {
  const ref = useFocusOnMount<HTMLTextAreaElement>();
  return (
    <div className="flex flex-col gap-2">
      <textarea
        aria-label={t.reply}
        className="min-h-16 w-full resize-none rounded-lg border bg-background px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/16 dark:bg-input/32"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSend();
          if (e.key === "Escape") {
            e.stopPropagation();
            onCancel();
          }
        }}
        placeholder={t.replyPlaceholder}
        ref={ref}
        value={draft}
      />
      <div className="flex justify-end gap-1.5">
        <Button onClick={onCancel} size="xs" variant="ghost">
          {t.cancel}
        </Button>
        <Button disabled={!draft.trim()} onClick={onSend} size="xs">
          {t.reply}
        </Button>
      </div>
    </div>
  );
}

function NewComment({ onCancel, onSubmit, t }: { onCancel: () => void; onSubmit: (body: string) => void; t: Messages }) {
  const [draft, setDraft] = useState("");
  const ref = useFocusOnMount<HTMLTextAreaElement>();
  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="mx-3 my-2 flex max-w-2xl flex-col gap-2 rounded-xl border bg-card p-2 font-sans shadow-xs/5" initial={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease }}>
      <textarea
        aria-label={t.newComment}
        className="min-h-20 w-full resize-none rounded-lg border bg-background px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/16 dark:bg-input/32"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) onSubmit(draft.trim());
          if (e.key === "Escape") {
            e.stopPropagation();
            onCancel();
          }
        }}
        placeholder={t.newCommentPlaceholder}
        ref={ref}
        value={draft}
      />
      <div className="flex items-center justify-end gap-1.5">
        <span className="me-auto ps-1 text-muted-foreground text-xs">
          <Kbd className="h-4 text-[10px]">⌘↵</Kbd> {t.toPost}
        </span>
        <Button onClick={onCancel} size="xs" variant="ghost">
          {t.cancel}
        </Button>
        <Button disabled={!draft.trim()} onClick={() => onSubmit(draft.trim())} size="xs">
          {t.comment}
        </Button>
      </div>
    </motion.div>
  );
}

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  file?: DiffFile;
}

function buildTree(files: DiffFile[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", children: [] };
  for (const f of files) {
    const parts = f.path.split("/");
    let node = root;
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join("/");
      let child = node.children.find((c) => c.name === part);
      if (!child) {
        child = { name: part, path, children: [], file: i === parts.length - 1 ? f : undefined };
        node.children.push(child);
      }
      node = child;
    });
  }
  const squash = (n: TreeNode): TreeNode => {
    const only = n.children[0];
    if (!n.file && n.children.length === 1 && only && !only.file) return squash({ ...only, name: `${n.name}/${only.name}` });
    return { ...n, children: n.children.map(squash) };
  };
  return root.children.map(squash);
}

const statusIcon = { added: FilePlus2Icon, modified: FileDiffIcon, deleted: FileCode2Icon };

function ReviewPanel({ openThreads, pending, onClose, onSubmit, t }: { openThreads: number; pending: boolean; onClose: () => void; onSubmit: (verdict: ReviewVerdict, summary: string) => void; t: Messages }) {
  const [verdict, setVerdict] = useState<ReviewVerdict>("approve");
  const [summary, setSummary] = useState("");
  const ref = useFocusOnMount<HTMLTextAreaElement>();
  const name = useId();
  const options: { id: ReviewVerdict; label: string; note: string }[] = [
    { id: "comment", label: t.verdictComment, note: t.verdictCommentNote },
    { id: "approve", label: t.verdictApprove, note: t.verdictApproveNote },
    { id: "changes", label: t.verdictChanges, note: t.verdictChangesNote },
  ];
  return (
    <motion.div animate={{ opacity: 1, scale: 1, y: 0 }} aria-label={t.finish} className="absolute inset-e-3 inset-s-3 top-16 z-40 origin-top-right rounded-2xl border bg-popover p-3 shadow-lg/10 @xl:inset-s-auto @xl:w-95" exit={{ opacity: 0, scale: 0.97, y: -4 }} initial={{ opacity: 0, scale: 0.97, y: -4 }} role="dialog" transition={{ duration: 0.16, ease }}>
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t.finish}</h2>
        <Button aria-label={t.close} onClick={onClose} size="icon-xs" variant="ghost">
          <XIcon />
        </Button>
      </div>
      <textarea
        aria-label={t.summary}
        className="mt-2 min-h-20 w-full resize-none rounded-lg border bg-background px-2.5 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus-visible:border-ring/60 focus-visible:ring-3 focus-visible:ring-ring/16 dark:bg-input/32"
        onChange={(e) => setSummary(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit(verdict, summary.trim());
        }}
        placeholder={t.summaryPlaceholder}
        ref={ref}
        value={summary}
      />
      <fieldset className="m-0 mt-2 flex min-w-0 flex-col gap-1 border-0 p-0">
        <legend className="sr-only">{t.verdict}</legend>
        {options.map((o) => (
          <label className={cn("flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2 text-start transition-colors has-focus-visible:ring-2 has-focus-visible:ring-ring", verdict === o.id ? "border-foreground/20 bg-accent" : "border-transparent hover:bg-accent/50")} key={o.id}>
            <input checked={verdict === o.id} className="sr-only" name={name} onChange={() => setVerdict(o.id)} type="radio" value={o.id} />
            <span aria-hidden className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border", verdict === o.id ? "border-primary" : "border-muted-foreground/50")}>
              {verdict === o.id ? <motion.span className="size-2 rounded-full bg-primary" layoutId="verdict-dot" transition={{ type: "spring", stiffness: 600, damping: 40 }} /> : null}
            </span>
            <span className="min-w-0">
              <span className="block font-medium">{o.label}</span>
              <span className="block text-muted-foreground text-xs">{o.note}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-muted-foreground text-xs">{openThreads === 1 ? t.threadsOne : interpolate(t.threadsMany, { count: openThreads })}</span>
        <Button className="ms-auto transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.97]" disabled={pending} onClick={() => onSubmit(verdict, summary.trim())} size="sm" variant={verdict === "changes" ? "destructive" : "default"}>
          {t.submit}
        </Button>
      </div>
    </motion.div>
  );
}

function CodeReviewScreen({ pr, people, files, threads: initialThreads, me, viewed: initialViewed = [], onViewedChange, onComment, onReply, onResolve, onSubmitReview, className }: CodeReviewProps) {
  const t = useMessages("codeReview", CODE_REVIEW_MESSAGES);
  const { now } = useWirefront();
  const uid = useId();
  const seq = useRef(0);
  const [threads, setThreads] = useState(initialThreads);
  useEffect(() => setThreads(initialThreads), [initialThreads]);
  const [viewed, setViewed] = useState<Set<string>>(() => new Set(initialViewed));
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(initialViewed));
  const [split, setSplit] = useState(true);
  const [narrow, setNarrow] = useState(false);
  // Until the first measurement, CSS decides whether the tree shows (it's hidden below 900px),
  // so phones never paint a sidebar-crushed diff.
  const [measured, setMeasured] = useState(false);
  const [treeOpen, setTreeOpen] = useState(true);
  const [activeFile, setActiveFile] = useState(files[0]?.path ?? "");
  const [composer, setComposer] = useState<{ file: string; line: number; side: "new" | "old" } | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitted, setSubmitted] = useState<ReviewVerdict | null>(null);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRefs = useRef(new Map<string, HTMLElement>());
  const person = (id: string) => people.find((p) => p.id === id);
  const nextId = (prefix: string) => `${uid}-${prefix}${++seq.current}`;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let first = true;
    const ro = new ResizeObserver(([e]) => {
      const isNarrow = (e?.contentRect.width ?? 0) < 900;
      setNarrow(isNarrow);
      setMeasured(true);
      if (first && isNarrow) setTreeOpen(false);
      first = false;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const updateThread = (id: string, fn: (th: ReviewThread) => ReviewThread) => setThreads((all) => all.map((x) => (x.id === id ? fn(x) : x)));
  const comment = useAction(onComment ?? (async () => {}), {
    optimistic: ({ file, line, side, body }) => {
      const id = nextId("t");
      setThreads((ts) => [...ts, { id, file, line, side, comments: [{ id: nextId("c"), author: me, body, createdAt: now().toISOString() }] }]);
      setComposer(null);
      return () => setThreads((ts) => ts.filter((x) => x.id !== id));
    },
  });
  const reply = useAction(onReply ?? (async () => {}), {
    optimistic: ({ threadId, body }) => {
      const id = nextId("c");
      updateThread(threadId, (x) => ({ ...x, comments: [...x.comments, { id, author: me, body, createdAt: now().toISOString() }] }));
      return () => updateThread(threadId, (x) => ({ ...x, comments: x.comments.filter((c) => c.id !== id) }));
    },
  });
  const resolve = useAction(onResolve ?? (async () => {}), {
    optimistic: ({ threadId, resolved }) => {
      updateThread(threadId, (x) => ({ ...x, resolved }));
      return () => updateThread(threadId, (x) => ({ ...x, resolved: !resolved }));
    },
  });
  const submit = useAction(onSubmitReview ?? (async () => {}), {
    onSuccess: (_, { verdict }) => {
      setSubmitted(verdict);
      setReviewOpen(false);
      setToast({ key: ++seq.current, text: verdict === "approve" ? interpolate(t.toastApproved, { name: person(pr.author)?.name.split(" ")[0] ?? "" }) : verdict === "changes" ? t.toastChanges : t.toastComment });
    },
  });
  const error = comment.error ?? reply.error ?? resolve.error ?? submit.error;

  const parsed = useMemo(
    () =>
      files.map((f) => {
        const hunks = f.hunks.map((h) => ({ header: h.header, lines: parseHunk(h) }));
        const all = hunks.flatMap((h) => h.lines);
        return { file: f, hunks, adds: all.filter((l) => l.kind === "add").length, dels: all.filter((l) => l.kind === "del").length, pairs: pairs(all) };
      }),
    [files],
  );
  const totals = parsed.reduce((a, p) => ({ adds: a.adds + p.adds, dels: a.dels + p.dels }), { adds: 0, dels: 0 });
  const tree = useMemo(() => buildTree(files), [files]);
  const showSplit = split && !narrow;
  const openThreads = threads.filter((x) => !x.resolved).length;

  const scrollToFile = (path: string) => {
    const el = fileRefs.current.get(path);
    const box = scrollRef.current;
    if (el && box) box.scrollTop = el.offsetTop - 8;
    setActiveFile(path);
    if (narrow) setTreeOpen(false);
  };
  const onScroll = () => {
    const box = scrollRef.current;
    if (!box) return;
    let current = files[0]?.path ?? "";
    for (const f of files) {
      const el = fileRefs.current.get(f.path);
      if (el && el.offsetTop - 24 <= box.scrollTop) current = f.path;
    }
    if (current !== activeFile) setActiveFile(current);
  };
  const toggleIn = (set: Set<string>, path: string, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(path);
    else next.delete(path);
    return next;
  };
  const toggleViewed = (path: string) => {
    const nowViewed = !viewed.has(path);
    setViewed((v) => toggleIn(v, path, nowViewed));
    setCollapsed((c) => toggleIn(c, path, nowViewed));
    onViewedChange?.(path, nowViewed);
  };
  const toggleCollapsed = (path: string) => setCollapsed((c) => toggleIn(c, path, !c.has(path)));

  // Keyboard: J/K files, V viewed, S layout, N next thread, R review, Esc closes the top layer.
  const keysRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keysRef.current = (e) => {
    const target = e.target as HTMLElement;
    if (e.key === "Escape") {
      if (reviewOpen) setReviewOpen(false);
      else if (composer) setComposer(null);
      return;
    }
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) return;
    const idx = files.findIndex((f) => f.path === activeFile);
    const k = e.key.toLowerCase();
    if (k === "j" || k === "]") {
      e.preventDefault();
      const next = files[Math.min(files.length - 1, idx + 1)];
      if (next) scrollToFile(next.path);
    } else if (k === "k" || k === "[") {
      e.preventDefault();
      const prev = files[Math.max(0, idx - 1)];
      if (prev) scrollToFile(prev.path);
    } else if (k === "v" && activeFile) {
      e.preventDefault();
      toggleViewed(activeFile);
    } else if (k === "s") {
      setSplit((s) => !s);
    } else if (k === "n") {
      const next = threads.find((th) => !th.resolved && files.findIndex((f) => f.path === th.file) > idx) ?? threads.find((th) => !th.resolved);
      if (next) scrollToFile(next.file);
    } else if (k === "r" && onSubmitReview) {
      e.preventDefault();
      setReviewOpen(true);
    }
  };
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => keysRef.current(e);
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  const renderTree = (nodes: TreeNode[], depth = 0): ReactNode =>
    nodes.map((n) => {
      if (n.file) {
        const p = parsed.find((x) => x.file.path === n.path);
        const Icon = statusIcon[n.file.status];
        const count = threads.filter((x) => x.file === n.path && !x.resolved).length;
        const on = activeFile === n.path;
        return (
          <li key={n.path}>
            <button aria-current={on ? "true" : undefined} className={cn("flex h-7 w-full cursor-pointer items-center gap-2 rounded-md pe-2 text-start text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", on ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")} onClick={() => scrollToFile(n.path)} style={{ paddingInlineStart: 8 + depth * 14 }} type="button">
              <Icon aria-hidden className={cn("size-3.5 shrink-0", n.file.status === "added" ? "text-success" : "text-warning")} />
              <span className={cn("min-w-0 flex-1 truncate", viewed.has(n.path) && "text-muted-foreground")}>{n.name}</span>
              {count > 0 ? (
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground tabular-nums">
                  <MessageSquareIcon aria-hidden className="size-3" />
                  {count}
                </span>
              ) : null}
              {viewed.has(n.path) ? (
                <>
                  <CheckIcon aria-hidden className="size-3.5 text-success" />
                  <span className="sr-only">{t.viewed}</span>
                </>
              ) : (
                <span className="font-mono text-[10px] tabular-nums">
                  <span className="text-success-foreground">+{p?.adds}</span>
                  {p && p.dels > 0 ? <span className="ms-1 text-destructive-foreground">−{p.dels}</span> : null}
                </span>
              )}
            </button>
          </li>
        );
      }
      return (
        <li key={n.path}>
          <div className="flex h-7 items-center gap-1.5 text-muted-foreground text-xs" style={{ paddingInlineStart: 8 + depth * 14 }}>
            <FolderIcon aria-hidden className="size-3.5" />
            <span className="truncate font-mono">{n.name}</span>
          </div>
          <ul className="flex flex-col gap-0.5">{renderTree(n.children, depth + 1)}</ul>
        </li>
      );
    });

  const lineNo = "w-10 shrink-0 select-none px-1.5 text-end text-muted-foreground tabular-nums";
  const gutterButton = (file: string, line: number, side: "new" | "old") =>
    onComment ? (
      <button aria-label={interpolate(t.commentOnLine, { line })} className="group/gutter absolute inset-y-0 inset-s-0 z-10 w-10 cursor-pointer outline-none" onClick={() => setComposer({ file, line, side })} type="button">
        <span className="absolute inset-s-1 top-0.5 flex size-4 items-center justify-center rounded bg-info text-white opacity-0 transition-[opacity,scale] duration-100 ease-out group-hover/line:opacity-100 group-focus-visible/gutter:opacity-100 group-focus-visible/gutter:ring-2 group-focus-visible/gutter:ring-ring group-active/gutter:scale-90">
          <PlusIcon aria-hidden className="size-3" strokeWidth={3} />
        </span>
      </button>
    ) : null;

  const threadsAt = (file: string, line: Line, which: "left" | "right" | "both") =>
    threads.filter((x) => x.file === file && ((x.side === "new" && line.new === x.line && which !== "left") || (x.side === "old" && line.old === x.line && line.kind === "del" && which !== "right")));

  const extras = (file: string, line: Line, which: "left" | "right" | "both", inSplit = false) => {
    const ts = threadsAt(file, line, which);
    const showComposer = composer && composer.file === file && ((composer.side === "new" && line.new === composer.line && which !== "left") || (composer.side === "old" && line.old === composer.line && line.kind === "del" && which !== "right"));
    if (!ts.length && !showComposer) return null;
    return (
      <div className={cn("border-y bg-muted/30 py-1", inSplit && "@4xl:grid @4xl:grid-cols-2")}>
        <div className={cn("min-w-0", inSplit && which !== "left" && "@4xl:col-start-2")}>
          {ts.map((x) => (
            <ThreadView key={x.id} me={me} onReply={onReply ? (body) => reply.run({ threadId: x.id, body }, x.id) : undefined} onResolve={onResolve ? (resolved) => resolve.run({ threadId: x.id, resolved }, x.id) : undefined} people={people} t={t} thread={x} />
          ))}
          {showComposer && composer ? <NewComment onCancel={() => setComposer(null)} onSubmit={(body) => comment.run({ ...composer, body })} t={t} /> : null}
        </div>
      </div>
    );
  };

  const rowTone = (kind?: Line["kind"]) => (kind === "add" ? "bg-success/8 dark:bg-success/10" : kind === "del" ? "bg-destructive/8 dark:bg-destructive/10" : "");
  const numTone = (kind?: Line["kind"]) => (kind === "add" ? "bg-success/14 text-success-foreground/80 shadow-[inset_2px_0_0_var(--color-success)] dark:bg-success/16" : kind === "del" ? "bg-destructive/14 text-destructive-foreground/80 shadow-[inset_2px_0_0_var(--color-destructive)] dark:bg-destructive/16" : "");
  const reviewLabel = submitted === "approve" ? t.approved : submitted === "changes" ? t.changesRequested : submitted === "comment" ? t.reviewed : t.review;
  const author = person(pr.author);

  const treeBody = (
    <>
      <div className="w-64 min-w-64 flex-1 overflow-y-auto p-2 scrollbar-thin">
        <ul className="flex flex-col gap-0.5">{renderTree(tree)}</ul>
      </div>
      <div aria-hidden className="flex w-64 flex-col gap-1.5 border-t px-3 py-2.5 text-muted-foreground text-xs">
        <div className="flex items-center gap-1.5">
          <Kbd>J</Kbd>
          <Kbd>K</Kbd> {t.keysFiles}
          <Kbd className="ms-2">V</Kbd> {t.keysViewed}
        </div>
        <div className="flex items-center gap-1.5">
          <Kbd>N</Kbd> {t.keysThread}
          {onSubmitReview ? (
            <>
              <Kbd className="ms-2">R</Kbd> {t.keysReview}
            </>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("@container relative isolate flex h-svh w-full flex-col overflow-hidden bg-background text-foreground text-sm outline-none", className)} ref={rootRef}>
        <header className="shrink-0 border-b px-4 pt-4 pb-3 @3xl:px-5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-balance font-heading font-semibold text-lg leading-snug tracking-tight">
                {pr.title} <span className="font-normal text-muted-foreground">#{pr.number}</span>
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-muted-foreground text-xs">
                <Badge className="gap-1 bg-success/8 text-success-foreground dark:bg-success/16" variant="secondary">
                  <GitPullRequestIcon />
                  {t.open}
                </Badge>
                <span className="flex items-center gap-1.5">
                  <PersonAvatar person={author} size="size-4" />
                  <span className="font-medium text-foreground">{author?.name}</span>
                </span>
                <span className="hidden @lg:inline">{interpolate(t.wantsToMerge, { count: pr.commits })}</span>
                <span className="flex min-w-0 items-center gap-1 font-mono">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-foreground">{pr.base}</span>
                  <span aria-hidden className="rtl:-scale-x-100">
                    ←
                  </span>
                  <span className="flex min-w-0 items-center gap-1 truncate rounded-md bg-muted px-1.5 py-0.5 text-foreground">
                    <GitBranchIcon aria-hidden className="size-3 shrink-0" />
                    <span className="truncate">{pr.head}</span>
                  </span>
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden items-center gap-1.5 rounded-lg border px-2 py-1 text-xs @2xl:flex">
                <CircleCheckIcon aria-hidden className={cn("size-3.5", pr.checks.passed === pr.checks.total ? "text-success" : "text-warning")} />
                <span className="tabular-nums">{interpolate(t.checks, { passed: pr.checks.passed, total: pr.checks.total })}</span>
              </div>
              <div className="hidden -space-x-1 @xl:flex">
                {pr.reviewers.map((id) => (
                  <span className="rounded-full ring-2 ring-background" key={id} title={person(id)?.name}>
                    <PersonAvatar person={person(id)} />
                  </span>
                ))}
              </div>
              {onSubmitReview ? (
                <Button aria-expanded={reviewOpen} className={cn("transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.97]", submitted === "approve" && "border-success bg-success text-white hover:bg-success/90")} onClick={() => setReviewOpen((o) => !o)} size="sm" variant={submitted === "changes" ? "destructive" : "default"}>
                  {submitted === "approve" ? <CheckIcon /> : null}
                  {reviewLabel}
                  <ChevronDownIcon className={cn("transition-transform duration-200", reviewOpen && "rotate-180")} />
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <div className="flex h-11 shrink-0 items-center gap-2 border-b px-3 @3xl:px-4">
          <Button aria-label={treeOpen ? t.hideTree : t.showTree} aria-pressed={treeOpen} onClick={() => setTreeOpen((o) => !o)} size="icon-sm" variant="ghost">
            <PanelLeftIcon className="rtl:-scale-x-100" />
          </Button>
          <h2 className="font-medium">{t.filesChanged}</h2>
          <span className="text-muted-foreground text-xs tabular-nums">{files.length}</span>
          <span className="font-mono text-xs tabular-nums">
            <span className="text-success-foreground">+{totals.adds}</span> <span className="text-destructive-foreground">−{totals.dels}</span>
          </span>
          <div className="ms-auto flex items-center gap-3">
            <span className="hidden items-center gap-2 text-muted-foreground text-xs @xl:flex">
              <span className="tabular-nums">{interpolate(t.viewedCount, { viewed: viewed.size, total: files.length })}</span>
              <span aria-hidden className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                <motion.span animate={{ scaleX: files.length ? viewed.size / files.length : 0 }} className="block h-full origin-left rounded-full bg-success rtl:origin-right" initial={false} transition={{ type: "spring", stiffness: 300, damping: 34 }} />
              </span>
            </span>
            {openThreads > 0 ? (
              <span className="hidden items-center gap-1 text-muted-foreground text-xs @md:flex">
                <MessageSquareIcon aria-hidden className="size-3.5" />
                <span className="tabular-nums">{interpolate(t.openThreads, { count: openThreads })}</span>
              </span>
            ) : null}
            {narrow ? null : (
              <fieldset className="m-0 flex min-w-0 rounded-lg border-0 bg-muted p-0.5">
                <legend className="sr-only">{t.diffLayout}</legend>
                {[
                  { id: true, label: t.split },
                  { id: false, label: t.unified },
                ].map((o) => (
                  <button aria-pressed={split === o.id} className={cn("relative h-6 cursor-pointer rounded-md px-2 font-medium text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring", split === o.id ? "text-foreground" : "text-muted-foreground hover:text-foreground")} key={o.label} onClick={() => setSplit(o.id)} type="button">
                    {split === o.id ? <motion.span className="absolute inset-0 rounded-md bg-background shadow-xs/5 dark:bg-accent" layoutId="diff-layout" transition={{ type: "spring", stiffness: 520, damping: 42 }} /> : null}
                    <span className="relative">{o.label}</span>
                  </button>
                ))}
              </fieldset>
            )}
          </div>
        </div>

        {error ? (
          <p className="shrink-0 border-b bg-destructive/8 px-4 py-2 text-destructive text-xs" role="alert">
            {error}
          </p>
        ) : null}

        <div className="relative flex min-h-0 flex-1">
          {narrow ? (
            <Sheet onOpenChange={setTreeOpen} open={treeOpen}>
              <SheetContent className="w-68 max-w-[85%] gap-0 bg-sidebar p-0" showCloseButton={false} side="left">
                <SheetTitle className="sr-only">{t.changedFiles}</SheetTitle>
                {treeBody}
              </SheetContent>
            </Sheet>
          ) : (
            <AnimatePresence initial={false}>
              {treeOpen ? (
                <motion.aside animate={{ width: 256, opacity: 1 }} aria-label={t.changedFiles} className={cn("flex shrink-0 flex-col overflow-hidden border-e bg-sidebar", !measured && "hidden @[900px]:flex")} exit={{ width: 0, opacity: 0 }} initial={{ width: 0, opacity: 0 }} transition={{ duration: 0.22, ease }}>
                  {treeBody}
                </motion.aside>
              ) : null}
            </AnimatePresence>
          )}

          <div className="min-w-0 flex-1 overflow-y-auto bg-muted/30 scrollbar-thin" onScroll={onScroll} ref={scrollRef}>
            <div className="flex flex-col gap-3 p-3 @3xl:p-4">
              {parsed.map(({ file, hunks, adds, dels, pairs: pairMap }) => {
                const isViewed = viewed.has(file.path);
                const isCollapsed = collapsed.has(file.path);
                const md = file.path.endsWith(".md");
                return (
                  <section
                    aria-label={file.path}
                    className="overflow-clip rounded-xl border bg-card shadow-xs/5"
                    key={file.path}
                    ref={(el) => {
                      if (el) fileRefs.current.set(file.path, el);
                      else fileRefs.current.delete(file.path);
                    }}
                  >
                    <div className={cn("sticky top-0 z-10 flex h-10 items-center gap-2 bg-card ps-1.5 pe-2", !isCollapsed && "border-b")}>
                      <button aria-expanded={!isCollapsed} aria-label={interpolate(isCollapsed ? t.expand : t.collapse, { path: file.path })} className="flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring" onClick={() => toggleCollapsed(file.path)} type="button">
                        <ChevronRightIcon aria-hidden className={cn("size-4 transition-transform duration-200 ease-out rtl:-scale-x-100", !isCollapsed && "rotate-90 rtl:-rotate-90")} />
                      </button>
                      <span className="min-w-0 flex-1 truncate font-mono text-xs">
                        <span className="text-muted-foreground">{file.path.split("/").slice(0, -1).join("/")}/</span>
                        <span className="font-medium text-foreground">{file.path.split("/").pop()}</span>
                      </span>
                      {file.status === "added" ? (
                        <Badge className="hidden bg-success/8 text-success-foreground @md:inline-flex dark:bg-success/16" variant="secondary">
                          {t.newFile}
                        </Badge>
                      ) : null}
                      <span className="hidden font-mono text-xs tabular-nums @md:inline">
                        <span className="text-success-foreground">+{adds}</span>
                        {dels > 0 ? <span className="ms-1 text-destructive-foreground">−{dels}</span> : null}
                      </span>
                      <label className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md border px-2 text-muted-foreground text-xs transition-colors focus-within:ring-2 focus-within:ring-ring hover:text-foreground has-checked:border-success/40 has-checked:bg-success/8 has-checked:text-success-foreground">
                        <input checked={isViewed} className="sr-only" onChange={() => toggleViewed(file.path)} type="checkbox" />
                        <span aria-hidden className={cn("flex size-3.5 items-center justify-center rounded-[calc(var(--radius)*0.4)] border transition-colors", isViewed ? "border-success bg-success text-white" : "border-muted-foreground/50")}>
                          {isViewed ? <CheckIcon className="size-2.5" strokeWidth={3} /> : null}
                        </span>
                        {t.viewed}
                      </label>
                    </div>
                    <AnimatePresence initial={false}>
                      {isCollapsed ? null : (
                        <motion.div animate={{ height: "auto", opacity: 1 }} className="overflow-hidden" exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease }}>
                          <div className="font-mono text-[12px] leading-6">
                            {hunks.map((h, hi) => (
                              <Fragment key={h.header}>
                                <div className="flex items-center gap-2 bg-info/6 px-3 py-1 text-info-foreground dark:bg-info/10">
                                  {hi > 0 ? <span className="text-[11px]">⋯</span> : null}
                                  <span className="truncate">{h.header}</span>
                                </div>
                                {showSplit
                                  ? toSplit(h.lines).map((row) => {
                                      const leftExtras = row.left?.kind === "del" ? extras(file.path, row.left, "left", true) : null;
                                      const rightExtras = row.right ? extras(file.path, row.right, row.right.kind === "ctx" ? "both" : "right", true) : null;
                                      return (
                                        <Fragment key={row.key}>
                                          <div className="grid grid-cols-2">
                                            <div className={cn("group/line relative flex border-e", rowTone(row.left?.kind), !row.left && "bg-muted/40")}>
                                              {row.left ? (
                                                <>
                                                  <span className={cn(lineNo, numTone(row.left.kind))}>{row.left.old}</span>
                                                  <span className="w-4 shrink-0 select-none text-center text-muted-foreground">{row.left.kind === "del" ? "−" : ""}</span>
                                                  <span className="min-w-0 flex-1 whitespace-pre-wrap pe-3 wrap-anywhere">
                                                    <CodeText line={row.left} md={md} partner={pairMap.get(row.left)} />
                                                  </span>
                                                  {row.left.kind === "del" && row.left.old ? gutterButton(file.path, row.left.old, "old") : null}
                                                </>
                                              ) : null}
                                            </div>
                                            <div className={cn("group/line relative flex", rowTone(row.right?.kind === "ctx" ? undefined : row.right?.kind), !row.right && "bg-muted/40")}>
                                              {row.right ? (
                                                <>
                                                  <span className={cn(lineNo, numTone(row.right.kind === "ctx" ? undefined : row.right.kind))}>{row.right.new}</span>
                                                  <span className="w-4 shrink-0 select-none text-center text-muted-foreground">{row.right.kind === "add" ? "+" : ""}</span>
                                                  <span className="min-w-0 flex-1 whitespace-pre-wrap pe-3 wrap-anywhere">
                                                    <CodeText line={row.right} md={md} partner={pairMap.get(row.right)} />
                                                  </span>
                                                  {row.right.new ? gutterButton(file.path, row.right.new, "new") : null}
                                                </>
                                              ) : null}
                                            </div>
                                          </div>
                                          {leftExtras}
                                          {rightExtras}
                                        </Fragment>
                                      );
                                    })
                                  : h.lines.map((l) => (
                                      <Fragment key={lineKey(l)}>
                                        <div className={cn("group/line relative flex", rowTone(l.kind))}>
                                          <span className={cn(lineNo, "hidden @md:block", numTone(l.kind))}>{l.old ?? ""}</span>
                                          <span className={cn(lineNo, "hidden @md:block", numTone(l.kind))}>{l.new ?? ""}</span>
                                          <span className={cn(lineNo, "@md:hidden", numTone(l.kind))}>{l.new ?? l.old}</span>
                                          <span className="w-4 shrink-0 select-none text-center text-muted-foreground">{l.kind === "add" ? "+" : l.kind === "del" ? "−" : ""}</span>
                                          <span className="min-w-0 flex-1 whitespace-pre-wrap pe-3 wrap-anywhere">
                                            <CodeText line={l} md={md} partner={pairMap.get(l)} />
                                          </span>
                                          {(l.new ?? l.old) !== undefined ? gutterButton(file.path, (l.new ?? l.old) as number, l.new ? "new" : "old") : null}
                                        </div>
                                        {extras(file.path, l, "both")}
                                      </Fragment>
                                    ))}
                              </Fragment>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>
                );
              })}
              {onSubmitReview ? <p className="py-4 text-center text-muted-foreground text-xs">{t.allFiles}</p> : null}
            </div>
          </div>
        </div>

        <AnimatePresence>{reviewOpen ? <ReviewPanel onClose={() => setReviewOpen(false)} onSubmit={(verdict, summary) => submit.run({ verdict, summary })} openThreads={openThreads} pending={submit.isPending()} t={t} /> : null}</AnimatePresence>

        <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <AnimatePresence mode="popLayout">
            {toast ? (
              <motion.div animate={{ opacity: 1, y: 0, scale: 1 }} className="flex h-9 items-center gap-2 rounded-full border bg-popover px-4 text-sm shadow-lg/10" exit={{ opacity: 0, y: 6, scale: 0.98 }} initial={{ opacity: 0, y: 8, scale: 0.98 }} key={toast.key} transition={{ duration: 0.2, ease }}>
                {submitted === "approve" ? <CircleCheckIcon aria-hidden className="size-4 text-success" /> : null}
                {toast.text}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </MotionConfig>
  );
}

export function CodeReview(props: CodeReviewProps) {
  return (
    <ScreenBoundary name="CodeReview">
      <CodeReviewScreen {...props} />
    </ScreenBoundary>
  );
}

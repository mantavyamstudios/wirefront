// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `issue-tracker`).
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { Dialog, DialogContent, DialogTitle } from "@wirefront/ui/dialog";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import { type Action, fail } from "@wirefront/ui/wirefront/types";
import { ArchiveIcon, ArrowLeftIcon, CalendarIcon, CheckIcon, ChevronDownIcon, CircleDotIcon, CopyIcon, CornerDownLeftIcon, LayersIcon, ListFilterIcon, type LucideIcon, MenuIcon, PlusIcon, SearchIcon, TagIcon, Trash2Icon, UserRoundIcon, XIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Issue, IssueLabel, IssuePatch, IssuePerson, IssuePriority, IssueStatus, IssueTone } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("issueTracker.<key>"). */
export const ISSUE_TRACKER_MESSAGES = {
  status_in_progress: "In Progress",
  status_in_review: "In Review",
  status_todo: "Todo",
  status_backlog: "Backlog",
  status_done: "Done",
  priority_1: "Urgent",
  priority_2: "High",
  priority_3: "Medium",
  priority_4: "Low",
  priority_0: "No priority",
  view_mine: "My issues",
  view_active: "Active",
  view_activeTitle: "Active issues",
  view_backlog: "Backlog",
  view_all: "All issues",
  team: "{name} team",
  navigation: "Navigation",
  views: "Views",
  openNav: "Open navigation",
  closeNav: "Close navigation",
  command: "Command",
  cycle: "{name} · ends {date}",
  cycleDone: "{done} of {total} done",
  daysLeft: "{count} days left",
  keysMove: "move",
  keysFields: "set fields",
  keysSelect: "select",
  keysEverything: "everything else",
  filter: "Filter issues",
  filterPlaceholder: "Filter by title or ID",
  clearFilter: "Clear filter",
  closeFilter: "Close filter",
  newIssue: "New issue",
  newIssueIn: "New issue in {status}",
  selected: "{count} selected",
  statusField: "Status",
  priorityField: "Priority",
  assign: "Assign",
  clearSelection: "Clear selection",
  issues: "Issues",
  noMatch: "No issues match",
  nothing: "Nothing here",
  noMatchHint: "Nothing in {view} mentions “{query}”.",
  nothingHint: "Press C to create an issue.",
  selectIssue: "Select {id}",
  deselectIssue: "Deselect {id}",
  untitled: "Untitled issue",
  unassigned: "Unassigned",
  details: "{id} details",
  back: "Back to issues",
  moreActions: "More actions",
  closeDetails: "Close details",
  title: "Issue title",
  assignee: "Assignee",
  labels: "Labels",
  addLabel: "Add label",
  estimate: "Estimate",
  points: "{count} points",
  point: "1 point",
  due: "Due {date}",
  noDescription: "No description yet. Add context, links and acceptance criteria here.",
  subIssues: "Sub-issues",
  activity: "Activity",
  you: "You",
  comment: "Leave a comment",
  commentPlaceholder: "Leave a comment…",
  send: "Comment",
  commandMenu: "Command menu",
  rootPlaceholder: "Type a command or search…",
  statusPlaceholder: "Change status…",
  priorityPlaceholder: "Set priority…",
  assigneePlaceholder: "Assign to…",
  labelPlaceholder: "Add or remove labels…",
  noCommands: "No commands match “{query}”",
  navigate: "navigate",
  choose: "select",
  goBack: "back",
  escape: "Esc",
  groupIssue: "Issue",
  groupWorkspace: "Workspace",
  groupViews: "Views",
  changeStatus: "Change status…",
  setPriority: "Set priority…",
  assignTo: "Assign to…",
  addLabelCmd: "Add label…",
  assignMe: "Assign to me",
  copyOne: "Copy {id}",
  copyIds: "Copy IDs",
  deleteOne: "Delete issue",
  deleteMany: "Delete {count} issues",
  createIssue: "Create new issue",
  goTo: "Go to {view}",
  showDone: "Show completed issues",
  hideDone: "Hide completed issues",
  personYou: "{name} (you)",
  noAssignee: "No assignee",
  manyIssues: "{count} issues",
  toastDone: "{target} marked done",
  toastCopied: "Copied {target}",
  toastCopyFailed: "Couldn’t copy {target}",
  toastDeleted: "Deleted {target}",
  logCreated: "created the issue",
  logStatus: "moved to {status}",
  logPriority: "set priority to {priority}",
  logAssign: "assigned {name}",
  logUnassign: "removed the assignee",
};
type Messages = typeof ISSUE_TRACKER_MESSAGES;

export interface IssueTrackerProps {
  team: { name: string; key: string; workspace: string };
  /** The current cycle, shown under the views. */
  cycle?: { name: string; endsAt: string };
  /** The signed-in person's id. */
  me: string;
  people: IssuePerson[];
  labels: IssueLabel[];
  issues: Issue[];
  /** Applies one change to several issues; it shows at once and is undone if this fails. */
  onUpdate?: Action<{ ids: string[]; patch: IssuePatch }>;
  /** Creates an issue and returns it; it opens once created. Hidden without it. */
  onCreate?: Action<{ status: IssueStatus }, Issue>;
  onDelete?: Action<{ ids: string[] }>;
  onComment?: Action<{ id: string; body: string }>;
  className?: string;
}

const STATUS_ORDER: IssueStatus[] = ["in_progress", "in_review", "todo", "backlog", "done"];
const PRIORITY_ORDER: IssuePriority[] = [1, 2, 3, 4, 0];
type IssueView = "mine" | "active" | "backlog" | "all";
const VIEW_ORDER: IssueView[] = ["mine", "active", "backlog", "all"];
const viewIcon: Record<IssueView, LucideIcon> = { mine: CircleDotIcon, active: LayersIcon, backlog: ArchiveIcon, all: ListFilterIcon };

const avatarTone: Record<IssueTone, string> = {
  blue: "bg-category-1/14 text-category-1-foreground",
  orange: "bg-category-7/14 text-category-7-foreground",
  teal: "bg-category-6/16 text-category-6-foreground",
  violet: "bg-category-5/16 text-category-5-foreground",
  rose: "bg-category-4/14 text-category-4-foreground",
  amber: "bg-category-3/18 text-category-3-foreground",
  emerald: "bg-category-2/16 text-category-2-foreground",
  sky: "bg-category-1/16 text-category-1-foreground",
};
const dotTone: Record<IssueTone, string> = { blue: "bg-category-1", orange: "bg-category-7", teal: "bg-category-6", violet: "bg-category-5", rose: "bg-category-4", amber: "bg-category-3", emerald: "bg-category-2", sky: "bg-category-1" };
const groupTone: Record<IssueStatus, string> = {
  backlog: "from-muted/80 to-muted/80 dark:from-muted/60 dark:to-muted/60",
  todo: "from-muted/80 to-muted/80 dark:from-muted/60 dark:to-muted/60",
  in_progress: "from-category-3/6 to-category-3/6",
  in_review: "from-category-2/6 to-category-2/6",
  done: "from-category-1/6 to-category-1/6",
};
const ease = [0.23, 1, 0.32, 1] as const;
const glide = { type: "spring", stiffness: 500, damping: 44 } as const;

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
const inView = (view: IssueView, i: Issue, me: string) => (view === "mine" ? i.assignee === me : view === "active" ? i.status !== "backlog" : view === "backlog" ? i.status === "backlog" : true);

function StatusIcon({ status, className }: { status: IssueStatus; className?: string }) {
  const c = cn("size-3.5 shrink-0", className);
  if (status === "backlog")
    return (
      <svg aria-hidden="true" className={cn(c, "text-muted-foreground")} viewBox="0 0 14 14">
        <circle cx="7" cy="7" fill="none" r="5.5" stroke="currentColor" strokeDasharray="2.2 1.8" strokeWidth="1.5" />
      </svg>
    );
  if (status === "todo")
    return (
      <svg aria-hidden="true" className={cn(c, "text-muted-foreground")} viewBox="0 0 14 14">
        <circle cx="7" cy="7" fill="none" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  if (status === "in_progress")
    return (
      <svg aria-hidden="true" className={cn(c, "text-category-3-foreground")} viewBox="0 0 14 14">
        <circle cx="7" cy="7" fill="none" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 3.5 A3.5 3.5 0 0 1 7 10.5 Z" fill="currentColor" />
      </svg>
    );
  if (status === "in_review")
    return (
      <svg aria-hidden="true" className={cn(c, "text-category-2-foreground")} viewBox="0 0 14 14">
        <circle cx="7" cy="7" fill="none" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 3.5 A3.5 3.5 0 1 1 3.5 7 L7 7 Z" fill="currentColor" />
      </svg>
    );
  return (
    <svg aria-hidden="true" className={cn(c, "text-category-1-foreground")} viewBox="0 0 14 14">
      <circle cx="7" cy="7" fill="currentColor" r="6.25" />
      <path d="M4.4 7.2 6.2 9 9.7 5.3" fill="none" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function PriorityIcon({ priority, className }: { priority: IssuePriority; className?: string }) {
  if (priority === 1)
    return (
      <span aria-hidden className={cn("flex size-3.5 shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.3)] bg-category-7 font-bold text-[10px] text-white leading-none", className)}>
        !
      </span>
    );
  if (priority === 0)
    return (
      <svg aria-hidden="true" className={cn("size-3.5 shrink-0 text-muted-foreground", className)} viewBox="0 0 14 14">
        {[2.5, 6, 9.5].map((x) => (
          <rect fill="currentColor" height="1.5" key={x} opacity="0.7" rx="0.75" width="2" x={x} y="6.25" />
        ))}
      </svg>
    );
  const filled = 5 - priority;
  return (
    <svg aria-hidden="true" className={cn("size-3.5 shrink-0 text-foreground/80", className)} viewBox="0 0 14 14">
      {[0, 1, 2].map((bar) => (
        <rect fill="currentColor" height={4 + bar * 3} key={bar} opacity={bar < filled ? 1 : 0.22} rx="1" width="3" x={1.5 + bar * 4} y={11.5 - (4 + bar * 3)} />
      ))}
    </svg>
  );
}

function PersonAvatar({ person, size = "size-5" }: { person?: IssuePerson; size?: string }) {
  if (!person)
    return (
      <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full border border-muted-foreground/50 border-dashed text-muted-foreground", size)}>
        <UserRoundIcon className="size-2.5" />
      </span>
    );
  return (
    <Avatar aria-hidden className={size}>
      <AvatarFallback className={cn("font-medium text-[9px]", avatarTone[person.tone])}>{initials(person.name)}</AvatarFallback>
    </Avatar>
  );
}

type PaletteMode = "root" | "status" | "priority" | "assignee" | "label";
interface Command {
  id: string;
  label: string;
  group: string;
  icon: ReactNode;
  hint?: string;
  checked?: boolean;
  keepOpen?: boolean;
  run: () => void;
}

function Palette({ open, mode, commands, target, onClose, onBack, t }: { open: boolean; mode: PaletteMode; commands: Command[]; target: string; onClose: () => void; onBack: () => void; t: Messages }) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [shownMode, setShownMode] = useState(mode);
  if (shownMode !== mode) {
    setShownMode(mode);
    setQuery("");
    setActive(0);
  }
  const listRef = useRef<HTMLDivElement>(null);
  const q = query.trim().toLowerCase();
  const filtered = commands.filter((c) => !q || c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q));
  const groups = Array.from(new Set(filtered.map((c) => c.group)));
  const optionId = (c: Command) => `${uid}-${c.id}`;
  const current = filtered[active];
  useEffect(() => {
    const box = listRef.current;
    const el = current ? box?.querySelector<HTMLElement>(`[id="${optionId(current)}"]`) : null;
    if (!el || !box) return;
    if (el.offsetTop < box.scrollTop) box.scrollTop = el.offsetTop - 4;
    else if (el.offsetTop + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = el.offsetTop + el.offsetHeight - box.clientHeight + 4;
  });
  const placeholder: Record<PaletteMode, string> = { root: t.rootPlaceholder, status: t.statusPlaceholder, priority: t.priorityPlaceholder, assignee: t.assigneePlaceholder, label: t.labelPlaceholder };
  const choose = (c: Command) => {
    c.run();
    if (!c.keepOpen) onClose();
  };

  return (
    <Dialog onOpenChange={(next) => !next && onClose()} open={open}>
      <DialogContent className="top-16 flex max-h-105 translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton={false}>
        <DialogTitle className="sr-only">{t.commandMenu}</DialogTitle>
        <div className="flex items-center gap-2 px-3 pt-3">
          <span className="max-w-full truncate rounded-md bg-muted px-1.5 py-0.5 font-medium font-mono text-[11px] text-muted-foreground">{target}</span>
        </div>
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-activedescendant={current ? optionId(current) : undefined}
            aria-autocomplete="list"
            aria-controls={`${uid}-list`}
            aria-expanded
            aria-label={placeholder[mode]}
            className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(filtered.length - 1, a + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(0, a - 1));
              } else if (e.key === "Enter" && current) {
                e.preventDefault();
                choose(current);
              } else if (e.key === "Backspace" && !query && mode !== "root") {
                e.preventDefault();
                onBack();
              }
            }}
            placeholder={placeholder[mode]}
            role="combobox"
            value={query}
          />
          <Kbd>{t.escape}</Kbd>
        </div>
        <div aria-label={placeholder[mode]} className="min-h-0 flex-1 overflow-y-auto p-1.5 scrollbar-thin" id={`${uid}-list`} ref={listRef} role="listbox">
          {filtered.length === 0 ? (
            <div className="px-3 py-8 text-center text-muted-foreground text-sm" role="presentation">
              {interpolate(t.noCommands, { query })}
            </div>
          ) : null}
          {groups.map((g) => (
            <div className="mb-1" key={g} role="presentation">
              <div className="px-2.5 pt-2 pb-1 font-medium text-muted-foreground text-xs" role="presentation">
                {g}
              </div>
              {filtered
                .filter((c) => c.group === g)
                .map((c) => {
                  const i = filtered.indexOf(c);
                  return (
                    <div
                      aria-selected={i === active}
                      className={cn("flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm", i === active ? "bg-accent text-foreground" : "text-foreground/90")}
                      id={optionId(c)}
                      key={c.id}
                      onClick={() => choose(c)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          choose(c);
                        }
                      }}
                      onMouseMove={() => setActive(i)}
                      role="option"
                      tabIndex={-1}
                    >
                      <span aria-hidden className="flex size-4 items-center justify-center text-muted-foreground [&_svg]:size-4">
                        {c.icon}
                      </span>
                      <span className="flex-1 truncate">{c.label}</span>
                      {c.checked ? <CheckIcon aria-hidden className="size-4 text-foreground" /> : null}
                      {c.hint ? <Kbd>{c.hint}</Kbd> : null}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
        <div aria-hidden className="flex items-center gap-3 border-t px-3 py-2 text-muted-foreground text-xs">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> {t.navigate}
          </span>
          <span className="flex items-center gap-1">
            <Kbd>
              <CornerDownLeftIcon />
            </Kbd>{" "}
            {t.choose}
          </span>
          {mode !== "root" ? (
            <span className="ms-auto flex items-center gap-1">
              <Kbd>⌫</Kbd> {t.goBack}
            </span>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Property({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <div className="flex min-h-8 items-center gap-2">
      <span className="w-20 shrink-0 text-muted-foreground text-xs">{label}</span>
      <button className="-ms-2 flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-2 text-start outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:bg-transparent" disabled={!onClick} onClick={onClick} type="button">
        {children}
      </button>
    </div>
  );
}

/** Stands in when creating is not wired; the create controls are hidden then. */
const noCreate: Action<{ status: IssueStatus }, Issue> = async () => fail();

function applyPatch(i: Issue, patch: IssuePatch): Issue {
  const next = { ...i };
  if (patch.status) next.status = patch.status;
  if (patch.priority !== undefined) next.priority = patch.priority;
  if (patch.assignee !== undefined) next.assignee = patch.assignee ?? undefined;
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.label) {
    const { id, on } = patch.label;
    next.labels = on ? Array.from(new Set([...(i.labels ?? []), id])) : (i.labels ?? []).filter((l) => l !== id);
  }
  if (patch.subtask) {
    const { title, done } = patch.subtask;
    next.subtasks = i.subtasks?.map((s) => (s.title === title ? { ...s, done } : s));
  }
  return next;
}

function IssueTrackerScreen({ team, cycle, me, people, labels, issues: initialIssues, onUpdate, onCreate, onDelete, onComment, className }: IssueTrackerProps) {
  const t = useMessages("issueTracker", ISSUE_TRACKER_MESSAGES);
  const fmt = useFormat();
  const { now } = useWirefront();
  const [issues, setIssues] = useState(initialIssues);
  useEffect(() => setIssues(initialIssues), [initialIssues]);
  const [cursor, setCursor] = useState(initialIssues[0]?.id ?? "");
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [palette, setPalette] = useState<{ mode: PaletteMode; ids: string[] } | null>(null);
  const [collapsed, setCollapsed] = useState<Set<IssueStatus>>(() => new Set());
  const [query, setQuery] = useState("");
  const [view, setView] = useState<IssueView>("active");
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [comment, setComment] = useState("");
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const toastSeq = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const detailRef = useRef<HTMLDivElement>(null);
  const focusSearch = () => requestAnimationFrame(() => (searchRef.current?.offsetParent ? searchRef.current : mobileSearchRef.current)?.focus());
  const notify = (text: string) => setToast({ key: ++toastSeq.current, text });

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(id);
  }, [toast]);

  const statusLabel = (s: IssueStatus) => t[`status_${s}`];
  const priorityLabel = (p: IssuePriority) => t[`priority_${p}`];
  const viewLabel = (v: IssueView) => t[`view_${v}`];
  const viewTitle = (v: IssueView) => (v === "active" ? t.view_activeTitle : viewLabel(v));
  const person = (id?: string) => people.find((p) => p.id === id);
  const label = (id: string) => labels.find((l) => l.id === id);
  const day = (iso: string) => fmt.date(`${iso.slice(0, 10)}T00:00:00Z`, { month: "short", day: "numeric", timeZone: "UTC" });
  const when = (iso: string) => (iso.length > 10 ? fmt.relative(iso) : day(iso));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return issues.filter((i) => inView(view, i, me) && (!q || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q)));
  }, [issues, query, view, me]);
  const groups = STATUS_ORDER.map((id) => ({ id, label: statusLabel(id), items: filtered.filter((i) => i.status === id).sort((a, b) => (a.priority || 9) - (b.priority || 9)) })).filter((g) => g.items.length > 0);
  const flat = groups.flatMap((g) => (collapsed.has(g.id) ? [] : g.items));
  const open = issues.find((i) => i.id === openId) ?? null;

  // Start a newly opened issue at the top.
  const [shownDetail, setShownDetail] = useState(openId);
  if (shownDetail !== openId) {
    setShownDetail(openId);
    if (detailRef.current) detailRef.current.scrollTop = 0;
  }

  const focusRow = (id: string) => {
    setCursor(id);
    const el = rowRefs.current.get(id);
    const box = listRef.current;
    if (el && box) {
      el.focus({ preventScroll: true });
      // Measure the row (the button's positioned parent), not the button inside it.
      const row = el.parentElement ?? el;
      const top = row.offsetTop - 36;
      const bottom = row.offsetTop + row.offsetHeight;
      if (top < box.scrollTop) box.scrollTop = top;
      else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight + 8;
    }
  };
  const move = (d: number) => {
    if (!flat.length) return;
    const i = flat.findIndex((x) => x.id === cursor);
    const next = flat[Math.max(0, Math.min(flat.length - 1, i < 0 ? 0 : i + d))];
    if (!next) return;
    focusRow(next.id);
    if (openId) setOpenId(next.id);
  };
  const targets = () => (picked.size ? Array.from(picked) : cursor ? [cursor] : []);
  const describe = (ids: string[]) => (ids.length === 1 ? (ids[0] ?? "") : interpolate(t.manyIssues, { count: ids.length }));

  // Every change shows at once, with an activity line, and is undone if saving fails.
  const update = useAction(onUpdate ?? (async () => {}), {
    optimistic: ({ ids, patch }) => {
      const before = issues.filter((i) => ids.includes(i.id));
      const log = patch.status ? interpolate(t.logStatus, { status: statusLabel(patch.status) }) : patch.priority !== undefined ? interpolate(t.logPriority, { priority: priorityLabel(patch.priority) }) : patch.assignee !== undefined ? (patch.assignee ? interpolate(t.logAssign, { name: person(patch.assignee)?.name.split(" ")[0] ?? "" }) : t.logUnassign) : undefined;
      const at = now().toISOString();
      setIssues((all) => all.map((i) => (ids.includes(i.id) ? { ...applyPatch(i, patch), activity: log ? [...(i.activity ?? []), { who: me, text: log, at }] : i.activity } : i)));
      return () => setIssues((all) => all.map((i) => before.find((b) => b.id === i.id) ?? i));
    },
  });
  const patch = (ids: string[], p: IssuePatch) => {
    if (!onUpdate || !ids.length) return;
    update.run({ ids, patch: p });
    if (p.status === "done" && collapsed.has("done")) notify(interpolate(t.toastDone, { target: describe(ids) }));
  };
  const toggleLabel = (ids: string[], lid: string) => {
    const allHave = ids.every((id) => issues.find((i) => i.id === id)?.labels?.includes(lid));
    patch(ids, { label: { id: lid, on: !allHave } });
  };
  const remove = useAction(onDelete ?? (async () => {}), {
    optimistic: ({ ids }) => {
      const before = issues;
      setIssues((all) => all.filter((i) => !ids.includes(i.id)));
      setPicked(new Set());
      if (openId && ids.includes(openId)) setOpenId(null);
      notify(interpolate(t.toastDeleted, { target: describe(ids) }));
      rootRef.current?.focus({ preventScroll: true });
      return () => setIssues(before);
    },
  });
  const create = useAction(onCreate ?? noCreate, {
    onSuccess: (issue, { status }) => {
      setIssues((all) => [issue, ...all.filter((i) => i.id !== issue.id)]);
      setQuery("");
      setCollapsed((c) => {
        const next = new Set(c);
        next.delete(status);
        return next;
      });
      setCursor(issue.id);
      setOpenId(issue.id);
      requestAnimationFrame(() => titleRef.current?.focus());
    },
  });
  const createIssue = (status: IssueStatus = view === "backlog" ? "backlog" : "todo") => {
    if (onCreate) create.run({ status });
  };
  const addComment = useAction(onComment ?? (async () => {}), {
    optimistic: ({ id, body }) => {
      const at = now().toISOString();
      setIssues((all) => all.map((i) => (i.id === id ? { ...i, activity: [...(i.activity ?? []), { who: me, text: body, at, comment: true }] } : i)));
      return () => setIssues((all) => all.map((i) => (i.id === id ? { ...i, activity: (i.activity ?? []).filter((a) => !(a.at === at && a.text === body)) } : i)));
    },
  });
  const sendComment = () => {
    const body = comment.trim();
    if (!open || !body) return;
    addComment.run({ id: open.id, body });
    setComment("");
  };
  const error = update.error ?? remove.error ?? create.error ?? addComment.error;
  const copyIds = (ids: string[]) => {
    const target = describe(ids);
    if (!navigator.clipboard) {
      notify(interpolate(t.toastCopyFailed, { target }));
      return;
    }
    navigator.clipboard.writeText(ids.join(", ")).then(
      () => notify(interpolate(t.toastCopied, { target })),
      () => notify(interpolate(t.toastCopyFailed, { target })),
    );
  };

  const goView = (v: IssueView) => {
    setView(v);
    setPicked(new Set());
    setDrawer(false);
    listRef.current?.scrollTo({ top: 0 });
    if (v === "backlog")
      setCollapsed((c) => {
        const next = new Set(c);
        next.delete("backlog");
        return next;
      });
  };
  const toggleCollapsed = (s: IssueStatus) =>
    setCollapsed((c) => {
      const next = new Set(c);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  const commandsFor = (mode: PaletteMode, ids: string[]): Command[] => {
    const one = ids.length === 1 ? issues.find((i) => i.id === ids[0]) : undefined;
    if (mode === "status") return STATUS_ORDER.map((s) => ({ id: `s-${s}`, label: statusLabel(s), group: t.statusField, icon: <StatusIcon status={s} />, checked: one?.status === s, run: () => patch(ids, { status: s }) }));
    if (mode === "priority") return PRIORITY_ORDER.map((p) => ({ id: `p-${p}`, label: priorityLabel(p), group: t.priorityField, icon: <PriorityIcon priority={p} />, hint: String(p), checked: one?.priority === p, run: () => patch(ids, { priority: p }) }));
    if (mode === "assignee")
      return [
        ...people.map((p) => ({ id: `a-${p.id}`, label: p.id === me ? interpolate(t.personYou, { name: p.name }) : p.name, group: t.assignee, icon: <PersonAvatar person={p} size="size-4" />, checked: one?.assignee === p.id, run: () => patch(ids, { assignee: p.id }) })),
        { id: "a-none", label: t.noAssignee, group: t.assignee, icon: <PersonAvatar size="size-4" />, checked: one ? !one.assignee : false, run: () => patch(ids, { assignee: null }) },
      ];
    if (mode === "label") return labels.map((l) => ({ id: `l-${l.id}`, label: l.name, group: t.labels, icon: <span className={cn("size-2 rounded-full", dotTone[l.tone])} />, checked: ids.every((id) => issues.find((i) => i.id === id)?.labels?.includes(l.id)), keepOpen: true, run: () => toggleLabel(ids, l.id) }));
    const editable = ids.length > 0 && Boolean(onUpdate);
    return [
      ...(editable
        ? [
            { id: "c-status", label: t.changeStatus, group: t.groupIssue, icon: <StatusIcon status="in_progress" />, hint: "S", keepOpen: true, run: () => setPalette({ mode: "status", ids }) },
            { id: "c-priority", label: t.setPriority, group: t.groupIssue, icon: <PriorityIcon priority={2} />, hint: "P", keepOpen: true, run: () => setPalette({ mode: "priority", ids }) },
            { id: "c-assign", label: t.assignTo, group: t.groupIssue, icon: <UserRoundIcon />, hint: "A", keepOpen: true, run: () => setPalette({ mode: "assignee", ids }) },
            { id: "c-label", label: t.addLabelCmd, group: t.groupIssue, icon: <TagIcon />, hint: "L", keepOpen: true, run: () => setPalette({ mode: "label", ids }) },
            { id: "c-me", label: t.assignMe, group: t.groupIssue, icon: <PersonAvatar person={person(me)} size="size-4" />, hint: "I", run: () => patch(ids, { assignee: me }) },
          ]
        : []),
      ...(ids.length ? [{ id: "c-copy", label: ids.length === 1 ? interpolate(t.copyOne, { id: ids[0] ?? "" }) : t.copyIds, group: t.groupIssue, icon: <CopyIcon />, run: () => copyIds(ids) }] : []),
      ...(ids.length && onDelete ? [{ id: "c-delete", label: ids.length === 1 ? t.deleteOne : interpolate(t.deleteMany, { count: ids.length }), group: t.groupIssue, icon: <Trash2Icon />, run: () => remove.run({ ids }) }] : []),
      ...(onCreate ? [{ id: "c-new", label: t.createIssue, group: t.groupWorkspace, icon: <PlusIcon />, hint: "C", run: () => createIssue() }] : []),
      ...VIEW_ORDER.filter((v) => v !== view).map((v) => {
        const Icon = viewIcon[v];
        return { id: `v-${v}`, label: interpolate(t.goTo, { view: viewLabel(v) }), group: t.groupViews, icon: <Icon />, run: () => goView(v) };
      }),
      { id: "c-done", label: collapsed.has("done") ? t.showDone : t.hideDone, group: t.groupWorkspace, icon: <StatusIcon status="done" />, run: () => toggleCollapsed("done") },
    ];
  };

  const closePalette = () => {
    setPalette(null);
    requestAnimationFrame(() => (rowRefs.current.get(cursor) ?? rootRef.current)?.focus({ preventScroll: true }));
  };

  // Keyboard: J/K move, Enter opens, X selects, S/P/A/L set fields, I assigns me, 0-4 priority,
  // C creates, / filters, ⌘K opens the command menu, Esc closes the top layer.
  const keysRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keysRef.current = (e) => {
    if (palette) return;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setPalette({ mode: "root", ids: targets() });
      return;
    }
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
      if (e.key === "Escape") {
        target.blur();
        rootRef.current?.focus({ preventScroll: true });
      }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    const ids = targets();
    if (k === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (k === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter" || k === "o") {
      e.preventDefault();
      if (cursor) setOpenId(cursor);
    } else if (e.key === "Escape") {
      if (openId) {
        setOpenId(null);
        focusRow(cursor);
      } else if (picked.size) setPicked(new Set());
    } else if (k === "x" && cursor) {
      e.preventDefault();
      setPicked((p) => {
        const next = new Set(p);
        if (next.has(cursor)) next.delete(cursor);
        else next.add(cursor);
        return next;
      });
    } else if ((k === "s" || k === "p" || k === "a" || k === "l") && onUpdate) {
      e.preventDefault();
      if (ids.length) setPalette({ mode: ({ s: "status", p: "priority", a: "assignee", l: "label" } as const)[k], ids });
    } else if (k === "i") {
      patch(ids, { assignee: me });
    } else if (["0", "1", "2", "3", "4"].includes(e.key)) {
      patch(ids, { priority: Number(e.key) as IssuePriority });
    } else if (k === "c" && onCreate) {
      e.preventDefault();
      createIssue();
    } else if (e.key === "/") {
      e.preventDefault();
      setSearchOpen(true);
      focusSearch();
    }
  };
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => keysRef.current(e);
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  const doneCount = issues.filter((i) => i.status === "done").length;
  const share = (s: IssueStatus) => `${(issues.filter((i) => i.status === s).length / Math.max(1, issues.length)) * 100}%`;
  const daysLeft = cycle ? Math.max(0, Math.floor((new Date(`${cycle.endsAt}T23:59:59Z`).getTime() - now().getTime()) / 86_400_000)) : 0;
  const keyHints: [string[], string][] = [
    [["J", "K"], t.keysMove],
    [["S", "P", "A", "L"], t.keysFields],
    [["X"], t.keysSelect],
    [["⌘K"], t.keysEverything],
  ];

  const sidebar = (onClose?: () => void) => (
    <div className="flex h-full flex-col px-2 pt-3 pb-3">
      <div className="flex items-center gap-2 px-1.5 pb-3">
        <span aria-hidden className="flex size-7 items-center justify-center rounded-lg bg-category-1-strong font-semibold text-[11px] text-white">
          {team.key.slice(0, 2)}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate font-medium">{team.workspace}</div>
          <div className="truncate text-muted-foreground text-xs">{interpolate(t.team, { name: team.name })}</div>
        </div>
        {onClose ? (
          <Button aria-label={t.closeNav} onClick={onClose} size="icon-sm" variant="ghost">
            <XIcon />
          </Button>
        ) : null}
      </div>
      <button
        className="mb-3 flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg border bg-background px-2.5 text-muted-foreground shadow-xs/5 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring dark:bg-input/32"
        onClick={() => {
          onClose?.();
          setPalette({ mode: "root", ids: targets() });
        }}
        type="button"
      >
        <SearchIcon aria-hidden className="size-4" />
        <span className="flex-1 text-start">{t.command}</span>
        <Kbd>⌘K</Kbd>
      </button>
      <nav aria-label={t.views} className="flex flex-col gap-0.5">
        {VIEW_ORDER.map((v) => {
          const on = v === view;
          const Icon = viewIcon[v];
          const count = issues.filter((i) => inView(v, i, me) && i.status !== "done").length;
          return (
            <button aria-current={on ? "page" : undefined} className={cn("group/nav relative flex h-8 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-start text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring", on ? "text-foreground" : "text-muted-foreground hover:text-foreground")} key={v} onClick={() => goView(v)} type="button">
              {on ? <motion.span className="absolute inset-0 rounded-lg bg-accent" layoutId={onClose ? "issue-nav-drawer" : "issue-nav"} transition={{ type: "spring", stiffness: 520, damping: 42 }} /> : <span className="absolute inset-0 rounded-lg transition-colors group-hover/nav:bg-accent/60" />}
              <Icon aria-hidden className="relative size-4" />
              <span className="relative flex-1 font-medium">{viewLabel(v)}</span>
              <span className="relative text-muted-foreground text-xs tabular-nums">{count}</span>
            </button>
          );
        })}
      </nav>
      {cycle ? (
        <>
          <div className="mt-6 px-2.5 font-medium text-muted-foreground text-xs">{interpolate(t.cycle, { name: cycle.name, date: day(cycle.endsAt) })}</div>
          <div className="mx-2.5 mt-2">
            <div aria-hidden className="flex h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-category-1" style={{ width: share("done") }} />
              <div className="h-full bg-category-2" style={{ width: share("in_review") }} />
              <div className="h-full bg-category-3" style={{ width: share("in_progress") }} />
            </div>
            <div className="mt-2 flex justify-between text-muted-foreground text-xs tabular-nums">
              <span>{interpolate(t.cycleDone, { done: doneCount, total: issues.length })}</span>
              <span>{interpolate(t.daysLeft, { count: daysLeft })}</span>
            </div>
          </div>
        </>
      ) : null}
      <div aria-hidden className="mt-auto flex flex-col gap-1.5 px-2.5 text-muted-foreground text-xs">
        {keyHints.map(([keys, v]) => (
          <div className="flex items-center gap-1.5" key={v}>
            {keys.map((x) => (
              <Kbd key={x}>{x}</Kbd>
            ))}
            <span className="truncate">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const labelChip = (lid: string, muted: boolean) => {
    const l = label(lid);
    return l ? (
      <span className={cn("inline-flex h-5 items-center gap-1 rounded-full border px-1.5 text-[11px]", muted && "text-muted-foreground")} key={lid}>
        <span aria-hidden className={cn("size-1.5 rounded-full", dotTone[l.tone])} />
        {l.name}
      </span>
    ) : null;
  };
  const openPalette = (mode: PaletteMode, ids: string[]) => (onUpdate ? () => setPalette({ mode, ids }) : undefined);

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("@container relative isolate flex h-svh w-full overflow-hidden bg-sidebar text-foreground text-sm outline-none", className)} ref={rootRef}>
        <aside aria-label={t.navigation} className="hidden w-56 shrink-0 @5xl:block">
          {sidebar()}
        </aside>

        <Sheet onOpenChange={setDrawer} open={drawer}>
          <SheetContent className="w-62 max-w-[calc(100%-3rem)] gap-0 bg-sidebar p-0" showCloseButton={false} side="left">
            <SheetTitle className="sr-only">{t.navigation}</SheetTitle>
            {sidebar(() => setDrawer(false))}
          </SheetContent>
        </Sheet>

        <main className="relative flex min-w-0 flex-1 overflow-hidden bg-background @5xl:my-2 @5xl:me-2 @5xl:rounded-2xl @5xl:border @5xl:shadow-xs/5">
          <section aria-label={t.issues} className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-13 shrink-0 items-center gap-2 border-b px-3 @lg:px-4">
              <Button aria-label={t.openNav} className="@5xl:hidden" onClick={() => setDrawer(true)} size="icon-sm" variant="ghost">
                <MenuIcon />
              </Button>
              <h2 className="font-semibold">{viewTitle(view)}</h2>
              <span className="text-muted-foreground text-xs tabular-nums">{filtered.filter((i) => i.status !== "done").length}</span>
              <div className="ms-auto flex items-center gap-1.5">
                <Button
                  aria-label={t.filter}
                  aria-pressed={searchOpen}
                  className="@2xl:hidden"
                  onClick={() => {
                    setSearchOpen((v) => !v);
                    if (!searchOpen) focusSearch();
                    else setQuery("");
                  }}
                  size="icon-sm"
                  variant="ghost"
                >
                  <SearchIcon />
                </Button>
                <label className="hidden h-8 w-52 items-center gap-2 rounded-lg border bg-background px-2.5 text-muted-foreground shadow-xs/5 transition-shadow focus-within:border-ring/60 focus-within:ring-3 focus-within:ring-ring/16 @2xl:flex dark:bg-input/32">
                  <SearchIcon aria-hidden className="size-3.5 shrink-0" />
                  <input
                    aria-label={t.filter}
                    className="min-w-0 flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown" || e.key === "Enter") {
                        e.preventDefault();
                        if (flat[0]) focusRow(flat[0].id);
                      }
                      if (e.key === "Escape") {
                        setQuery("");
                        setSearchOpen(false);
                      }
                    }}
                    placeholder={t.filterPlaceholder}
                    ref={searchRef}
                    value={query}
                  />
                  {query ? (
                    <button aria-label={t.clearFilter} className="-me-1.5 flex size-6 cursor-pointer items-center justify-center rounded-md outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setQuery("")} type="button">
                      <XIcon aria-hidden className="size-3.5" />
                    </button>
                  ) : (
                    <Kbd>/</Kbd>
                  )}
                </label>
                {onCreate ? (
                  <Button aria-label={t.newIssue} className="transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.97]" disabled={create.isPending()} onClick={() => createIssue()} size="sm">
                    <PlusIcon />
                    <span className="hidden @md:inline">{t.newIssue}</span>
                  </Button>
                ) : null}
              </div>
            </header>

            {searchOpen ? (
              <div className="flex h-11 shrink-0 items-center gap-2 border-b px-4 @2xl:hidden">
                <SearchIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                <input
                  aria-label={t.filterPlaceholder}
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                    if (e.key === "Escape") {
                      setQuery("");
                      setSearchOpen(false);
                    }
                  }}
                  placeholder={t.filterPlaceholder}
                  ref={mobileSearchRef}
                  value={query}
                />
                <Button
                  aria-label={t.closeFilter}
                  onClick={() => {
                    setQuery("");
                    setSearchOpen(false);
                  }}
                  size="icon-xs"
                  variant="ghost"
                >
                  <XIcon />
                </Button>
              </div>
            ) : null}

            {error ? (
              <p className="shrink-0 border-b bg-destructive/8 px-4 py-2 text-destructive text-xs" role="alert">
                {error}
              </p>
            ) : null}

            <AnimatePresence initial={false}>
              {picked.size > 0 ? (
                <motion.div animate={{ height: 44, opacity: 1 }} className="flex shrink-0 items-center gap-2 overflow-hidden border-b bg-muted/50 px-3 @lg:px-4" exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }} transition={{ duration: 0.18, ease }}>
                  <span className="font-medium tabular-nums">{interpolate(t.selected, { count: picked.size })}</span>
                  <div className="ms-auto flex items-center gap-1">
                    {onUpdate ? (
                      <>
                        <Button onClick={() => setPalette({ mode: "status", ids: Array.from(picked) })} size="xs" variant="outline">
                          <StatusIcon status="in_progress" /> {t.statusField}
                        </Button>
                        <Button className="hidden @md:inline-flex" onClick={() => setPalette({ mode: "priority", ids: Array.from(picked) })} size="xs" variant="outline">
                          <PriorityIcon priority={2} /> {t.priorityField}
                        </Button>
                        <Button onClick={() => setPalette({ mode: "assignee", ids: Array.from(picked) })} size="xs" variant="outline">
                          <UserRoundIcon /> {t.assign}
                        </Button>
                      </>
                    ) : null}
                    <Button aria-label={t.clearSelection} onClick={() => setPicked(new Set())} size="icon-xs" variant="ghost">
                      <XIcon />
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="relative min-h-0 flex-1 overflow-y-auto scrollbar-thin" ref={listRef}>
              {groups.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <span aria-hidden className="flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-xs/5">
                    <SearchIcon className="size-5" />
                  </span>
                  <p className="mt-3 font-medium">{query ? t.noMatch : t.nothing}</p>
                  <p className="mt-1 text-muted-foreground text-xs">{query ? interpolate(t.noMatchHint, { view: viewLabel(view), query }) : onCreate ? t.nothingHint : null}</p>
                </div>
              ) : (
                <LayoutGroup id={`issues-${view}-${query}`} key={`${view}-${query}`}>
                  {groups.map((g) => {
                    const isCollapsed = collapsed.has(g.id);
                    return (
                      <div key={g.id}>
                        <div className={cn("sticky top-0 z-10 flex h-9 items-center gap-2 border-b bg-background bg-linear-to-r ps-3 pe-2 @lg:ps-4", groupTone[g.id])}>
                          <button aria-expanded={!isCollapsed} className="flex cursor-pointer items-center gap-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => toggleCollapsed(g.id)} type="button">
                            <ChevronDownIcon aria-hidden className={cn("size-3.5 text-muted-foreground transition-transform duration-200", isCollapsed && "-rotate-90 rtl:rotate-90")} />
                            <StatusIcon status={g.id} />
                            <span className="font-medium text-[13px]">{g.label}</span>
                            <span className="text-muted-foreground text-xs tabular-nums">{g.items.length}</span>
                          </button>
                          {g.id !== "done" && onCreate ? (
                            <Button aria-label={interpolate(t.newIssueIn, { status: g.label })} className="ms-auto" onClick={() => createIssue(g.id)} size="icon-xs" variant="ghost">
                              <PlusIcon />
                            </Button>
                          ) : null}
                        </div>
                        {isCollapsed ? null : (
                          <ul aria-label={g.label}>
                            <AnimatePresence initial={false}>
                              {g.items.map((issue) => {
                                const isCursor = issue.id === cursor;
                                const isPicked = picked.has(issue.id);
                                const a = person(issue.assignee);
                                return (
                                  <motion.li animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key={issue.id} layout="position" layoutId={issue.id} transition={{ layout: glide, opacity: { duration: 0.15 } }}>
                                    <div className={cn("group/row relative flex h-10 items-center gap-2.5 border-border/60 border-b ps-3 pe-3 @lg:ps-4", isCursor ? "bg-accent" : "hover:bg-accent/50", isPicked && "bg-info/8 hover:bg-info/10", issue.id === openId && "bg-accent")}>
                                      {isCursor ? <span aria-hidden className="absolute inset-y-0 inset-s-0 w-0.5 bg-foreground/70" /> : null}
                                      <Checkbox
                                        aria-label={interpolate(isPicked ? t.deselectIssue : t.selectIssue, { id: issue.id })}
                                        checked={isPicked}
                                        className={cn("-ms-1 hidden @lg:flex", !isPicked && "opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100")}
                                        onCheckedChange={() =>
                                          setPicked((p) => {
                                            const next = new Set(p);
                                            if (next.has(issue.id)) next.delete(issue.id);
                                            else next.add(issue.id);
                                            return next;
                                          })
                                        }
                                        tabIndex={-1}
                                      />
                                      <button
                                        aria-current={issue.id === openId ? "true" : undefined}
                                        className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                                        onClick={() => {
                                          setCursor(issue.id);
                                          setOpenId(issue.id);
                                        }}
                                        onFocus={() => setCursor(issue.id)}
                                        ref={(el) => {
                                          if (el) rowRefs.current.set(issue.id, el);
                                          else rowRefs.current.delete(issue.id);
                                        }}
                                        tabIndex={isCursor ? 0 : -1}
                                        type="button"
                                      >
                                        <span title={priorityLabel(issue.priority)}>
                                          <PriorityIcon priority={issue.priority} />
                                        </span>
                                        <span className="sr-only w-16 shrink-0 font-mono text-muted-foreground text-xs @xl:not-sr-only @xl:block">{issue.id}</span>
                                        <span title={statusLabel(issue.status)}>
                                          <StatusIcon status={issue.status} />
                                        </span>
                                        <span className={cn("min-w-0 flex-1 truncate font-medium text-[13px]", !issue.title && "font-normal text-muted-foreground italic", issue.status === "done" && "text-muted-foreground")}>{issue.title || t.untitled}</span>
                                        <span className="hidden shrink-0 items-center gap-1 @3xl:flex">{issue.labels?.map((lid) => labelChip(lid, true))}</span>
                                        {issue.due ? (
                                          <span className={cn("hidden h-5 shrink-0 items-center gap-1 rounded-full border px-1.5 text-[11px] tabular-nums @2xl:inline-flex", issue.priority === 1 && issue.status !== "done" ? "border-destructive/30 text-destructive-foreground" : "text-muted-foreground")}>
                                            <CalendarIcon aria-hidden className="size-3" />
                                            {day(issue.due)}
                                          </span>
                                        ) : null}
                                        <span className="hidden w-12 shrink-0 text-end text-muted-foreground text-xs tabular-nums @xl:block">{day(issue.created)}</span>
                                        <span title={a?.name ?? t.unassigned}>
                                          <PersonAvatar person={a} />
                                        </span>
                                      </button>
                                    </div>
                                  </motion.li>
                                );
                              })}
                            </AnimatePresence>
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </LayoutGroup>
              )}
            </div>
          </section>

          <AnimatePresence>
            {open ? (
              <motion.aside animate={{ x: 0, opacity: 1 }} aria-label={interpolate(t.details, { id: open.id })} className="absolute inset-0 z-30 flex flex-col bg-background @4xl:static @4xl:z-auto @4xl:w-100 @4xl:shrink-0 @4xl:border-s @6xl:w-110" exit={{ x: 32, opacity: 0 }} initial={{ x: 32, opacity: 0 }} key="detail" transition={{ duration: 0.2, ease }}>
                <header className="flex h-13 shrink-0 items-center gap-2 border-b px-3">
                  <Button aria-label={t.back} className="@4xl:hidden" onClick={() => setOpenId(null)} size="icon-sm" variant="ghost">
                    <ArrowLeftIcon className="rtl:-scale-x-100" />
                  </Button>
                  <span className="font-mono text-muted-foreground text-xs">{open.id}</span>
                  <div className="ms-auto flex items-center gap-1">
                    <span aria-hidden className="me-1 hidden text-muted-foreground text-xs @4xl:inline">
                      <Kbd>J</Kbd> <Kbd>K</Kbd>
                    </span>
                    <Button aria-label={t.moreActions} onClick={() => setPalette({ mode: "root", ids: [open.id] })} size="xs" variant="outline">
                      <Kbd className="h-4 bg-transparent px-0">⌘K</Kbd>
                    </Button>
                    <Button aria-label={t.closeDetails} onClick={() => setOpenId(null)} size="icon-sm" variant="ghost">
                      <XIcon />
                    </Button>
                  </div>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin" ref={detailRef}>
                  <div className="flex flex-col gap-5 p-4">
                    <textarea
                      aria-label={t.title}
                      className="w-full resize-none bg-transparent font-heading font-semibold text-lg leading-snug tracking-tight outline-none field-sizing-content placeholder:text-muted-foreground/60"
                      onBlur={(e) => {
                        const title = e.target.value.trim();
                        if (onUpdate && title !== open.title) update.run({ ids: [open.id], patch: { title } });
                      }}
                      onChange={(e) => setIssues((all) => all.map((i) => (i.id === open.id ? { ...i, title: e.target.value.replace(/\n/g, "") } : i)))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          (e.target as HTMLTextAreaElement).blur();
                          focusRow(open.id);
                        }
                      }}
                      placeholder={t.title}
                      readOnly={!onUpdate}
                      ref={titleRef}
                      rows={1}
                      value={open.title}
                    />

                    <div className="flex flex-col gap-0.5 rounded-xl border bg-card p-2 ps-3">
                      <Property label={t.statusField} onClick={openPalette("status", [open.id])}>
                        <StatusIcon status={open.status} />
                        {statusLabel(open.status)}
                        {onUpdate ? <Kbd className="ms-auto">S</Kbd> : null}
                      </Property>
                      <Property label={t.priorityField} onClick={openPalette("priority", [open.id])}>
                        <PriorityIcon priority={open.priority} />
                        {priorityLabel(open.priority)}
                        {onUpdate ? <Kbd className="ms-auto">P</Kbd> : null}
                      </Property>
                      <Property label={t.assignee} onClick={openPalette("assignee", [open.id])}>
                        <PersonAvatar person={person(open.assignee)} />
                        <span className={cn(!open.assignee && "text-muted-foreground")}>{person(open.assignee)?.name ?? t.unassigned}</span>
                        {onUpdate ? <Kbd className="ms-auto">A</Kbd> : null}
                      </Property>
                      <Property label={t.labels} onClick={openPalette("label", [open.id])}>
                        <span className="flex min-w-0 flex-1 flex-wrap gap-1">{open.labels?.length ? open.labels.map((lid) => labelChip(lid, false)) : <span className="text-muted-foreground">{t.addLabel}</span>}</span>
                        {onUpdate ? <Kbd className="ms-auto">L</Kbd> : null}
                      </Property>
                      <div className="flex min-h-8 items-center gap-2">
                        <span className="w-20 shrink-0 text-muted-foreground text-xs">{t.estimate}</span>
                        <span className="tabular-nums">{open.estimate ? (open.estimate === 1 ? t.point : interpolate(t.points, { count: open.estimate })) : "—"}</span>
                        {open.due ? <span className="ms-auto pe-2 text-muted-foreground text-xs tabular-nums">{interpolate(t.due, { date: day(open.due) })}</span> : null}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 text-pretty leading-6">{open.description?.length ? open.description.map((p) => <p key={p}>{p}</p>) : <p className="text-muted-foreground">{t.noDescription}</p>}</div>

                    {open.subtasks ? (
                      <div>
                        <div className="mb-1.5 flex items-center gap-2 text-muted-foreground text-xs">
                          <span className="font-medium">{t.subIssues}</span>
                          <span className="tabular-nums">
                            {open.subtasks.filter((s) => s.done).length}/{open.subtasks.length}
                          </span>
                        </div>
                        <ul className="flex flex-col">
                          {open.subtasks.map((s) => (
                            <li key={s.title}>
                              <button aria-pressed={s.done} className="flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-lg px-1.5 text-start outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:hover:bg-transparent" disabled={!onUpdate} onClick={() => patch([open.id], { subtask: { title: s.title, done: !s.done } })} type="button">
                                <StatusIcon status={s.done ? "done" : "todo"} />
                                <span className={cn(s.done && "text-muted-foreground line-through decoration-muted-foreground/50")}>{s.title}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div>
                      <div className="mb-2 font-medium text-muted-foreground text-xs">{t.activity}</div>
                      <ol className="relative flex flex-col gap-3 before:absolute before:inset-s-2.25 before:top-2 before:bottom-2 before:w-px before:bg-border">
                        {(open.activity ?? [{ who: open.assignee ?? me, text: t.logCreated, at: open.created }]).map((a) => {
                          const p = person(a.who);
                          const key = `${a.at}-${a.who}-${a.text}`;
                          return a.comment ? (
                            <li className="relative flex gap-2.5" key={key}>
                              <PersonAvatar person={p} />
                              <div className="min-w-0 flex-1 rounded-xl border bg-card px-3 py-2">
                                <div className="flex items-baseline gap-2 text-xs">
                                  <span className="font-medium">{p?.name}</span>
                                  <time className="text-muted-foreground" dateTime={a.at}>
                                    {when(a.at)}
                                  </time>
                                </div>
                                <p className="mt-1 text-pretty leading-6">{a.text}</p>
                              </div>
                            </li>
                          ) : (
                            <motion.li animate={{ opacity: 1, y: 0 }} className="relative flex items-center gap-2.5 text-muted-foreground text-xs" initial={a.at.length > 10 ? { opacity: 0, y: 4 } : false} key={key} transition={{ duration: 0.2, ease }}>
                              <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-background ring-1 ring-border">
                                <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                              </span>
                              <span>
                                <span className="font-medium text-foreground">{a.who === me ? t.you : p?.name.split(" ")[0]}</span> {a.text}
                              </span>
                              <time className="ms-auto tabular-nums" dateTime={a.at}>
                                {when(a.at)}
                              </time>
                            </motion.li>
                          );
                        })}
                      </ol>
                    </div>
                  </div>
                </div>
                {onComment ? (
                  <div className="shrink-0 border-t p-3">
                    <div className="flex items-end gap-2 rounded-xl border bg-card p-1.5 ps-3 shadow-xs/5 transition-shadow focus-within:border-ring/60 focus-within:ring-3 focus-within:ring-ring/16">
                      <textarea
                        aria-label={t.comment}
                        className="max-h-28 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-sm leading-5 outline-none field-sizing-content placeholder:text-muted-foreground/70"
                        onChange={(e) => setComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            sendComment();
                          }
                        }}
                        placeholder={t.commentPlaceholder}
                        rows={1}
                        value={comment}
                      />
                      <Button disabled={!comment.trim()} onClick={sendComment} size="sm" variant={comment.trim() ? "default" : "ghost"}>
                        {t.send}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </motion.aside>
            ) : null}
          </AnimatePresence>

          <Palette commands={palette ? commandsFor(palette.mode, palette.ids) : []} mode={palette?.mode ?? "root"} onBack={() => palette && setPalette({ mode: "root", ids: palette.ids })} onClose={closePalette} open={Boolean(palette)} t={t} target={palette?.ids.length ? describe(palette.ids) : interpolate(t.team, { name: team.name })} />

          <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-4">
            <AnimatePresence mode="popLayout">
              {toast ? (
                <motion.div animate={{ opacity: 1, y: 0, scale: 1 }} className="flex h-9 items-center rounded-full border bg-popover px-4 text-sm shadow-lg/10" exit={{ opacity: 0, y: 6, scale: 0.98 }} initial={{ opacity: 0, y: 8, scale: 0.98 }} key={toast.key} transition={{ duration: 0.2, ease }}>
                  {toast.text}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}

export function IssueTracker(props: IssueTrackerProps) {
  return (
    <ScreenBoundary name="IssueTracker">
      <IssueTrackerScreen {...props} />
    </ScreenBoundary>
  );
}

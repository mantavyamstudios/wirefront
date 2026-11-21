// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `notes`).
"use client";

import { Button } from "@wirefront/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import { type Action, fail } from "@wirefront/ui/wirefront/types";
import { ChevronDownIcon, ChevronLeftIcon, FolderIcon, Heading1Icon, Heading2Icon, ListChecksIcon, ListIcon, NotebookPenIcon, PilcrowIcon, PinIcon, RotateCcwIcon, SearchIcon, SquarePenIcon, Trash2Icon, Undo2Icon, XIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, type ReactNode, type TextareaHTMLAttributes, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Note, NoteBlock, NoteBlockType, NoteFolder, NoteFolderTone } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("notes.<key>"). */
export const NOTES_MESSAGES = {
  app: "Notes",
  folders: "Folders",
  allNotes: "All notes",
  trash: "Recently deleted",
  newNote: "New note",
  search: "Search notes",
  searchPlaceholder: "Search",
  clearSearch: "Clear search",
  pinned: "Pinned",
  notes: "Notes",
  untitled: "New note",
  noText: "No additional text",
  noMatch: "No notes match “{query}”",
  searching: "Searching {folder}.",
  searchAll: "Search all notes",
  nothingDeleted: "Nothing deleted",
  nothingHere: "No notes here yet",
  deletedHint: "Deleted notes stay here until you restore them.",
  emptyHint: "Start one and it’ll show up here.",
  editor: "Editor",
  inTrash: "In Recently deleted",
  moveTo: "Move to",
  edited: "Edited {when}",
  restore: "Restore",
  formatting: "Formatting",
  turnInto: "Turn into {type}",
  block_h1: "Heading",
  block_h2: "Subheading",
  block_p: "Text",
  block_todo: "Checklist",
  block_bullet: "Bullets",
  pin: "Pin note",
  unpin: "Unpin note",
  delete: "Delete note",
  title: "Title",
  words: "{count} words",
  todosDone: "{done} of {total} done",
  checklistItem: "Checklist item",
  bullet: "Bullet",
  text: "Text",
  heading: "Heading",
  startHint: "Start writing. Type “[] ” for a checklist, “# ” for a heading.",
  todo: "To-do",
  listItem: "List item",
  addLine: "Add a line at the end",
  noneSelected: "No note selected",
  movedToTrash: "Moved to Recently deleted",
  undo: "Undo",
  todayAt: "today at {time}",
  yesterday: "Yesterday",
  yesterdayAt: "yesterday at {time}",
  weekdayAt: "{day} at {time}",
};

export interface NotesProps {
  folders: NoteFolder[];
  notes: Note[];
  initialNoteId?: string;
  /** Called with the whole note after every change (text, blocks, folder, pin, deleted); debounce saves. */
  onChange?: (note: Note) => void;
  /** Creates an empty note in a folder and returns it; it opens with the title focused. */
  onCreate?: Action<{ folderId: string }, Note>;
  className?: string;
}

const easeOut = [0.23, 1, 0.32, 1] as const;
const spring = { type: "spring", stiffness: 520, damping: 46, mass: 1 } as const;
const press = "transition-[color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.97]";
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-ring";
const menuPop = "transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-100";
const tones: Record<NoteFolderTone, string> = { amber: "bg-category-3", sky: "bg-category-1", rose: "bg-category-4", emerald: "bg-category-2", violet: "bg-category-5" };
const blockStyles: Record<NoteBlockType, string> = {
  h1: "font-heading font-semibold text-xl leading-8 tracking-tight",
  h2: "font-heading font-semibold text-base leading-7 tracking-tight",
  p: "text-[15px] leading-7",
  todo: "text-[15px] leading-7",
  bullet: "text-[15px] leading-7",
};
const blockIcon: Record<NoteBlockType, ReactNode> = { h1: <Heading1Icon />, h2: <Heading2Icon />, p: <PilcrowIcon />, todo: <ListChecksIcon />, bullet: <ListIcon /> };
const BLOCK_ORDER: NoteBlockType[] = ["h1", "h2", "p", "todo", "bullet"];
const SHORTCUTS: [string, NoteBlockType][] = [
  ["## ", "h2"],
  ["# ", "h1"],
  ["- ", "bullet"],
  ["* ", "bullet"],
  ["[] ", "todo"],
  ["[ ] ", "todo"],
];
const noCreate: Action<{ folderId: string }, Note> = async () => fail();

function useReducedMotionSafe() {
  const prefers = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(prefers);
}

const preview = (n: Note) =>
  n.blocks
    .filter((x) => x.text.trim())
    .map((x) => x.text)
    .join(" · ");
function todoStats(n: Note) {
  const todos = n.blocks.filter((x) => x.type === "todo");
  return { done: todos.filter((x) => x.done).length, total: todos.length };
}

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-[calc(var(--radius)*0.3)] bg-warning/30 text-foreground">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function excerpt(text: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q);
  if (i < 30) return text;
  const from = text.lastIndexOf(" ", i - 16);
  return `…${text.slice(from > 0 ? from + 1 : i - 16)}`;
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const r = 5.5;
  const c = 2 * Math.PI * r;
  const reduce = useReducedMotionSafe();
  return (
    <svg aria-hidden="true" className="size-3.5 -rotate-90" viewBox="0 0 14 14">
      <circle className="fill-none stroke-border" cx="7" cy="7" r={r} strokeWidth="2" />
      <motion.circle animate={{ strokeDashoffset: c * (1 - done / Math.max(1, total)) }} className={cn("fill-none", done === total ? "stroke-success" : "stroke-foreground/70")} cx="7" cy="7" initial={false} r={r} strokeDasharray={c} strokeLinecap="round" strokeWidth="2" transition={reduce ? { duration: 0 } : { duration: 0.35, ease: easeOut }} />
    </svg>
  );
}

/** A textarea that grows with its text (field-sizing where supported, measured otherwise). */
function AutoText({ value, className, inputRef, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string; inputRef?: (el: HTMLTextAreaElement | null) => void }) {
  const local = useRef<HTMLTextAreaElement | null>(null);
  // Re-measure after every render; cheap, and only where field-sizing is unsupported.
  useLayoutEffect(() => {
    const el = local.current;
    if (!el || (typeof CSS !== "undefined" && CSS.supports("field-sizing", "content"))) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  });
  return (
    <textarea
      className={cn("block w-full resize-none overflow-hidden bg-transparent outline-none [field-sizing:content] placeholder:text-muted-foreground/60", className)}
      ref={(el) => {
        local.current = el;
        inputRef?.(el);
      }}
      rows={1}
      value={value}
      {...props}
    />
  );
}

function CheckBox({ checked, onToggle, label, disabled }: { checked: boolean; onToggle: () => void; label: string; disabled?: boolean }) {
  const reduce = useReducedMotionSafe();
  return (
    <label className={cn("relative mt-[5px] flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded-[calc(var(--radius)*0.5)] border transition-[background-color,border-color,scale] duration-150 ease-out after:absolute after:-inset-2.5 after:content-[''] active:scale-[0.92] has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-offset-1 has-focus-visible:ring-offset-background", checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:border-foreground/40 dark:bg-input/32")}>
      <input aria-label={label} checked={checked} className="sr-only" disabled={disabled} onChange={onToggle} type="checkbox" />
      <svg aria-hidden="true" className="size-3" fill="none" viewBox="0 0 12 12">
        <motion.path animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }} d="M2.5 6.2 5 8.6l4.5-5" initial={false} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" transition={reduce ? { duration: 0 } : { duration: 0.18, ease: easeOut }} />
      </svg>
    </label>
  );
}

type Pending = { id: string; at: "start" | "end" } | null;

function NotesScreen({ folders, notes: initialNotes, initialNoteId, onChange, onCreate, className }: NotesProps) {
  const t = useMessages("notes", NOTES_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone } = useWirefront();
  const reduce = useReducedMotionSafe();
  const [notes, setNotes] = useState(initialNotes);
  useEffect(() => setNotes(initialNotes), [initialNotes]);
  const [folder, setFolder] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(initialNoteId ?? initialNotes[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [focusedBlock, setFocusedBlock] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "editor">("list");
  const [undo, setUndo] = useState<{ id: string } | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const blockRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const counter = useRef(0);
  const uid = (p: string) => `${p}-local-${++counter.current}`;

  useEffect(() => {
    if (!pending) return;
    const el = pending.id === "title" ? titleRef.current : blockRefs.current.get(pending.id);
    if (el) {
      el.focus();
      const pos = pending.at === "end" ? el.value.length : 0;
      el.setSelectionRange(pos, pos);
    }
    setPending(null);
  }, [pending]);

  useEffect(() => {
    if (!undo) return;
    const id = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(id);
  }, [undo]);

  // Dates read as times today, "Yesterday", a weekday this week, or a short date.
  const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const relDate = (iso: string) => {
    const d = new Date(iso);
    const diff = Math.round((Date.parse(dayKey(now())) - Date.parse(dayKey(d))) / 86_400_000);
    const time = fmt.time(d);
    if (diff <= 0) return { short: time, long: interpolate(t.todayAt, { time }) };
    if (diff === 1) return { short: t.yesterday, long: interpolate(t.yesterdayAt, { time }) };
    if (diff < 7) {
      const day = fmt.date(d, { weekday: "long" });
      return { short: day, long: interpolate(t.weekdayAt, { day, time }) };
    }
    const md = fmt.date(d, { month: "short", day: "numeric" });
    return { short: md, long: md };
  };

  const live = notes.filter((n) => !n.deleted);
  const inFolder = (n: Note) => (folder === "trash" ? n.deleted : !n.deleted && (folder === "all" || n.folderId === folder));
  const q = query.trim().toLowerCase();
  const matches = (n: Note) => !q || n.title.toLowerCase().includes(q) || preview(n).toLowerCase().includes(q);
  const visible = notes.filter((n) => inFolder(n) && matches(n)).sort((a, z) => z.updatedAt.localeCompare(a.updatedAt));
  const pinned = folder === "trash" ? [] : visible.filter((n) => n.pinned);
  const rest = folder === "trash" ? visible : visible.filter((n) => !n.pinned);
  const note = notes.find((n) => n.id === selectedId) ?? null;
  const folderName = (id: string) => (id === "all" ? t.allNotes : id === "trash" ? t.trash : (folders.find((f) => f.id === id)?.name ?? t.notes));

  /** Applies a change to a note, stamps it and reports the result. */
  const touch = (id: string, patch: (n: Note) => Partial<Note>) => {
    const current = notes.find((n) => n.id === id);
    if (!current) return;
    const next = { ...current, ...patch(current), updatedAt: now().toISOString() };
    setNotes((all) => all.map((n) => (n.id === id ? next : n)));
    onChange?.(next);
  };
  const setBlocks = (fn: (blocks: NoteBlock[]) => NoteBlock[]) => {
    if (note) touch(note.id, (n) => ({ blocks: fn(n.blocks) }));
  };
  const patchBlock = (id: string, patch: Partial<NoteBlock>) => setBlocks((bs) => bs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const open = (id: string) => {
    setSelectedId(id);
    setView("editor");
  };

  const create = useAction(onCreate ?? noCreate, {
    onSuccess: (created) => {
      setNotes((all) => [created, ...all.filter((n) => n.id !== created.id)]);
      if (folder === "trash") setFolder("all");
      setQuery("");
      setSelectedId(created.id);
      setView("editor");
      setPending({ id: "title", at: "end" });
    },
  });
  const newNote = onCreate ? () => create.run({ folderId: folder === "all" || folder === "trash" ? (folders[0]?.id ?? "") : folder }) : undefined;
  const removeNote = (id: string) => {
    touch(id, () => ({ deleted: true, pinned: false }));
    setUndo({ id });
    setSelectedId(visible.find((n) => n.id !== id)?.id ?? null);
    setView("list");
  };
  const restore = (id: string) => {
    touch(id, () => ({ deleted: false }));
    setUndo(null);
  };
  const convert = (id: string, type: NoteBlockType) => {
    patchBlock(id, { type, done: type === "todo" ? false : undefined });
    setPending({ id, at: "end" });
  };

  const onBlockKey = (e: KeyboardEvent<HTMLTextAreaElement>, block: NoteBlock, index: number) => {
    if (!note) return;
    const el = e.currentTarget;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const listy = block.type === "todo" || block.type === "bullet";
      if (listy && !block.text.trim()) {
        convert(block.id, "p");
        return;
      }
      const before = block.text.slice(0, el.selectionStart);
      const after = block.text.slice(el.selectionEnd);
      const id = uid("b");
      const type: NoteBlockType = listy ? block.type : "p";
      setBlocks((bs) => {
        const copy = bs.map((x) => (x.id === block.id ? { ...x, text: before } : x));
        copy.splice(index + 1, 0, { id, type, text: after, done: type === "todo" ? false : undefined });
        return copy;
      });
      setPending({ id, at: "start" });
    } else if (e.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0) {
      if (block.type !== "p") {
        e.preventDefault();
        convert(block.id, "p");
        return;
      }
      const prev = note.blocks[index - 1];
      if (!prev) {
        if (!block.text) {
          e.preventDefault();
          setPending({ id: "title", at: "end" });
        }
        return;
      }
      e.preventDefault();
      const caret = prev.text.length;
      setBlocks((bs) => bs.filter((x) => x.id !== block.id).map((x) => (x.id === prev.id ? { ...x, text: x.text + block.text } : x)));
      requestAnimationFrame(() => {
        const p = blockRefs.current.get(prev.id);
        if (p) {
          p.focus();
          p.setSelectionRange(caret, caret);
        }
      });
    } else if (e.key === "ArrowUp" && el.selectionStart === 0 && index > 0) {
      const prev = note.blocks[index - 1];
      if (prev) {
        e.preventDefault();
        setPending({ id: prev.id, at: "end" });
      }
    } else if (e.key === "ArrowDown" && el.selectionStart === el.value.length) {
      const next = note.blocks[index + 1];
      if (next) {
        e.preventDefault();
        setPending({ id: next.id, at: "start" });
      }
    }
  };

  // Markdown-style shortcuts at the start of a text block change its type.
  const onBlockChange = (block: NoteBlock, text: string) => {
    if (block.type === "p") {
      const hit = SHORTCUTS.find(([s]) => text.startsWith(s));
      if (hit) {
        patchBlock(block.id, { type: hit[1], text: text.slice(hit[0].length), done: hit[1] === "todo" ? false : undefined });
        return;
      }
    }
    patchBlock(block.id, { text });
  };

  const focusedType = note?.blocks.find((x) => x.id === focusedBlock)?.type;
  const stats = note ? todoStats(note) : { done: 0, total: 0 };
  const words = note ? `${note.title} ${preview(note)}`.split(/\s+/).filter((w) => /\w/.test(w)).length : 0;
  const folderEntries = [
    { id: "all", name: t.allNotes, icon: <NotebookPenIcon />, count: live.length },
    ...folders.map((f) => ({ id: f.id, name: f.name, icon: <span className={cn("size-2 rounded-full", tones[f.tone])} />, count: live.filter((n) => n.folderId === f.id).length })),
    { id: "trash", name: t.trash, icon: <Trash2Icon />, count: notes.length - live.length },
  ];

  const folderList = (
    <nav aria-label={t.folders} className="flex flex-col gap-0.5">
      {folderEntries.map((f) => {
        const active = folder === f.id;
        return (
          <button
            aria-current={active ? "page" : undefined}
            className={cn("relative flex h-8 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-start [&_svg]:size-4 [&_svg]:opacity-80", ring, press, active ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground", f.id === "trash" && "mt-3")}
            key={f.id}
            onClick={() => {
              setFolder(f.id);
              setQuery("");
            }}
            type="button"
          >
            {active ? <motion.span className="absolute inset-0 -z-10 rounded-lg bg-accent" layoutId="notes-folder" transition={reduce ? { duration: 0 } : spring} /> : null}
            <span aria-hidden className="flex size-4 items-center justify-center">
              {f.icon}
            </span>
            <span className="flex-1 truncate">{f.name}</span>
            <span className="text-muted-foreground text-xs tabular-nums">{f.count}</span>
          </button>
        );
      })}
    </nav>
  );

  const noteRow = (n: Note) => {
    const s = todoStats(n);
    const active = n.id === selectedId;
    const f = folders.find((x) => x.id === n.folderId);
    return (
      <motion.li exit={{ opacity: 0, transition: { duration: 0.12 } }} initial={false} key={n.id} layout={reduce ? false : "position"} layoutId={`note-${n.id}`} transition={spring}>
        <button aria-current={active || undefined} className={cn("group/note relative flex w-full cursor-pointer flex-col gap-1 rounded-xl px-3 py-2.5 text-start transition-colors", ring, active ? "bg-accent" : "hover:bg-accent/50")} onClick={() => open(n.id)} type="button">
          <span className="flex items-center gap-2">
            <span className={cn("min-w-0 flex-1 truncate font-medium", !n.title && "text-muted-foreground")}>
              <Highlight query={query} text={n.title || t.untitled} />
            </span>
            {s.total > 0 ? (
              <span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs tabular-nums">
                <ProgressRing done={s.done} total={s.total} />
                {s.done}/{s.total}
              </span>
            ) : null}
          </span>
          <span className="line-clamp-2 text-muted-foreground text-xs leading-5">
            <span className="me-1.5 font-medium text-foreground/80 tabular-nums">{relDate(n.updatedAt).short}</span>
            <Highlight query={query} text={excerpt(preview(n), query) || t.noText} />
          </span>
          {folder === "all" && f ? (
            <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <span aria-hidden className={cn("size-1.5 rounded-full", tones[f.tone])} />
              {f.name}
            </span>
          ) : null}
        </button>
      </motion.li>
    );
  };

  const emptyList = q ? (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span aria-hidden className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <SearchIcon className="size-4.5" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-balance font-medium">{interpolate(t.noMatch, { query: query.trim() })}</span>
        <span className="text-muted-foreground text-xs">{interpolate(t.searching, { folder: folderName(folder).toLowerCase() })}</span>
      </div>
      {folder !== "all" ? (
        <Button className={press} onClick={() => setFolder("all")} size="sm" variant="outline">
          {t.searchAll}
        </Button>
      ) : null}
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span aria-hidden className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        {folder === "trash" ? <Trash2Icon className="size-4.5" /> : <FolderIcon className="size-4.5" />}
      </span>
      <div className="flex flex-col gap-1">
        <span className="font-medium">{folder === "trash" ? t.nothingDeleted : t.nothingHere}</span>
        <span className="text-pretty text-muted-foreground text-xs">{folder === "trash" ? t.deletedHint : t.emptyHint}</span>
      </div>
      {folder !== "trash" && newNote ? (
        <Button className={press} onClick={newNote} size="sm" variant="outline">
          <SquarePenIcon /> {t.newNote}
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className={cn("@container relative isolate flex h-svh w-full overflow-hidden bg-background text-foreground text-sm", className)}>
      <aside className="hidden w-56 shrink-0 flex-col gap-5 border-e bg-muted/40 p-3 @5xl:flex">
        <div className="flex items-center gap-2.5 px-1.5 pt-1">
          <span aria-hidden className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <NotebookPenIcon className="size-4" />
          </span>
          <span className="font-heading font-semibold">{t.app}</span>
        </div>
        {folderList}
      </aside>

      <section aria-label={t.notes} className={cn("min-w-0 flex-1 flex-col border-e @3xl:flex @3xl:w-80 @3xl:flex-none", view === "list" ? "flex" : "hidden")}>
        <div className="flex h-14 shrink-0 items-center gap-2 px-3">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn("flex h-8 min-w-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 font-heading font-semibold text-base hover:bg-accent data-popup-open:bg-accent @5xl:pointer-events-none @5xl:px-1", ring)}>
              <span className="truncate">{folderName(folder)}</span>
              <ChevronDownIcon aria-hidden className="size-4 shrink-0 text-muted-foreground @5xl:hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className={cn("w-56", menuPop)}>
              <DropdownMenuRadioGroup onValueChange={(v) => setFolder(v as string)} value={folder}>
                <DropdownMenuRadioItem value="all">{t.allNotes}</DropdownMenuRadioItem>
                {folders.map((f) => (
                  <DropdownMenuRadioItem key={f.id} value={f.id}>
                    <span className="flex items-center gap-2">
                      <span aria-hidden className={cn("size-2 rounded-full", tones[f.tone])} />
                      {f.name}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
                <DropdownMenuRadioItem value="trash">{t.trash}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-muted-foreground text-xs tabular-nums">{visible.length}</span>
          {newNote ? (
            <Button aria-label={t.newNote} className={cn("ms-auto", press)} disabled={create.isPending()} onClick={newNote} size="icon-sm" variant="ghost">
              <SquarePenIcon />
            </Button>
          ) : null}
        </div>
        <div className="px-3 pb-2">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-label={t.search}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("");
              }}
              placeholder={t.searchPlaceholder}
              value={query}
            />
            {query ? (
              <InputGroupAddon align="inline-end">
                <Button aria-label={t.clearSearch} onClick={() => setQuery("")} size="icon-xs" variant="ghost">
                  <XIcon />
                </Button>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </div>
        {create.error ? (
          <p className="mx-3 mb-2 text-destructive text-xs" role="alert">
            {create.error}
          </p>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6">
          {visible.length === 0 ? (
            emptyList
          ) : (
            <LayoutGroup id="notes-list">
              {pinned.length > 0 ? (
                <>
                  <h3 className="flex items-center gap-1.5 px-3 pt-2 pb-1 font-medium text-muted-foreground text-xs">
                    <PinIcon aria-hidden className="size-3" /> {t.pinned}
                  </h3>
                  <ul className="flex flex-col gap-0.5">
                    <AnimatePresence initial={false}>{pinned.map(noteRow)}</AnimatePresence>
                  </ul>
                </>
              ) : null}
              {rest.length > 0 ? (
                <>
                  {pinned.length > 0 ? <h3 className="px-3 pt-4 pb-1 font-medium text-muted-foreground text-xs">{t.notes}</h3> : null}
                  <ul className="flex flex-col gap-0.5">
                    <AnimatePresence initial={false}>{rest.map(noteRow)}</AnimatePresence>
                  </ul>
                </>
              ) : null}
            </LayoutGroup>
          )}
        </div>
      </section>

      <section aria-label={t.editor} className={cn("min-w-0 flex-1 flex-col @3xl:flex", view === "editor" ? "flex" : "hidden")}>
        {note ? (
          <>
            <div className="flex h-14 shrink-0 items-center gap-1 px-3">
              <Button className="-ms-1 @3xl:hidden" onClick={() => setView("list")} size="sm" variant="ghost">
                <ChevronLeftIcon className="rtl:-scale-x-100" /> {folderName(folder)}
              </Button>
              <div className="hidden min-w-0 items-center gap-1.5 text-muted-foreground text-xs @3xl:flex">
                {note.deleted ? (
                  <span>{t.inTrash}</span>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger className={cn("flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-1.5 hover:bg-accent hover:text-foreground data-popup-open:bg-accent", ring)}>
                      <span aria-hidden className={cn("size-1.5 rounded-full", tones[folders.find((f) => f.id === note.folderId)?.tone ?? "amber"])} />
                      {folderName(note.folderId)}
                      <ChevronDownIcon aria-hidden className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className={cn("w-48", menuPop)}>
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>{t.moveTo}</DropdownMenuLabel>
                        <DropdownMenuRadioGroup onValueChange={(v) => touch(note.id, () => ({ folderId: v as string }))} value={note.folderId}>
                          {folders.map((f) => (
                            <DropdownMenuRadioItem key={f.id} value={f.id}>
                              <span className="flex items-center gap-2">
                                <span aria-hidden className={cn("size-2 rounded-full", tones[f.tone])} />
                                {f.name}
                              </span>
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <span aria-hidden>·</span>
                <span className="truncate tabular-nums">{interpolate(t.edited, { when: relDate(note.updatedAt).long })}</span>
              </div>
              <div className="ms-auto flex items-center gap-0.5">
                {note.deleted ? (
                  <Button className={press} onClick={() => restore(note.id)} size="sm" variant="outline">
                    <RotateCcwIcon /> {t.restore}
                  </Button>
                ) : (
                  <>
                    <div aria-label={t.formatting} className="flex items-center gap-0.5" role="toolbar">
                      {BLOCK_ORDER.map((type) => {
                        const active = focusedType === type;
                        const label = t[`block_${type}`];
                        return (
                          <button
                            aria-label={interpolate(t.turnInto, { type: label.toLowerCase() })}
                            aria-pressed={active}
                            className={cn("relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg sm:size-7 [&_svg]:size-4", ring, press, active ? "text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground", "disabled:pointer-events-none disabled:opacity-40")}
                            disabled={!focusedBlock}
                            key={type}
                            onClick={() => focusedBlock && convert(focusedBlock, type)}
                            onMouseDown={(e) => e.preventDefault()}
                            title={label}
                            type="button"
                          >
                            {active ? <motion.span className="absolute inset-0 rounded-lg bg-accent" layoutId="notes-blocktype" transition={reduce ? { duration: 0 } : spring} /> : null}
                            <span aria-hidden className="relative flex">
                              {blockIcon[type]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <span aria-hidden className="mx-1.5 h-4 w-px bg-border" />
                    <Button aria-label={note.pinned ? t.unpin : t.pin} aria-pressed={Boolean(note.pinned)} className={cn(press, note.pinned && "text-foreground")} onClick={() => touch(note.id, (n) => ({ pinned: !n.pinned }))} size="icon-sm" variant="ghost">
                      <motion.span animate={{ scale: 1 }} className="flex" initial={reduce ? false : { scale: 0.8 }} key={String(note.pinned)} transition={{ duration: 0.18, ease: easeOut }}>
                        <PinIcon className={cn(note.pinned && "fill-current")} />
                      </motion.span>
                    </Button>
                    <Button aria-label={t.delete} className={press} onClick={() => removeNote(note.id)} size="icon-sm" variant="ghost">
                      <Trash2Icon />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <motion.article animate={{ opacity: 1 }} className="mx-auto flex max-w-2xl flex-col px-5 pt-6 pb-24 @3xl:px-12 @3xl:pt-10" initial={reduce ? false : { opacity: 0 }} key={note.id} transition={{ duration: 0.12, ease: "easeOut" }}>
                <AutoText
                  aria-label={t.title}
                  className="font-heading font-semibold text-2xl tracking-tight @3xl:text-3xl"
                  inputRef={(el) => {
                    titleRef.current = el;
                  }}
                  onChange={(e) => touch(note.id, () => ({ title: e.target.value.replace(/\n/g, "") }))}
                  onFocus={() => setFocusedBlock(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || (e.key === "ArrowDown" && e.currentTarget.selectionStart === e.currentTarget.value.length)) {
                      e.preventDefault();
                      if (note.blocks[0]) setPending({ id: note.blocks[0].id, at: "start" });
                    }
                  }}
                  placeholder={t.title}
                  readOnly={note.deleted}
                  value={note.title}
                />
                <div className="mt-2 mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-5 text-muted-foreground text-xs">
                  <span className="tabular-nums">{interpolate(t.words, { count: words })}</span>
                  {stats.total > 0 ? (
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <ProgressRing done={stats.done} total={stats.total} />
                      {interpolate(t.todosDone, { done: stats.done, total: stats.total })}
                    </span>
                  ) : null}
                  <span className="tabular-nums @3xl:hidden">{interpolate(t.edited, { when: relDate(note.updatedAt).long })}</span>
                </div>
                {note.blocks.map((block, i) => {
                  const prevType = note.blocks[i - 1]?.type;
                  const spacing = block.type === "h1" ? "mt-5" : block.type === "h2" ? (i === 0 ? "" : "mt-5 mb-0.5") : (block.type === "todo" || block.type === "bullet") && prevType === block.type ? "mt-0.5" : i === 0 ? "" : "mt-2";
                  const placeholder = note.blocks.length === 1 && block.type === "p" ? t.startHint : block.type === "todo" ? t.todo : block.type === "bullet" ? t.listItem : block.type === "p" ? "" : t.heading;
                  return (
                    <div className={cn("flex items-start gap-2.5", spacing)} key={block.id}>
                      {block.type === "todo" ? (
                        <CheckBox checked={Boolean(block.done)} disabled={note.deleted} label={block.text || t.todo} onToggle={() => patchBlock(block.id, { done: !block.done })} />
                      ) : block.type === "bullet" ? (
                        <span aria-hidden className="flex h-7 w-4.5 shrink-0 items-center justify-center">
                          <span className="size-1.5 rounded-full bg-foreground/60" />
                        </span>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <AutoText
                          aria-label={block.type === "todo" ? t.checklistItem : block.type === "bullet" ? t.bullet : block.type === "p" ? t.text : t.heading}
                          className={cn(blockStyles[block.type], block.type === "todo" && block.done && "text-muted-foreground line-through decoration-muted-foreground/50", "transition-colors duration-200")}
                          inputRef={(el) => {
                            if (el) blockRefs.current.set(block.id, el);
                            else blockRefs.current.delete(block.id);
                          }}
                          onBlur={() => setFocusedBlock((f) => (f === block.id ? null : f))}
                          onChange={(e) => onBlockChange(block, e.target.value)}
                          onFocus={() => setFocusedBlock(block.id)}
                          onKeyDown={(e) => onBlockKey(e, block, i)}
                          placeholder={placeholder}
                          readOnly={note.deleted}
                          value={block.text}
                        />
                      </div>
                    </div>
                  );
                })}
                {note.deleted ? null : (
                  <button
                    aria-label={t.addLine}
                    className="mt-2 h-16 w-full cursor-text"
                    onClick={() => {
                      const last = note.blocks.at(-1);
                      if (last && !last.text.trim()) {
                        setPending({ id: last.id, at: "end" });
                        return;
                      }
                      const id = uid("b");
                      setBlocks((bs) => [...bs, { id, type: "p", text: "" }]);
                      setPending({ id, at: "start" });
                    }}
                    tabIndex={-1}
                    type="button"
                  />
                )}
              </motion.article>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <span aria-hidden className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <NotebookPenIcon className="size-4.5" />
            </span>
            <span className="font-medium">{t.noneSelected}</span>
            {newNote ? (
              <Button className={press} onClick={newNote} size="sm" variant="outline">
                <SquarePenIcon /> {t.newNote}
              </Button>
            ) : null}
          </div>
        )}
      </section>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center px-3">
        <AnimatePresence>
          {undo ? (
            <motion.div animate={{ y: 0, opacity: 1, scale: 1 }} className="pointer-events-auto flex items-center gap-1 rounded-full bg-primary p-1 ps-4 text-primary-foreground shadow-lg/15 dark:border dark:bg-popover dark:text-popover-foreground" exit={{ y: 8, opacity: 0, scale: 0.97, transition: { duration: 0.12, ease: easeOut } }} initial={reduce ? { opacity: 0 } : { y: 16, opacity: 0, scale: 0.96 }} role="status" transition={reduce ? { duration: 0.15 } : spring}>
              <span className="pe-2">{t.movedToTrash}</span>
              <button
                className={cn("flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 outline-none hover:bg-primary-foreground/12 focus-visible:ring-2 focus-visible:ring-primary-foreground/40 dark:focus-visible:ring-ring dark:hover:bg-accent", press)}
                onClick={() => {
                  restore(undo.id);
                  setSelectedId(undo.id);
                }}
                type="button"
              >
                <Undo2Icon aria-hidden className="size-3.5 opacity-80" /> {t.undo}
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Notes(props: NotesProps) {
  return (
    <ScreenBoundary name="Notes">
      <NotesScreen {...props} />
    </ScreenBoundary>
  );
}

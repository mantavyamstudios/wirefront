// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `folder-view`).
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Checkbox } from "@wirefront/ui/checkbox";
import { cn } from "@wirefront/ui/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@wirefront/ui/tooltip";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { type Action, fail } from "@wirefront/ui/wirefront/types";
import { ArrowLeftIcon, CheckIcon, ChevronRightIcon, CloudUploadIcon, DownloadIcon, FileIcon, FilePlusIcon, FileTextIcon, FilmIcon, FolderInputIcon, ImageIcon, LayoutGridIcon, ListIcon, type LucideIcon, PlayIcon, PlusIcon, PresentationIcon, Share2Icon, SheetIcon, Trash2Icon, XIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FolderFile, FolderFileKind, FolderMember, SubFolder } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("folderView.<key>"). */
export const FOLDER_VIEW_MESSAGES = {
  kind_doc: "Doc",
  kind_sheet: "Sheet",
  kind_image: "Image",
  kind_slides: "Slides",
  kind_pdf: "PDF",
  kind_video: "Video",
  places: "Drive",
  folders: "Folders",
  storage: "Storage",
  storageUsed: "{used} of {total} used",
  breadcrumb: "Breadcrumb",
  backTo: "Back to {name}",
  share: "Share",
  upload: "Upload",
  filesOne: "1 file",
  filesMany: "{count} files",
  foldersCount: "{count} folders",
  sharedWith: "shared with {count}",
  selectAll: "Select all",
  noFiles: "No files yet",
  fileType: "File type",
  all: "All",
  layout: "Layout",
  gridView: "Grid view",
  listView: "List view",
  empty: "Empty",
  folder: "Folder",
  fileLabel: "{name}, {kind}, {size}",
  colName: "Name",
  colType: "Type",
  colEditedBy: "Edited by",
  colEdited: "Edited",
  colSize: "Size",
  you: "You",
  isEmpty: "{name} is empty",
  emptyHint: "Drop files anywhere on this page, or start a doc here. Everyone in the folder will see it.",
  uploadFiles: "Upload files",
  newDoc: "New doc",
  bulk: "Bulk actions",
  selected: "selected",
  move: "Move",
  download: "Download",
  delete: "Delete",
  clearSelection: "Clear selection",
  trashedOne: "Moved 1 file to trash",
  trashedMany: "Moved {count} files to trash",
  added: "Added {name} to {folder}",
  dismiss: "Dismiss",
  duration: "1:42",
  artLogo: "orb",
  artType: "Aa",
};
type Messages = typeof FOLDER_VIEW_MESSAGES;

export interface FolderViewProps {
  workspace: string;
  /** Ancestors of this folder; each links when it has an href. */
  path: { label: string; href?: string }[];
  name: string;
  files: FolderFile[];
  folders?: SubFolder[];
  members: FolderMember[];
  /** The signed-in member's id. */
  me: string;
  storage?: { usedGb: number; totalGb: number };
  /** Links in the sidebar, e.g. All files, Recent, Shared, Trash. */
  places?: { label: string; href: string; icon?: ReactNode }[];
  defaultView?: "grid" | "list";
  /** Starts an upload into a folder ("root" for this folder); update `files` as uploads land. */
  onUpload?: (folderId: string) => void;
  /** Creates a blank doc and returns it. Hidden without it. */
  onNewDoc?: Action<{ folderId: string }, FolderFile>;
  /** Moves files to the trash; they leave at once and come back if this fails. */
  onDelete?: Action<{ folderId: string; ids: string[] }>;
  /** Each shows its control only when given. */
  onShareFolder?: (folderId: string) => void;
  onShare?: (ids: string[]) => void;
  onMove?: (ids: string[]) => void;
  onDownload?: (ids: string[]) => void;
  className?: string;
}

const KINDS: FolderFileKind[] = ["doc", "sheet", "image", "slides", "pdf", "video"];
const spring = { type: "spring", stiffness: 420, damping: 36 } as const;
const easeOut = [0.23, 1, 0.32, 1] as const;
const press = "transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.97]";
const avatarTone: Record<FolderMember["tone"], string> = {
  orange: "bg-category-7/16 text-category-7-foreground",
  teal: "bg-category-6/16 text-category-6-foreground",
  blue: "bg-category-1/16 text-category-1-foreground",
  violet: "bg-category-5/18 text-category-5-foreground",
  rose: "bg-category-4/16 text-category-4-foreground",
  lime: "bg-category-2/16 text-category-2-foreground",
};
const kindDot: Record<FolderFileKind, string> = { doc: "bg-category-1", sheet: "bg-category-2", image: "bg-category-7", slides: "bg-category-5", pdf: "bg-category-4", video: "bg-category-4" };
const kindIcon: Record<FolderFileKind, { icon: LucideIcon; tint: string }> = {
  doc: { icon: FileTextIcon, tint: "bg-category-1/12 text-category-1-foreground" },
  sheet: { icon: SheetIcon, tint: "bg-category-2/12 text-category-2-foreground" },
  image: { icon: ImageIcon, tint: "bg-category-7/12 text-category-7-foreground" },
  slides: { icon: PresentationIcon, tint: "bg-category-5/12 text-category-5-foreground" },
  pdf: { icon: FileIcon, tint: "bg-category-4/12 text-category-4-foreground" },
  video: { icon: FilmIcon, tint: "bg-category-4/12 text-category-4-foreground" },
};
const noDoc: Action<{ folderId: string }, FolderFile> = async () => fail();
const rows = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

function ImageArt({ art = "photo", t }: { art?: FolderFile["art"]; t: Messages }) {
  if (art === "logos") {
    return (
      <div className="absolute inset-0 grid grid-cols-2 gap-1.5 p-3">
        <span className="flex items-center justify-center rounded-lg bg-category-7">
          <span className="size-5 rounded-full border-4 border-white" />
        </span>
        <span className="flex items-center justify-center rounded-lg bg-card ring-1 ring-border">
          <span className="size-4 rotate-45 rounded-[5px] border-[3px] border-category-7" />
        </span>
        <span className="flex items-center justify-center rounded-lg bg-foreground dark:ring-1 dark:ring-border">
          <span className="font-heading font-semibold text-category-7 text-sm tracking-tight">{t.artLogo}</span>
        </span>
        <span className="flex items-center justify-center rounded-lg bg-category-7/12">
          <span className="flex gap-0.5">
            <span className="size-2.5 rounded-full bg-category-7-strong" />
            <span className="size-2.5 rounded-full bg-category-7-strong/40" />
          </span>
        </span>
      </div>
    );
  }
  if (art === "moodboard") {
    return (
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1.5 p-3">
        <span className="row-span-2 rounded-lg bg-linear-to-b from-category-3/35 via-category-7/60 to-category-4" />
        <span className="rounded-lg bg-linear-to-br from-category-4/20 to-category-7/35" />
        <span className="flex items-end rounded-lg bg-foreground p-1.5 dark:ring-1 dark:ring-border">
          <span className="font-heading font-semibold text-[11px] text-category-3 leading-none">{t.artType}</span>
        </span>
        <span className="col-span-2 flex overflow-hidden rounded-lg">
          {["bg-category-3/20", "bg-category-7/60", "bg-category-4", "bg-category-4-strong", "bg-foreground"].map((c) => (
            <span className={cn("flex-1", c)} key={c} />
          ))}
        </span>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 bg-linear-to-b from-category-1/35 to-category-3/12">
      <span className="absolute inset-e-6 top-4 size-6 rounded-full bg-category-3/7" />
      <span className="absolute inset-x-0 bottom-0 h-2/5 bg-category-2-strong/80 [clip-path:polygon(0_40%,30%_10%,60%_45%,100%_0,100%_100%,0_100%)]" />
    </div>
  );
}

function Preview({ kind, art, t }: { kind: FolderFileKind; art?: FolderFile["art"]; t: Messages }) {
  const line = "h-1 rounded-full bg-muted-foreground/20";
  switch (kind) {
    case "doc":
      return (
        <div className="absolute inset-x-5 top-4 bottom-0 flex flex-col gap-1.5 rounded-t-md bg-card px-3.5 pt-3.5 shadow-xs/5 ring-1 ring-border">
          <span className="h-1.5 w-2/3 rounded-full bg-foreground/56" />
          <span className="mb-1 h-1 w-1/3 rounded-full bg-muted-foreground/24" />
          {(
            [
              ["a", 94],
              ["b", 88],
              ["c", 92],
              ["d", 70],
              ["e", 0],
              ["f", 90],
              ["g", 84],
            ] as const
          ).map(([k, w]) => (w ? <span className={line} key={k} style={{ width: `${w}%` }} /> : <span className="h-1" key={k} />))}
        </div>
      );
    case "sheet":
      return (
        <div className="absolute inset-x-5 top-4 bottom-0 overflow-hidden rounded-t-md bg-card shadow-xs/5 ring-1 ring-border">
          <div className="grid grid-cols-[1.4rem_repeat(4,1fr)] gap-px bg-border">
            {rows("c", 35).map((cell, i) => {
              const row = Math.floor(i / 5);
              const col = i % 5;
              return <span className={cn("h-3.5", row === 0 || col === 0 ? "bg-muted" : "bg-card", col === 3 && row > 0 && "bg-success/16", row === 3 && col === 3 && "bg-success/40")} key={cell} />;
            })}
          </div>
        </div>
      );
    case "image":
      return <ImageArt art={art} t={t} />;
    case "slides":
      return (
        <div className="absolute inset-x-4 top-1/2 flex aspect-video -translate-y-1/2 flex-col justify-end gap-1.5 overflow-hidden rounded-md bg-card p-3 shadow-xs/5 ring-1 ring-border">
          <span className="absolute inset-e-3 top-3 size-6 rounded-full bg-category-5/48" />
          <span className="h-2 w-3/5 rounded-full bg-foreground/64" />
          <span className="h-1 w-2/5 rounded-full bg-muted-foreground/28" />
        </div>
      );
    case "pdf":
      return (
        <div className="absolute inset-x-6 top-4 bottom-0 flex flex-col gap-1.5 rounded-t-md bg-card px-3.5 pt-4 shadow-xs/5 ring-1 ring-border">
          <span className="absolute inset-e-2.5 top-2.5 rounded-[3px] bg-category-4-strong px-1 font-bold text-[8px] text-white">{t.kind_pdf}</span>
          <span className="font-heading font-semibold text-foreground/80 text-lg leading-none">{t.artType}</span>
          <span className="h-1 w-1/2 rounded-full bg-muted-foreground/24" />
          <span className="mt-1 grid grid-cols-6 gap-1">
            {rows("p", 12).map((cell) => (
              <span className="h-2.5 rounded-sm bg-muted" key={cell} />
            ))}
          </span>
        </div>
      );
    case "video":
      return (
        <div className="absolute inset-0 overflow-hidden bg-foreground">
          <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,var(--category-8)_0%,transparent_60%)] opacity-50" />
          <span className="absolute inset-e-4 inset-s-1/2 top-4 aspect-video rounded-sm bg-linear-to-br from-category-7/60 to-category-4 opacity-90" />
          <svg aria-hidden="true" className="absolute inset-s-[18%] bottom-0 h-3/5 text-muted-foreground" viewBox="0 0 40 60">
            <circle cx="20" cy="14" fill="currentColor" r="8" />
            <path d="M4 60c0-18 7-28 16-28s16 10 16 28Z" fill="currentColor" />
          </svg>
          <span className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-xs/5">
            <PlayIcon className="ms-0.5 size-4 fill-current" />
          </span>
          <span className="absolute inset-x-2 bottom-1.5 h-0.5 rounded-full bg-white/24">
            <span className="block h-full w-1/3 rounded-full bg-white/80" />
          </span>
          <span className="absolute inset-e-2 bottom-3 rounded bg-black/60 px-1 font-mono text-[10px] text-white tabular-nums">{t.duration}</span>
        </div>
      );
  }
}

const rollVariants = { from: (d: number) => ({ y: d * 12, opacity: 0 }), in: { y: 0, opacity: 1 }, out: (d: number) => ({ y: d * -12, opacity: 0 }) };

function RollingCount({ value }: { value: number }) {
  const prev = useRef(value);
  const dir = value >= prev.current ? 1 : -1;
  useEffect(() => {
    prev.current = value;
  }, [value]);
  return (
    <span className="relative inline-flex h-5 min-w-[1ch] justify-end overflow-hidden tabular-nums">
      <AnimatePresence custom={dir} initial={false} mode="popLayout">
        <motion.span animate="in" custom={dir} exit="out" initial="from" key={value} transition={{ duration: 0.2, ease: easeOut }} variants={rollVariants}>
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function CheckMark({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={cn("inline-flex size-4.5 shrink-0 items-center justify-center rounded-xs border shadow-xs/5 sm:size-4", on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background dark:bg-input/32")}>
      {on ? <CheckIcon className="size-3.5 sm:size-3" strokeWidth={3} /> : null}
    </span>
  );
}

function FolderGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={cn("shrink-0", className)} fill="none" viewBox="0 0 20 16">
      <path d="M0 2.5A2.5 2.5 0 0 1 2.5 0h4.3a2 2 0 0 1 1.5.7L9.6 2.2h7.9A2.5 2.5 0 0 1 20 4.7v8.8a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 0 13.5Z" fill="currentColor" opacity="0.4" />
      <path d="M0 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7.5a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 0 13.5Z" fill="currentColor" />
    </svg>
  );
}

function EmptyFolder({ name, onUpload, onNewDoc, t }: { name: string; onUpload?: () => void; onNewDoc?: () => void; t: Messages }) {
  const ghost = [
    { kind: "doc" as const, rotate: -10, x: -64, y: 10 },
    { kind: "image" as const, rotate: 8, x: 64, y: 12 },
    { kind: "sheet" as const, rotate: 0, x: 0, y: 0 },
  ];
  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className="flex h-full flex-col items-center justify-center px-6 pb-10 text-center" exit={{ opacity: 0, y: 6 }} initial={{ opacity: 0, y: 6 }} transition={{ duration: 0.2, ease: easeOut }}>
      <div aria-hidden className="relative mb-8 h-36 w-64">
        {ghost.map((g, i) => (
          <motion.div animate={{ rotate: g.rotate, x: g.x, y: g.y, opacity: 1, scale: 1 }} className="absolute top-0 left-1/2 -ms-14 h-32 w-28 overflow-hidden rounded-xl border bg-card shadow-sm/5" initial={{ rotate: 0, x: 0, y: 12, opacity: 0, scale: 0.95 }} key={g.kind} transition={{ ...spring, delay: 0.05 + 0.04 * i }}>
            <span className="absolute inset-0 bg-muted/60 dark:bg-muted" />
            <div className="absolute inset-0 opacity-72 grayscale-[0.4]">
              <Preview art="moodboard" kind={g.kind} t={t} />
            </div>
          </motion.div>
        ))}
        <span className="absolute -bottom-3 left-1/2 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border bg-background shadow-xs/5">
          <PlusIcon className="size-4" />
        </span>
      </div>
      <h2 className="text-balance font-heading font-semibold text-lg">{interpolate(t.isEmpty, { name })}</h2>
      <p className="mt-1 max-w-xs text-pretty text-muted-foreground">{t.emptyHint}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onUpload ? (
          <Button className={press} onClick={onUpload} variant="outline">
            <CloudUploadIcon />
            {t.uploadFiles}
          </Button>
        ) : null}
        {onNewDoc ? (
          <Button className={press} onClick={onNewDoc}>
            <FilePlusIcon />
            {t.newDoc}
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}

function FolderViewScreen({ workspace, path, name, files: rootFiles, folders = [], members, me, storage, places = [], defaultView = "grid", onUpload, onNewDoc, onDelete, onShareFolder, onShare, onMove, onDownload, className }: FolderViewProps) {
  const t = useMessages("folderView", FOLDER_VIEW_MESSAGES);
  const fmt = useFormat();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(defaultView);
  const fromProps = useMemo(() => ({ root: rootFiles, ...Object.fromEntries(folders.map((f) => [f.id, f.files])) }) as Record<string, FolderFile[]>, [rootFiles, folders]);
  const [contents, setContents] = useState(fromProps);
  useEffect(() => setContents(fromProps), [fromProps]);
  const [at, setAt] = useState("root");
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | FolderFileKind>("all");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const sub = folders.find((f) => f.id === at);
  const title = sub?.name ?? name;
  const files = contents[at] ?? [];
  const kinds = useMemo(() => KINDS.filter((k) => files.some((f) => f.kind === k)), [files]);
  const activeFilter = filter !== "all" && kinds.includes(filter) ? filter : "all";
  const visible = files.filter((f) => activeFilter === "all" || f.kind === activeFilter);
  const showFolders = !sub && activeFilter === "all" && folders.length > 0;
  const isEmpty = files.length === 0;
  const selecting = selected.length > 0;
  const allSelected = visible.length > 0 && visible.every((f) => selected.includes(f.id));
  const member = (mid: string) => members.find((m) => m.id === mid);
  const size = (bytes: number) => {
    const units: [string, number][] = [
      ["gigabyte", 1024 ** 3],
      ["megabyte", 1024 ** 2],
      ["kilobyte", 1024],
    ];
    for (const [unit, n] of units) if (bytes >= n) return fmt.number(bytes / n, { style: "unit", unit, maximumFractionDigits: bytes / n < 10 ? 1 : 0 });
    return fmt.number(bytes, { style: "unit", unit: "byte" });
  };
  const countFiles = (n: number) => (n === 1 ? t.filesOne : interpolate(t.filesMany, { count: n }));

  const open = (target: string) => {
    setAt(target);
    setSelected([]);
    setFilter("all");
  };
  const toggle = (fid: string) => setSelected((s) => (s.includes(fid) ? s.filter((x) => x !== fid) : [...s, fid]));

  const remove = useAction(onDelete ?? (async () => {}), {
    optimistic: ({ folderId, ids }) => {
      const before = contents[folderId] ?? [];
      setContents((c) => ({ ...c, [folderId]: (c[folderId] ?? []).filter((f) => !ids.includes(f.id)) }));
      setSelected([]);
      setToast(ids.length === 1 ? t.trashedOne : interpolate(t.trashedMany, { count: ids.length }));
      return () => setContents((c) => ({ ...c, [folderId]: before }));
    },
  });
  const newDoc = useAction(onNewDoc ?? noDoc, {
    onSuccess: (file, { folderId }) => {
      setContents((c) => ({ ...c, [folderId]: [file, ...(c[folderId] ?? [])] }));
      setToast(interpolate(t.added, { name: file.name, folder: title }));
    },
  });
  const error = remove.error ?? newDoc.error;
  const upload = onUpload ? () => onUpload(at) : undefined;
  const createDoc = onNewDoc ? () => newDoc.run({ folderId: at }) : undefined;

  // Escape clears the selection.
  const selectingRef = useRef(selecting);
  selectingRef.current = selecting;
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectingRef.current) setSelected([]);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  const grid = view === "grid";
  const listCols = "grid-cols-[1.75rem_minmax(0,1fr)_4.5rem] @2xl:grid-cols-[1.75rem_minmax(0,1fr)_5rem_6.5rem_6rem_4.5rem]";
  const usedPct = storage ? Math.min(100, (storage.usedGb / storage.totalGb) * 100) : 0;
  const gb = (n: number) => fmt.number(n, { style: "unit", unit: "gigabyte", maximumFractionDigits: 1 });
  const bulk: [string, LucideIcon, ((ids: string[]) => void) | undefined][] = [
    [t.share, Share2Icon, onShare],
    [t.move, FolderInputIcon, onMove],
    [t.download, DownloadIcon, onDownload],
  ];

  const fileCard = (f: FolderFile) => {
    const on = selected.includes(f.id);
    const editor = member(f.editedBy);
    return (
      <label aria-label={interpolate(t.fileLabel, { name: f.name, kind: t[`kind_${f.kind}`], size: size(f.sizeBytes) })} className={cn("group/file relative flex cursor-pointer select-none flex-col overflow-hidden rounded-xl border bg-card transition-[box-shadow,border-color,scale] duration-150 ease-out has-focus-visible:ring-2 has-focus-visible:ring-ring active:scale-[0.98]", on ? "border-foreground/40 ring-3 ring-foreground/8" : "hover:border-foreground/16 hover:shadow-xs/5")}>
        <input checked={on} className="sr-only" onChange={() => toggle(f.id)} type="checkbox" />
        <div className="relative h-28 overflow-hidden bg-muted/60 @md:h-32 dark:bg-muted/72">
          <motion.div animate={{ scale: on ? 0.94 : 1 }} aria-hidden className="absolute inset-0" transition={spring}>
            <Preview art={f.art} kind={f.kind} t={t} />
          </motion.div>
          <span className={cn("absolute inset-s-2 top-2 flex size-6 items-center justify-center rounded-md bg-background/88 shadow-xs/5 backdrop-blur transition-opacity duration-150", on || selecting ? "opacity-100" : "opacity-0 group-hover/file:opacity-100 group-has-focus-visible/file:opacity-100 pointer-coarse:opacity-100")}>
            <CheckMark on={on} />
          </span>
        </div>
        <div className="flex flex-col gap-1 border-t px-3 py-2.5">
          <span className="truncate font-medium">{f.name}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", kindDot[f.kind])} />
            <span className="truncate tabular-nums">
              {t[`kind_${f.kind}`]} · {size(f.sizeBytes)}
            </span>
            {editor ? (
              <Avatar aria-hidden className="ms-auto size-4 shrink-0">
                <AvatarFallback className={cn("font-medium text-[7px]", avatarTone[editor.tone])}>{editor.initials}</AvatarFallback>
              </Avatar>
            ) : null}
            <span className="hidden shrink-0 tabular-nums @md:inline">{fmt.relative(f.editedAt)}</span>
          </span>
        </div>
      </label>
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("@container relative flex h-svh w-full overflow-hidden bg-background text-foreground text-sm", className)} ref={rootRef}>
        <aside className="hidden w-56 shrink-0 flex-col border-e bg-muted/30 px-3 py-3 @3xl:flex">
          <div className="flex h-9 items-center gap-2 px-1.5">
            <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg aria-hidden="true" className="size-3.5" fill="none" viewBox="0 0 16 16">
                <path d="M2 9.5c2 2.7 10 2.7 12 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                <path d="M4 5h8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
              </svg>
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{workspace}</span>
          </div>
          {places.length ? (
            <nav aria-label={t.places} className="mt-4 flex flex-col gap-px">
              {places.map((p) => (
                <WirefrontLink className="flex h-8 items-center gap-2.5 rounded-md px-2 text-start text-muted-foreground outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:opacity-80" href={p.href} key={p.href}>
                  {p.icon ? <span aria-hidden className="contents">{p.icon}</span> : null}
                  {p.label}
                </WirefrontLink>
              ))}
            </nav>
          ) : null}
          <div className="mt-6">
            <p className="px-2 pb-1.5 font-medium text-muted-foreground text-xs">{path.at(-1)?.label ?? t.folders}</p>
            <ul className="flex flex-col gap-px">
              <li>
                <button aria-current={sub ? undefined : "page"} className={cn("flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring", sub ? "text-muted-foreground hover:bg-accent/60 hover:text-foreground" : "bg-accent font-medium text-foreground")} onClick={() => open("root")} type="button">
                  <FolderGlyph className="h-3 w-3.5 text-category-7-foreground" />
                  <span className="truncate">{name}</span>
                </button>
              </li>
              {folders.map((f) => (
                <li key={f.id}>
                  <button aria-current={at === f.id ? "page" : undefined} className={cn("flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md ps-7 pe-2 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring", at === f.id ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")} onClick={() => open(f.id)} type="button">
                    <FolderGlyph className="h-3 w-3.5 text-muted-foreground" />
                    <span className="truncate">{f.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {storage ? (
            <div className="mt-auto px-2 pt-4 pb-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium">{t.storage}</span>
                <span className="text-muted-foreground tabular-nums">{fmt.number(usedPct / 100, { style: "percent" })}</span>
              </div>
              <span aria-hidden className="relative mt-2 block h-1 overflow-hidden rounded-full bg-foreground/8">
                <span className="absolute inset-y-0 inset-s-0 rounded-full bg-foreground/72" style={{ width: `${usedPct}%` }} />
              </span>
              <p className="mt-2 text-muted-foreground text-xs tabular-nums">{interpolate(t.storageUsed, { used: gb(storage.usedGb), total: gb(storage.totalGb) })}</p>
            </div>
          ) : null}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4 @3xl:px-6">
            <nav aria-label={t.breadcrumb} className="-ms-1 flex min-w-0 flex-1 items-center gap-0.5 text-muted-foreground">
              {sub ? (
                <button aria-label={interpolate(t.backTo, { name })} className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring @md:hidden" onClick={() => open("root")} type="button">
                  <ArrowLeftIcon aria-hidden className="size-4 rtl:-scale-x-100" />
                </button>
              ) : null}
              {path.map((p) => (
                <span className="hidden min-w-0 items-center gap-0.5 @md:flex" key={p.label}>
                  {p.href ? (
                    <WirefrontLink className="flex h-7 items-center truncate rounded-md px-1.5 outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" href={p.href}>
                      {p.label}
                    </WirefrontLink>
                  ) : (
                    <span className="truncate px-1.5">{p.label}</span>
                  )}
                  <ChevronRightIcon aria-hidden className="size-3.5 shrink-0 opacity-56 rtl:-scale-x-100" />
                </span>
              ))}
              {sub ? (
                <span className="flex min-w-0 items-center gap-0.5">
                  <button className="hidden h-7 cursor-pointer items-center truncate rounded-md px-1.5 outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring @md:flex" onClick={() => open("root")} type="button">
                    {name}
                  </button>
                  <ChevronRightIcon aria-hidden className="hidden size-3.5 shrink-0 opacity-56 @md:block rtl:-scale-x-100" />
                </span>
              ) : null}
              <span aria-current="page" className="truncate px-1.5 font-medium text-foreground">
                {title}
              </span>
            </nav>
            <div className="flex shrink-0 items-center gap-2">
              <div className="me-1 hidden -space-x-1 @2xl:flex">
                {members.map((m) => (
                  <Avatar className="size-6 bg-background ring-2 ring-background" key={m.id} title={m.name}>
                    <AvatarFallback className={cn("font-medium text-[9px]", avatarTone[m.tone])}>{m.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              {onShareFolder ? (
                <Button className={cn("hidden @md:inline-flex", press)} onClick={() => onShareFolder(at)} variant="outline">
                  <Share2Icon />
                  {t.share}
                </Button>
              ) : null}
              {upload ? (
                <Button aria-label={t.upload} className={press} onClick={upload}>
                  <CloudUploadIcon />
                  <span className="hidden @md:inline">{t.upload}</span>
                </Button>
              ) : null}
            </div>
          </header>

          {error ? (
            <p className="shrink-0 border-b bg-destructive/8 px-4 py-2 text-destructive text-xs" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex items-center gap-3 px-4 pt-6 @3xl:px-8">
            <span aria-hidden className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", sub ? "bg-muted text-muted-foreground" : "bg-category-7/12 text-category-7-foreground")}>
              <FolderGlyph className="h-4 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-heading font-semibold text-xl tracking-tight">{title}</h1>
              <p className="text-muted-foreground text-xs tabular-nums">
                {countFiles(files.length)}
                {!sub && folders.length > 0 ? ` · ${interpolate(t.foldersCount, { count: folders.length })}` : ""} · {interpolate(t.sharedWith, { count: members.length })}
              </p>
            </div>
          </div>

          <div className="mx-4 mt-4 flex h-11 shrink-0 items-center gap-3 border-b @3xl:mx-8">
            <AnimatePresence initial={false} mode="popLayout">
              {selecting ? (
                <motion.label animate={{ opacity: 1, x: 0 }} className="flex h-8 cursor-pointer items-center gap-2 font-medium" exit={{ opacity: 0, x: -6 }} htmlFor={`${id}-all`} initial={{ opacity: 0, x: -6 }} key="all" transition={{ duration: 0.18, ease: easeOut }}>
                  <Checkbox checked={allSelected} id={`${id}-all`} indeterminate={!allSelected} onCheckedChange={() => setSelected(allSelected ? [] : visible.map((f) => f.id))} />
                  {t.selectAll}
                </motion.label>
              ) : isEmpty ? (
                <motion.span animate={{ opacity: 1 }} className="text-muted-foreground text-xs" initial={{ opacity: 0 }} key="none" transition={{ duration: 0.18 }}>
                  {t.noFiles}
                </motion.span>
              ) : (
                <motion.fieldset animate={{ opacity: 1, x: 0 }} className="-mx-1 m-0 flex min-w-0 items-center gap-0.5 overflow-x-auto border-0 p-0 px-1 scrollbar-none" exit={{ opacity: 0, x: -6 }} initial={{ opacity: 0, x: -6 }} key="filters" transition={{ duration: 0.18, ease: easeOut }}>
                  <legend className="sr-only">{t.fileType}</legend>
                  <LayoutGroup id={`${id}-filter`}>
                    {(["all", ...kinds] as const).map((k) => (
                      <button aria-pressed={activeFilter === k} className={cn("relative flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 font-medium text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring", activeFilter === k ? "text-foreground" : "text-muted-foreground hover:text-foreground")} key={k} onClick={() => setFilter(k)} type="button">
                        {activeFilter === k ? <motion.span className="absolute inset-0 rounded-md bg-accent" layoutId={`${id}-filter-on`} transition={{ type: "spring", stiffness: 520, damping: 40 }} /> : null}
                        {k !== "all" ? <span aria-hidden className={cn("relative size-1.5 rounded-full", kindDot[k])} /> : null}
                        <span className="relative">{k === "all" ? t.all : t[`kind_${k}`]}</span>
                        <span className="relative text-muted-foreground tabular-nums">{k === "all" ? files.length : files.filter((f) => f.kind === k).length}</span>
                      </button>
                    ))}
                  </LayoutGroup>
                </motion.fieldset>
              )}
            </AnimatePresence>
            <LayoutGroup id={`${id}-view`}>
              <fieldset className="m-0 ms-auto flex min-w-0 shrink-0 rounded-lg border-0 bg-muted p-0.5">
                <legend className="sr-only">{t.layout}</legend>
                {(
                  [
                    ["grid", LayoutGridIcon, t.gridView],
                    ["list", ListIcon, t.listView],
                  ] as const
                ).map(([v, Icon, label]) => (
                  <button aria-label={label} aria-pressed={view === v} className={cn("relative flex size-7 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring", view === v ? "text-foreground" : "text-muted-foreground hover:text-foreground")} key={v} onClick={() => setView(v)} type="button">
                    {view === v ? <motion.span className="absolute inset-0 rounded-md bg-background shadow-xs/5 dark:bg-input" layoutId={`${id}-view-on`} transition={spring} /> : null}
                    <Icon aria-hidden className="relative size-3.5" />
                  </button>
                ))}
              </fieldset>
            </LayoutGroup>
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto">
            <AnimatePresence initial={false} mode="wait">
              <motion.div animate={{ opacity: 1, x: 0 }} className="h-full" exit={{ opacity: 0, x: sub ? 8 : -8 }} initial={{ opacity: 0, x: sub ? 8 : -8 }} key={`${at}-${view}`} transition={{ duration: 0.18, ease: easeOut }}>
                {isEmpty ? (
                  <EmptyFolder name={title} onNewDoc={createDoc} onUpload={upload} t={t} />
                ) : grid ? (
                  <>
                    {showFolders ? (
                      <ul aria-label={t.folders} className="grid grid-cols-2 gap-3 px-4 pt-5 @2xl:grid-cols-3 @5xl:grid-cols-4 @3xl:px-8">
                        {folders.map((f) => {
                          const n = contents[f.id]?.length ?? 0;
                          return (
                            <li key={f.id}>
                              <button className={cn("flex h-14 w-full cursor-pointer items-center gap-3 rounded-xl border bg-card px-3.5 text-start outline-none hover:border-foreground/16 focus-visible:ring-2 focus-visible:ring-ring", press)} onClick={() => open(f.id)} type="button">
                                <FolderGlyph className="h-4 w-5 text-muted-foreground" />
                                <span className="flex min-w-0 flex-col">
                                  <span className="truncate font-medium">{f.name}</span>
                                  <span className="text-muted-foreground text-xs tabular-nums">{n ? countFiles(n) : t.empty}</span>
                                </span>
                                <ChevronRightIcon aria-hidden className="ms-auto hidden size-4 shrink-0 text-muted-foreground @md:block rtl:-scale-x-100" />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                    <ul className="grid grid-cols-2 gap-3 px-4 pt-3 pb-28 @2xl:grid-cols-3 @5xl:grid-cols-4 @3xl:px-8 first:pt-5">
                      <AnimatePresence initial={false} mode="popLayout">
                        {visible.map((f) => (
                          <motion.li animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} initial={{ opacity: 0, scale: 0.95 }} key={f.id} layout transition={spring}>
                            {fileCard(f)}
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </>
                ) : (
                  <div className="px-4 pt-3 pb-28 @3xl:px-8">
                    <div aria-hidden className={cn("grid h-9 items-center gap-3 px-2 font-medium text-muted-foreground text-xs", listCols)}>
                      <span />
                      <span>{t.colName}</span>
                      <span className="hidden @2xl:block">{t.colType}</span>
                      <span className="hidden @2xl:block">{t.colEditedBy}</span>
                      <span className="hidden @2xl:block">{t.colEdited}</span>
                      <span className="text-end">{t.colSize}</span>
                    </div>
                    <ul className="border-t">
                      {showFolders
                        ? folders.map((f) => {
                            const n = contents[f.id]?.length ?? 0;
                            return (
                              <li className="border-b" key={f.id}>
                                <button className={cn("grid h-12 w-full cursor-pointer items-center gap-3 rounded-md px-2 text-start outline-none hover:bg-accent/48 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset", listCols)} onClick={() => open(f.id)} type="button">
                                  <span />
                                  <span className="flex min-w-0 items-center gap-3">
                                    <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                                      <FolderGlyph className="h-3 w-3.5" />
                                    </span>
                                    <span className="truncate font-medium">{f.name}</span>
                                  </span>
                                  <span className="hidden text-muted-foreground @2xl:block">{t.folder}</span>
                                  <span className="hidden text-muted-foreground @2xl:block">—</span>
                                  <span className="hidden text-muted-foreground @2xl:block">—</span>
                                  <span className="text-end text-muted-foreground tabular-nums">{n ? countFiles(n) : t.empty}</span>
                                </button>
                              </li>
                            );
                          })
                        : null}
                      <AnimatePresence initial={false} mode="popLayout">
                        {visible.map((f) => {
                          const on = selected.includes(f.id);
                          const K = kindIcon[f.kind];
                          const editor = member(f.editedBy);
                          return (
                            <motion.li animate={{ opacity: 1 }} className="border-b" exit={{ opacity: 0 }} initial={{ opacity: 0 }} key={f.id} layout="position" transition={{ opacity: { duration: 0.15 }, layout: spring }}>
                              <label aria-label={interpolate(t.fileLabel, { name: f.name, kind: t[`kind_${f.kind}`], size: size(f.sizeBytes) })} className={cn("grid h-12 cursor-pointer select-none items-center gap-3 rounded-md px-2 transition-colors duration-150 has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-inset", listCols, on ? "bg-accent" : "hover:bg-accent/48")}>
                                <input checked={on} className="sr-only" onChange={() => toggle(f.id)} type="checkbox" />
                                <CheckMark on={on} />
                                <span className="flex min-w-0 items-center gap-3">
                                  <span aria-hidden className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", K.tint)}>
                                    <K.icon className="size-3.5" />
                                  </span>
                                  <span className="truncate font-medium">{f.name}</span>
                                </span>
                                <span className="hidden text-muted-foreground @2xl:block">{t[`kind_${f.kind}`]}</span>
                                <span className="hidden items-center gap-2 text-muted-foreground @2xl:flex">
                                  {editor ? (
                                    <Avatar aria-hidden className="size-5 shrink-0">
                                      <AvatarFallback className={cn("font-medium text-[8px]", avatarTone[editor.tone])}>{editor.initials}</AvatarFallback>
                                    </Avatar>
                                  ) : null}
                                  {f.editedBy === me ? t.you : editor?.name.split(" ")[0]}
                                </span>
                                <span className="hidden text-muted-foreground tabular-nums @2xl:block">{fmt.relative(f.editedAt)}</span>
                                <span className="text-end text-muted-foreground tabular-nums">{size(f.sizeBytes)}</span>
                              </label>
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </ul>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {selecting ? (
            <motion.div animate={{ y: 0, opacity: 1, scale: 1 }} aria-label={t.bulk} className="absolute inset-x-3 bottom-4 z-20 mx-auto flex max-w-fit origin-bottom items-center gap-1 rounded-xl border bg-popover p-1 shadow-lg/10 @3xl:inset-s-56" exit={{ y: 16, opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: easeOut } }} initial={{ y: 16, opacity: 0, scale: 0.96 }} role="toolbar" transition={spring}>
              <span className="flex items-center gap-1 ps-2.5 pe-2 font-medium">
                <RollingCount value={selected.length} />
                <span>{t.selected}</span>
              </span>
              <span aria-hidden className="mx-1 h-5 w-px bg-border" />
              {bulk.map(([label, Icon, run]) =>
                run ? (
                  <Tooltip key={label}>
                    <TooltipTrigger
                      render={
                        <Button
                          aria-label={label}
                          className={cn("@lg:w-auto @lg:px-2.5", press)}
                          onClick={() => {
                            run(selected);
                            setSelected([]);
                          }}
                          size="icon"
                          variant="ghost"
                        />
                      }
                    >
                      <Icon />
                      <span className="hidden @lg:inline">{label}</span>
                    </TooltipTrigger>
                    <TooltipContent className="@lg:hidden">{label}</TooltipContent>
                  </Tooltip>
                ) : null,
              )}
              {onDelete ? (
                <Button aria-label={t.delete} className={cn("text-destructive-foreground hover:bg-destructive/8 @lg:w-auto @lg:px-2.5", press)} onClick={() => remove.run({ folderId: at, ids: selected })} size="icon" variant="ghost">
                  <Trash2Icon />
                  <span className="hidden @lg:inline">{t.delete}</span>
                </Button>
              ) : null}
              <span aria-hidden className="mx-1 h-5 w-px bg-border" />
              <Button aria-label={t.clearSelection} className={press} onClick={() => setSelected([])} size="icon" variant="ghost">
                <XIcon />
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {toast && !selecting ? (
            <motion.div animate={{ y: 0, opacity: 1 }} className="absolute inset-x-3 bottom-4 z-20 mx-auto flex max-w-fit items-center gap-3 rounded-xl border bg-popover py-1.5 ps-3.5 pe-1.5 shadow-lg/10 @3xl:inset-s-56" exit={{ y: 12, opacity: 0, transition: { duration: 0.15, ease: easeOut } }} initial={{ y: 12, opacity: 0 }} role="status" transition={spring}>
              <span className="truncate">{toast}</span>
              <Button className={press} onClick={() => setToast(null)} size="xs" variant="ghost">
                {t.dismiss}
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

export function FolderView(props: FolderViewProps) {
  return (
    <ScreenBoundary name="FolderView">
      <FolderViewScreen {...props} />
    </ScreenBoundary>
  );
}

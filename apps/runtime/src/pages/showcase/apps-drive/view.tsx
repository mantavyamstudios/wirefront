// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `drive`).
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import { type Action, fail } from "@wirefront/ui/wirefront/types";
import { ArrowDownUpIcon, ChevronsUpDownIcon, ClockIcon, CloudUploadIcon, HouseIcon, LayoutGridIcon, ListIcon, type LucideIcon, PlusIcon, SearchIcon, StarIcon, Trash2Icon, UsersRoundIcon, XIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { DriveFolder, DriveMember, DriveTemplate, FolderTone } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("drive.<key>"). */
export const DRIVE_MESSAGES = {
  title: "Files",
  tab_all: "All files",
  tab_recent: "Recent",
  tab_shared: "Shared",
  tab_starred: "Starred",
  views: "Drive",
  trash: "Trash",
  quickAccess: "Quick access",
  storage: "Storage",
  storageUsed: "{used} of {total} used",
  moreSpace: "Get more space",
  search: "Search folders",
  clearSearch: "Clear search",
  upload: "Upload",
  newFolder: "New folder",
  startNew: "Start something new",
  allTemplates: "All templates",
  blank: "Blank",
  folders: "Folders",
  sortBy: "Sort by {key}",
  sortHeading: "Sort by",
  order: "Order",
  sort_name: "Name",
  sort_edited: "Last edited",
  sort_size: "Size",
  sort_files: "File count",
  aToZ: "A to Z",
  zToA: "Z to A",
  oldest: "Oldest first",
  newest: "Newest first",
  smallest: "Smallest first",
  largest: "Largest first",
  layout: "Layout",
  gridView: "Grid view",
  listView: "List view",
  colName: "Name",
  colShared: "Shared with",
  colEdited: "Edited",
  colSize: "Size",
  open: "Open {name}",
  noFiles: "No files yet",
  filesSize: "{count} files · {size}",
  onlyYou: "Only you",
  star: "Star {name}",
  unstar: "Unstar {name}",
  noMatch: "No folders match",
  nothingCalled: "Nothing called “{query}”.",
  nothingYet: "Nothing here yet.",
  showAll: "Show all files",
  created: "{name} created",
  openCreated: "Open",
  dismiss: "Dismiss",
  switchWorkspace: "Switch workspace",
};
type Messages = typeof DRIVE_MESSAGES;

export interface DriveProps {
  workspace: string;
  folders: DriveFolder[];
  members: DriveMember[];
  templates?: DriveTemplate[];
  storage?: { usedGb: number; totalGb: number };
  defaultView?: "grid" | "list";
  onOpenFolder?: (id: string) => void;
  /** Creates a folder and returns it; it appears at the top. Hidden without it. */
  onCreateFolder?: Action<void, DriveFolder>;
  /** Stars or unstars; it shows at once and flips back if this fails. */
  onToggleStar?: Action<{ id: string; starred: boolean }>;
  /** Each shows its control only when given. */
  onUpload?: () => void;
  /** Called with a template id, or null for a blank file. */
  onCreateFromTemplate?: (templateId: string | null) => void;
  onBrowseTemplates?: () => void;
  onOpenTrash?: () => void;
  onGetMoreSpace?: () => void;
  onSwitchWorkspace?: () => void;
  className?: string;
}

type SortKey = "name" | "edited" | "size" | "files";
type Tab = "all" | "recent" | "shared" | "starred";
const TABS: Tab[] = ["all", "recent", "shared", "starred"];
const tabIcon: Record<Tab, LucideIcon> = { all: HouseIcon, recent: ClockIcon, shared: UsersRoundIcon, starred: StarIcon };

const tone: Record<FolderTone, string> = {
  orange: "text-category-7-foreground",
  yellow: "text-category-3-foreground",
  lime: "text-category-2-foreground",
  teal: "text-category-6-foreground",
  blue: "text-category-1-foreground",
  violet: "text-category-5-foreground",
  rose: "text-category-4-foreground",
  slate: "text-muted-foreground",
  neutral: "text-muted-foreground/64",
};
const avatarTone: Record<FolderTone, string> = {
  orange: "bg-category-7/16 text-category-7-foreground",
  yellow: "bg-category-3/16 text-category-3-foreground",
  lime: "bg-category-2/16 text-category-2-foreground",
  teal: "bg-category-6/16 text-category-6-foreground",
  blue: "bg-category-1/16 text-category-1-foreground",
  violet: "bg-category-5/18 text-category-5-foreground",
  rose: "bg-category-4/16 text-category-4-foreground",
  slate: "bg-muted text-muted-foreground",
  neutral: "bg-muted text-muted-foreground",
};
const spring = { type: "spring", stiffness: 380, damping: 34 } as const;
const noCreate: Action<void, DriveFolder> = async () => fail();

function FolderGlyph({ folderTone, className, layoutId }: { folderTone: FolderTone; className?: string; layoutId?: string }) {
  return (
    <motion.span aria-hidden className={cn("relative block shrink-0", tone[folderTone], className)} layoutId={layoutId} transition={spring}>
      <svg aria-hidden="true" className="absolute inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 16">
        <path d="M0 2.5A2.5 2.5 0 0 1 2.5 0h4.3a2 2 0 0 1 1.5.7L9.6 2.2h7.9A2.5 2.5 0 0 1 20 4.7v8.8a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 0 13.5Z" fill="currentColor" opacity="0.45" />
        <path d="M0 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7.5a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 0 13.5Z" fill="currentColor" />
      </svg>
    </motion.span>
  );
}

function TemplatePreview({ kind }: { kind: DriveTemplate["kind"] }) {
  const line = "h-[3px] rounded-full bg-foreground/12";
  switch (kind) {
    case "doc":
      return (
        <span className="flex flex-col gap-1">
          <span className="h-1 w-2/3 rounded-full bg-foreground/40" />
          {[92, 80, 86].map((w) => (
            <span className={line} key={w} style={{ width: `${w}%` }} />
          ))}
        </span>
      );
    case "brief":
      return (
        <span className="flex flex-col gap-1">
          <span className="h-2.5 w-full rounded-[calc(var(--radius)*0.3)] bg-category-7/20" />
          <span className="h-1 w-1/2 rounded-full bg-foreground/40" />
          <span className={line} style={{ width: "80%" }} />
        </span>
      );
    case "sheet":
      return (
        <span className="grid grid-cols-4 gap-px overflow-hidden rounded-[calc(var(--radius)*0.3)]">
          {"abcdefghijkl".split("").map((cell, i) => (
            <span className={cn("h-1.5", i < 4 ? "bg-foreground/20" : i === 6 ? "bg-category-2/40" : "bg-foreground/8")} key={cell} />
          ))}
        </span>
      );
    case "roadmap":
      return (
        <span className="flex flex-col gap-1">
          {(
            [
              [0, 50, "bg-category-1/40"],
              [24, 48, "bg-category-6/40"],
              [50, 44, "bg-category-5/40"],
            ] as const
          ).map(([start, w, c]) => (
            <span className={cn("h-1.5 rounded-full", c)} key={c} style={{ marginInlineStart: `${start}%`, width: `${w}%` }} />
          ))}
        </span>
      );
    case "board":
      return (
        <span className="grid grid-cols-3 gap-1">
          {(
            [
              ["a1", "bg-category-3/24"],
              ["a2", "bg-category-6/30"],
              ["a3", "bg-category-5/30"],
              ["b1", "bg-category-5/30"],
              ["b2", "bg-category-3/24"],
              ["b3", "bg-foreground/10"],
            ] as const
          ).map(([cell, c]) => (
            <span className={cn("h-2 rounded-[calc(var(--radius)*0.2)]", c)} key={cell} />
          ))}
        </span>
      );
    case "moodboard":
      return (
        <span className="grid h-full grid-cols-3 grid-rows-2 gap-0.5">
          <span className="row-span-2 rounded-[calc(var(--radius)*0.2)] bg-linear-to-b from-category-3/36 to-category-4/50" />
          <span className="rounded-[calc(var(--radius)*0.2)] bg-category-6/40" />
          <span className="rounded-[calc(var(--radius)*0.2)] bg-foreground/16" />
          <span className="col-span-2 rounded-[calc(var(--radius)*0.2)] bg-category-1/30" />
        </span>
      );
  }
}

function Members({ ids, members, t }: { ids: string[]; members: DriveMember[]; t: Messages }) {
  if (ids.length === 0) return <span className="text-muted-foreground text-xs">{t.onlyYou}</span>;
  const people = ids.map((id) => members.find((m) => m.id === id)).filter((m): m is DriveMember => Boolean(m));
  return (
    <span className="flex -space-x-1">
      {people.slice(0, 3).map((m) => (
        <Avatar className="size-5 bg-card ring-2 ring-card" key={m.id} title={m.name}>
          <AvatarFallback className={cn("font-medium text-[8px]", avatarTone[m.tone])}>{m.initials}</AvatarFallback>
        </Avatar>
      ))}
      {people.length > 3 ? <span className="flex size-5 items-center justify-center rounded-full bg-muted font-medium text-[8px] text-muted-foreground tabular-nums ring-2 ring-card">+{people.length - 3}</span> : null}
      <span className="sr-only">{people.map((m) => m.name).join(", ")}</span>
    </span>
  );
}

/** Reads the theme's radius so layout animations keep the same corners. */
function useThemeRadius(scale: number) {
  const probe = useRef<HTMLSpanElement>(null);
  const [radius, setRadius] = useState(scale * 10);
  useLayoutEffect(() => {
    const el = probe.current;
    if (!el) return;
    const read = () => setRadius(el.offsetWidth);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const marker = <span aria-hidden className="pointer-events-none invisible absolute h-0" ref={probe} style={{ width: `calc(var(--radius) * ${scale})` }} />;
  return [radius, marker] as const;
}

function DriveScreen({ workspace, folders: initialFolders, members, templates = [], storage, defaultView = "grid", onOpenFolder, onCreateFolder, onToggleStar, onUpload, onCreateFromTemplate, onBrowseTemplates, onOpenTrash, onGetMoreSpace, onSwitchWorkspace, className }: DriveProps) {
  const t = useMessages("drive", DRIVE_MESSAGES);
  const fmt = useFormat();
  const { now } = useWirefront();
  const [radius, radiusProbe] = useThemeRadius(1.2);
  const [folders, setFolders] = useState(initialFolders);
  useEffect(() => setFolders(initialFolders), [initialFolders]);
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("edited");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [view, setView] = useState(defaultView);
  const [created, setCreated] = useState<DriveFolder | null>(null);
  const group = useId();

  useEffect(() => {
    if (!created) return;
    const id = setTimeout(() => setCreated(null), 2800);
    return () => clearTimeout(id);
  }, [created]);

  const star = useAction(onToggleStar ?? (async () => {}), {
    optimistic: ({ id, starred }) => {
      const set = (on: boolean) => setFolders((fs) => fs.map((f) => (f.id === id ? { ...f, starred: on } : f)));
      set(starred);
      return () => set(!starred);
    },
  });
  const create = useAction(onCreateFolder ?? noCreate, {
    onSuccess: (folder) => {
      setFolders((fs) => [folder, ...fs.filter((f) => f.id !== folder.id)]);
      setTab("all");
      setQuery("");
      setCreated(folder);
    },
  });
  const error = star.error ?? create.error;

  const dayAgo = now().getTime() - 86_400_000;
  const isRecent = (f: DriveFolder) => Date.parse(f.editedAt) > dayAgo;
  const counts: Record<Tab, number> = { all: folders.length, recent: folders.filter(isRecent).length, shared: folders.filter((f) => f.shared).length, starred: folders.filter((f) => f.starred).length };
  const size = (mb: number) => (mb >= 1000 ? fmt.number(mb / 1024, { style: "unit", unit: "gigabyte", maximumFractionDigits: 1 }) : fmt.number(mb, { style: "unit", unit: "megabyte" }));
  const filesSize = (f: DriveFolder) => (f.files === 0 ? t.noFiles : interpolate(t.filesSize, { count: fmt.number(f.files), size: size(f.sizeMb) }));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = folders.filter((f) => {
      if (tab === "recent" && Date.parse(f.editedAt) <= dayAgo) return false;
      if (tab === "shared" && !f.shared) return false;
      if (tab === "starred" && !f.starred) return false;
      return !q || f.name.toLowerCase().includes(q);
    });
    const by: Record<SortKey, (a: DriveFolder, b: DriveFolder) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      edited: (a, b) => Date.parse(a.editedAt) - Date.parse(b.editedAt),
      size: (a, b) => a.sizeMb - b.sizeMb,
      files: (a, b) => a.files - b.files,
    };
    const sorted = [...list].sort(by[sort]);
    return dir === "desc" ? sorted.reverse() : sorted;
  }, [folders, tab, query, sort, dir, dayAgo]);

  const sortLabel = t[`sort_${sort}`];
  const grid = view === "grid";
  const heading = tab === "all" ? t.title : t[`tab_${tab}`];
  const starred = folders.filter((f) => f.starred);
  const usedPct = storage ? Math.min(100, (storage.usedGb / storage.totalGb) * 100) : 0;
  const gb = (n: number) => fmt.number(n, { style: "unit", unit: "gigabyte", maximumFractionDigits: 1 });

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("@container relative flex h-svh w-full overflow-hidden bg-background text-foreground text-sm", className)}>
        <aside className="hidden w-56 shrink-0 flex-col border-e bg-muted/30 px-3 py-3 @3xl:flex">
          {onSwitchWorkspace ? (
            <button className="flex h-9 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-start outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring" onClick={onSwitchWorkspace} type="button">
              <WorkspaceMark />
              <span className="min-w-0 flex-1 truncate font-medium">
                {workspace}
                <span className="sr-only">, {t.switchWorkspace}</span>
              </span>
              <ChevronsUpDownIcon aria-hidden className="size-3.5 text-muted-foreground" />
            </button>
          ) : (
            <div className="flex h-9 items-center gap-2 px-1.5">
              <WorkspaceMark />
              <span className="min-w-0 flex-1 truncate font-medium">{workspace}</span>
            </div>
          )}

          <LayoutGroup id={`${group}-nav`}>
            <nav aria-label={t.views} className="mt-4 flex flex-col gap-px">
              {TABS.map((id) => {
                const on = tab === id;
                const Icon = tabIcon[id];
                return (
                  <button aria-current={on ? "page" : undefined} className={cn("relative flex h-8 cursor-pointer items-center gap-2.5 rounded-md px-2 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring", on ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")} key={id} onClick={() => setTab(id)} type="button">
                    {on ? <motion.span className="absolute inset-0 rounded-md bg-accent" layoutId={`${group}-nav-on`} transition={spring} /> : null}
                    <Icon aria-hidden className="relative size-4 shrink-0 opacity-80" />
                    <span className="relative flex-1 truncate">{t[`tab_${id}`]}</span>
                    <span className="relative text-muted-foreground text-xs tabular-nums">{counts[id]}</span>
                  </button>
                );
              })}
              {onOpenTrash ? (
                <button className="flex h-8 cursor-pointer items-center gap-2.5 rounded-md px-2 text-start text-muted-foreground outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={onOpenTrash} type="button">
                  <Trash2Icon aria-hidden className="size-4 shrink-0 opacity-80" />
                  {t.trash}
                </button>
              ) : null}
            </nav>
          </LayoutGroup>

          {starred.length > 0 ? (
            <div className="mt-6">
              <p className="px-2 pb-1.5 font-medium text-muted-foreground text-xs">{t.quickAccess}</p>
              <ul className="flex flex-col gap-px">
                <AnimatePresence initial={false}>
                  {starred.map((f) => (
                    <motion.li animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} initial={{ opacity: 0, height: 0 }} key={f.id} transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}>
                      <button className="flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-start text-muted-foreground outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onOpenFolder?.(f.id)} type="button">
                        <FolderGlyph className="h-3 w-3.5" folderTone={f.tone} />
                        <span className="truncate">{f.name}</span>
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          ) : null}

          {storage ? (
            <div className="mt-auto rounded-lg px-2 pt-4 pb-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium">{t.storage}</span>
                <span className="text-muted-foreground tabular-nums">{fmt.number(usedPct / 100, { style: "percent" })}</span>
              </div>
              <span aria-hidden className="relative mt-2 block h-1 overflow-hidden rounded-full bg-foreground/8">
                <motion.span animate={{ scaleX: usedPct / 100 }} className="absolute inset-0 origin-left rounded-full bg-primary/72 rtl:origin-right" initial={{ scaleX: 0 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.1 }} />
              </span>
              <p className="mt-2 text-muted-foreground text-xs tabular-nums">{interpolate(t.storageUsed, { used: gb(storage.usedGb), total: gb(storage.totalGb) })}</p>
              {onGetMoreSpace ? (
                <button className="mt-1 cursor-pointer rounded-sm font-medium text-xs outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={onGetMoreSpace} type="button">
                  {t.moreSpace}
                </button>
              ) : null}
            </div>
          ) : null}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 @3xl:px-6">
            <InputGroup className="max-w-md flex-1">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput aria-label={t.search} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} value={query} />
              <InputGroupAddon align="inline-end">
                {query ? (
                  <Button aria-label={t.clearSearch} onClick={() => setQuery("")} size="icon-xs" variant="ghost">
                    <XIcon />
                  </Button>
                ) : (
                  <Kbd className="hidden @md:inline-flex">/</Kbd>
                )}
              </InputGroupAddon>
            </InputGroup>
            <div className="ms-auto flex items-center gap-2">
              {onUpload ? (
                <Button aria-label={t.upload} onClick={onUpload} variant="outline">
                  <CloudUploadIcon />
                  <span className="hidden @lg:inline">{t.upload}</span>
                </Button>
              ) : null}
              {onCreateFolder ? (
                <Button aria-label={t.newFolder} disabled={create.isPending()} onClick={() => create.run()}>
                  <PlusIcon />
                  <span className="hidden @lg:inline">{t.newFolder}</span>
                </Button>
              ) : null}
            </div>
          </header>

          {error ? (
            <p className="shrink-0 border-b bg-destructive/8 px-4 py-2 text-destructive text-xs" role="alert">
              {error}
            </p>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-6xl flex-col px-4 pt-6 pb-12 @3xl:px-8 @3xl:pt-8">
              <h1 className="font-heading font-semibold text-2xl tracking-tight">{heading}</h1>

              <LayoutGroup id={`${group}-pills`}>
                <nav aria-label={t.views} className="-mx-4 mt-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] @3xl:hidden">
                  {TABS.map((id) => (
                    <button aria-current={tab === id ? "page" : undefined} className={cn("relative flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 font-medium text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring", tab === id ? "border-transparent text-background" : "text-muted-foreground")} key={id} onClick={() => setTab(id)} type="button">
                      {tab === id ? <motion.span className="absolute inset-0 rounded-full bg-foreground" layoutId={`${group}-pill`} transition={spring} /> : null}
                      <span className="relative">{t[`tab_${id}`]}</span>
                      <span className="relative tabular-nums opacity-64">{counts[id]}</span>
                    </button>
                  ))}
                </nav>
              </LayoutGroup>

              {tab === "all" && !query && templates.length > 0 && onCreateFromTemplate ? (
                <section aria-labelledby={`${group}-tpl`} className="mt-6">
                  <div className="flex h-8 items-center justify-between">
                    <h2 className="font-medium" id={`${group}-tpl`}>
                      {t.startNew}
                    </h2>
                    {onBrowseTemplates ? (
                      <Button className="-me-2 text-muted-foreground" onClick={onBrowseTemplates} size="xs" variant="ghost">
                        {t.allTemplates}
                      </Button>
                    ) : null}
                  </div>
                  <div className="-mx-4 mt-2 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] @6xl:mx-0 @6xl:grid @6xl:grid-cols-[auto_repeat(5,minmax(0,1fr))] @6xl:px-0 @6xl:[&>*:nth-child(n+7)]:hidden">
                    <button className="group/tpl flex h-14 w-28 shrink-0 snap-start cursor-pointer items-center gap-3 rounded-xl border border-dashed px-3 text-start text-muted-foreground outline-none transition-[background-color,color,scale] duration-150 ease-out hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] @6xl:w-auto @6xl:pe-5" onClick={() => onCreateFromTemplate(null)} type="button">
                      <span aria-hidden className="flex h-9 w-8 shrink-0 items-center justify-center">
                        <PlusIcon className="size-4" />
                      </span>
                      <span className="truncate font-medium">{t.blank}</span>
                    </button>
                    {templates.map((tpl) => (
                      <button className="flex h-14 w-44 shrink-0 snap-start cursor-pointer items-center gap-3 rounded-xl border bg-card px-3 text-start outline-none transition-[border-color,box-shadow,scale] duration-150 ease-out hover:border-foreground/16 hover:shadow-xs/5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] @6xl:w-auto" key={tpl.id} onClick={() => onCreateFromTemplate(tpl.id)} type="button">
                        <span aria-hidden className="flex h-9 w-8 shrink-0 flex-col justify-center overflow-hidden rounded-[calc(var(--radius)*0.5)] border bg-background p-1">
                          <TemplatePreview kind={tpl.kind} />
                        </span>
                        <span className="truncate font-medium">{tpl.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              <section aria-labelledby={`${group}-folders-h`} className="mt-8">
                <div className="flex h-8 items-center gap-2">
                  <h2 className="font-medium" id={`${group}-folders-h`}>
                    {t.folders}
                  </h2>
                  <span className="text-muted-foreground text-xs tabular-nums">{visible.length}</span>
                  <div className="ms-auto flex items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button aria-label={interpolate(t.sortBy, { key: sortLabel })} className="text-muted-foreground" size="sm" variant="ghost" />}>
                        <ArrowDownUpIcon />
                        <span className="hidden @md:inline">{sortLabel}</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>{t.sortHeading}</DropdownMenuLabel>
                          <DropdownMenuRadioGroup onValueChange={(v) => setSort(v as SortKey)} value={sort}>
                            {(["name", "edited", "size", "files"] as const).map((k) => (
                              <DropdownMenuRadioItem key={k} value={k}>
                                {t[`sort_${k}`]}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>{t.order}</DropdownMenuLabel>
                          <DropdownMenuRadioGroup onValueChange={(v) => setDir(v as "asc" | "desc")} value={dir}>
                            <DropdownMenuRadioItem value="asc">{sort === "name" ? t.aToZ : sort === "edited" ? t.oldest : t.smallest}</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="desc">{sort === "name" ? t.zToA : sort === "edited" ? t.newest : t.largest}</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <LayoutGroup id={`${group}-view`}>
                      <fieldset className="m-0 flex min-w-0 rounded-lg border-0 bg-muted p-0.5">
                        <legend className="sr-only">{t.layout}</legend>
                        {(
                          [
                            ["grid", LayoutGridIcon, t.gridView],
                            ["list", ListIcon, t.listView],
                          ] as const
                        ).map(([v, Icon, label]) => (
                          <button aria-label={label} aria-pressed={view === v} className={cn("relative flex size-7 cursor-pointer items-center justify-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring", view === v ? "text-foreground" : "text-muted-foreground hover:text-foreground")} key={v} onClick={() => setView(v)} type="button">
                            {view === v ? <motion.span className="absolute inset-0 rounded-md bg-background shadow-xs/5 dark:bg-input" layoutId={`${group}-view-on`} transition={spring} /> : null}
                            <Icon aria-hidden className="relative size-3.5" />
                          </button>
                        ))}
                      </fieldset>
                    </LayoutGroup>
                  </div>
                </div>

                <LayoutGroup id={`${group}-folders`}>
                  <motion.div className={cn("mt-3", !grid && "overflow-hidden rounded-xl border bg-card")} layout style={{ borderRadius: radius }} transition={spring}>
                    {radiusProbe}
                    {!grid && visible.length > 0 ? (
                      <div aria-hidden className="hidden h-9 grid-cols-[minmax(0,1fr)_7rem_6rem_6rem_2.5rem] items-center gap-4 border-b bg-muted/40 ps-4 pe-2 font-medium text-muted-foreground text-xs @2xl:grid">
                        <span>{t.colName}</span>
                        <span>{t.colShared}</span>
                        <span>{t.colEdited}</span>
                        <span className="text-end">{t.colSize}</span>
                        <span />
                      </div>
                    ) : null}
                    <ul className={cn(grid ? "grid grid-cols-2 gap-3 @2xl:grid-cols-3 @5xl:grid-cols-4" : "flex flex-col")}>
                      <AnimatePresence mode="popLayout">
                        {visible.map((f, i) => (
                          <motion.li animate={{ opacity: 1, scale: 1 }} className={cn("group/folder relative transition-[background-color,border-color,scale] duration-150 ease-out has-[>[data-hit]:active]:scale-[0.985]", grid ? "rounded-xl border bg-card hover:border-foreground/16" : cn("hover:bg-accent/40", i > 0 && "border-t"))} exit={{ opacity: 0, scale: 0.96 }} initial={{ opacity: 0, scale: 0.96 }} key={f.id} layout style={{ borderRadius: grid ? radius : 0 }} transition={spring}>
                            {onOpenFolder ? <button aria-label={interpolate(t.open, { name: f.name })} className="absolute inset-0 z-0 cursor-pointer rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset" data-hit="" onClick={() => onOpenFolder(f.id)} type="button" /> : null}
                            {grid ? (
                              <motion.div animate={{ opacity: 1 }} className="pointer-events-none relative flex flex-col p-3.5" initial={{ opacity: 0 }} key="grid" layout="position" transition={{ opacity: { duration: 0.2, delay: 0.06 }, layout: spring }}>
                                <FolderGlyph className="h-6 w-7.5" folderTone={f.tone} layoutId={`${group}-glyph-${f.id}`} />
                                <span className="mt-5 truncate pe-6 font-medium">{f.name}</span>
                                <span className="mt-0.5 text-muted-foreground text-xs tabular-nums">{filesSize(f)}</span>
                                <div className="mt-4 flex h-5 items-center justify-between">
                                  <Members ids={f.members} members={members} t={t} />
                                  <span className="text-muted-foreground text-xs tabular-nums">{fmt.relative(f.editedAt)}</span>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div animate={{ opacity: 1 }} className="pointer-events-none relative grid h-13 grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-4 ps-4 pe-2 @2xl:grid-cols-[minmax(0,1fr)_7rem_6rem_6rem_2.5rem]" initial={{ opacity: 0 }} key="list" layout="position" transition={{ opacity: { duration: 0.2, delay: 0.06 }, layout: spring }}>
                                <span className="flex min-w-0 items-center gap-3">
                                  <FolderGlyph className="h-4 w-5" folderTone={f.tone} layoutId={`${group}-glyph-${f.id}`} />
                                  <span className="flex min-w-0 flex-col">
                                    <span className="truncate font-medium">{f.name}</span>
                                    <span className="text-muted-foreground text-xs tabular-nums @2xl:hidden">{filesSize(f)}</span>
                                  </span>
                                </span>
                                <span className="hidden @2xl:block">
                                  <Members ids={f.members} members={members} t={t} />
                                </span>
                                <span className="hidden text-muted-foreground tabular-nums @2xl:block">{fmt.relative(f.editedAt)}</span>
                                <span className="hidden text-end text-muted-foreground tabular-nums @2xl:block">{f.sizeMb ? size(f.sizeMb) : "—"}</span>
                              </motion.div>
                            )}
                            {onToggleStar ? (
                              <motion.button aria-label={interpolate(f.starred ? t.unstar : t.star, { name: f.name })} aria-pressed={Boolean(f.starred)} className={cn("absolute z-10 flex size-8 cursor-pointer items-center justify-center rounded-md outline-none transition-opacity hover:bg-accent focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring", grid ? "end-2 top-2" : "end-2 top-2.5", f.starred ? "text-category-3-foreground opacity-100" : "text-muted-foreground opacity-0 group-hover/folder:opacity-100 pointer-coarse:opacity-100")} layout="position" onClick={() => star.run({ id: f.id, starred: !f.starred }, f.id)} transition={spring} type="button">
                                <motion.span animate={{ scale: f.starred ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.28 }}>
                                  <StarIcon aria-hidden className={cn("size-4", f.starred && "fill-current")} />
                                </motion.span>
                              </motion.button>
                            ) : null}
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </motion.div>
                  {visible.length === 0 ? (
                    <div className="mt-3 flex flex-col items-center gap-1 rounded-xl border border-dashed py-14 text-center">
                      <SearchIcon aria-hidden className="mb-2 size-5 text-muted-foreground" />
                      <span className="font-medium">{t.noMatch}</span>
                      <span className="text-muted-foreground text-xs">{query ? interpolate(t.nothingCalled, { query: query.trim() }) : t.nothingYet}</span>
                      <Button
                        className="mt-3"
                        onClick={() => {
                          setQuery("");
                          setTab("all");
                        }}
                        size="sm"
                        variant="outline"
                      >
                        {t.showAll}
                      </Button>
                    </div>
                  ) : null}
                </LayoutGroup>
              </section>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {created ? (
            <motion.div animate={{ opacity: 1, y: 0 }} className="absolute inset-x-4 bottom-4 z-20 mx-auto flex max-w-xs items-center gap-3 rounded-xl border bg-popover py-1.5 ps-3.5 pe-1.5 shadow-lg/10" exit={{ opacity: 0, y: 12 }} initial={{ opacity: 0, y: 12 }} role="status" transition={spring}>
              <span className="min-w-0 flex-1 truncate">{interpolate(t.created, { name: created.name })}</span>
              {onOpenFolder ? (
                <Button
                  onClick={() => {
                    onOpenFolder(created.id);
                    setCreated(null);
                  }}
                  size="xs"
                  variant="ghost"
                >
                  {t.openCreated}
                </Button>
              ) : (
                <Button onClick={() => setCreated(null)} size="xs" variant="ghost">
                  {t.dismiss}
                </Button>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

function WorkspaceMark() {
  return (
    <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
      <svg aria-hidden="true" className="size-3.5" fill="none" viewBox="0 0 16 16">
        <path d="M2 9.5c2 2.7 10 2.7 12 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M4 5h8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    </span>
  );
}

export function Drive(props: DriveProps) {
  return (
    <ScreenBoundary name="Drive">
      <DriveScreen {...props} />
    </ScreenBoundary>
  );
}

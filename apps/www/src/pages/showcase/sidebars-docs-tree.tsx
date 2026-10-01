import { useState } from "react";
import {
  BookmarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  ListTreeIcon,
  PlusIcon,
  SearchIcon,
  StickyNoteIcon,
} from "lucide-react";
import { Sheet, SheetPopup, SheetTitle, SheetTrigger } from "@orbit/ui/sheet";

interface Doc {
  id: string;
  title: string;
  children?: Doc[];
}

const TREE: Doc[] = [
  {
    id: "getting-started",
    title: "Getting started",
    children: [
      { id: "install", title: "Install the CLI" },
      { id: "quickstart", title: "Quickstart" },
      { id: "structure", title: "Project structure" },
    ],
  },
  {
    id: "concepts",
    title: "Concepts",
    children: [
      { id: "workspaces", title: "Workspaces" },
      { id: "teams", title: "Teams" },
      { id: "permissions", title: "Permissions" },
      {
        id: "events",
        title: "Realtime events",
        children: [
          { id: "events-overview", title: "Overview" },
          { id: "events-domain", title: "Domain events" },
          { id: "events-projector", title: "Projectors" },
        ],
      },
    ],
  },
  {
    id: "guides",
    title: "Guides",
    children: [
      { id: "add-permission", title: "Add a permission" },
      { id: "add-context", title: "Add a bounded context" },
      { id: "add-job", title: "Write a job" },
    ],
  },
  {
    id: "reference",
    title: "Reference",
    children: [
      { id: "ref-api", title: "API" },
      { id: "ref-cli", title: "CLI flags" },
    ],
  },
];

function findTitle(docs: Doc[], id: string): string | undefined {
  for (const d of docs) {
    if (d.id === id) return d.title;
    const hit = d.children ? findTitle(d.children, id) : undefined;
    if (hit) return hit;
  }
  return undefined;
}

export function SidebarsDocsTreeShowcasePage() {
  const [active, setActive] = useState<string>("events-projector");
  const [navOpen, setNavOpen] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({
    "getting-started": true,
    concepts: true,
    events: true,
    guides: false,
    reference: false,
  });

  const toggle = (id: string) =>
    setOpen((o) => ({ ...o, [id]: !o[id] }));

  const tree = (
    <TreePanel
      open={open}
      onToggle={toggle}
      active={active}
      onSelect={(id) => {
        setActive(id);
        setNavOpen(false);
      }}
    />
  );

  return (
    <div className="min-h-svh bg-background text-foreground md:grid md:grid-cols-[280px_minmax(0,1fr)]">
      {/* Mobile: content first, tree behind a "Contents" trigger */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/90 px-2 backdrop-blur md:hidden">
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger className="flex min-h-11 items-center gap-2 rounded-md px-2.5 text-muted-foreground text-sm transition-colors hover:bg-foreground/[0.04] hover:text-foreground">
            <ListTreeIcon className="size-4" />
            Contents
          </SheetTrigger>
          <SheetPopup side="left" className="max-w-[320px] bg-background">
            <SheetTitle className="sr-only">Documentation contents</SheetTitle>
            {tree}
          </SheetPopup>
        </Sheet>
        <span className="truncate text-sm">{findTitle(TREE, active)}</span>
      </header>

      <aside className="sticky top-0 hidden h-svh flex-col border-r border-border/60 bg-foreground/[0.02] md:flex">
        {tree}
      </aside>

      <main className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-6 text-muted-foreground md:min-h-svh">
        <div className="text-center">
          <StickyNoteIcon className="mx-auto size-6 opacity-40" />
          <p className="mt-3 text-sm">Selected · {active}</p>
        </div>
      </main>
    </div>
  );
}

function TreePanel({
  open,
  onToggle,
  active,
  onSelect,
}: {
  open: Record<string, boolean>;
  onToggle: (id: string) => void;
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border/60 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded bg-foreground/[0.08]">
            <BookmarkIcon className="size-3.5" />
          </div>
          <div className="font-medium text-sm">Documentation</div>
        </div>
        <button
          type="button"
          className="mt-3 flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-left transition-colors hover:bg-background pointer-coarse:min-h-11"
        >
          <SearchIcon className="size-3.5 opacity-50" />
          <span className="flex-1 truncate text-muted-foreground text-xs">
            Search docs…
          </span>
          <kbd className="rounded border border-border/60 bg-background/80 px-1 font-mono text-[10px] text-muted-foreground pointer-coarse:hidden">
            /
          </kbd>
        </button>
      </div>

      <nav aria-label="Documentation" className="flex-1 overflow-y-auto py-3">
        <ul role="tree" aria-label="Documentation pages">
          {TREE.map((doc) => (
            <TreeNode
              key={doc.id}
              doc={doc}
              depth={0}
              open={open}
              onToggle={onToggle}
              active={active}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </nav>

      <div className="border-t border-border/60 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground text-xs transition-colors hover:bg-foreground/[0.03] hover:text-foreground pointer-coarse:min-h-11"
        >
          <PlusIcon className="size-3.5" />
          New page
        </button>
      </div>
    </div>
  );
}

function TreeNode({
  doc,
  depth,
  open,
  onToggle,
  active,
  onSelect,
}: {
  doc: Doc;
  depth: number;
  open: Record<string, boolean>;
  onToggle: (id: string) => void;
  active: string;
  onSelect: (id: string) => void;
}) {
  const isFolder = !!doc.children?.length;
  const isOpen = open[doc.id] ?? false;
  const isActive = active === doc.id;

  return (
    <li
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={isFolder ? isOpen : undefined}
      aria-selected={isFolder ? undefined : isActive}
    >
      <button
        type="button"
        onClick={() =>
          isFolder ? onToggle(doc.id) : onSelect(doc.id)
        }
        // Indentation is capped so deep trees don't eat narrow screens.
        style={{ paddingLeft: `${Math.min(depth, 4) * 14 + 12}px` }}
        className={`flex w-full items-center gap-1.5 py-1 pr-3 text-left text-sm transition-colors pointer-coarse:min-h-11 ${
          isActive
            ? "bg-foreground/[0.08] text-foreground"
            : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
        }`}
      >
        {isFolder ? (
          isOpen ? (
            <ChevronDownIcon className="size-3.5 shrink-0 opacity-60" />
          ) : (
            <ChevronRightIcon className="size-3.5 shrink-0 opacity-60" />
          )
        ) : (
          <span className="size-3.5 shrink-0" />
        )}
        {isFolder ? (
          isOpen ? (
            <FolderOpenIcon className="size-3.5 shrink-0 opacity-70" />
          ) : (
            <FolderIcon className="size-3.5 shrink-0 opacity-70" />
          )
        ) : (
          <FileTextIcon className="size-3.5 shrink-0 opacity-60" />
        )}
        <span className="truncate">{doc.title}</span>
      </button>
      {isFolder && isOpen && doc.children ? (
        <ul role="group">
          {doc.children.map((child) => (
            <TreeNode
              key={child.id}
              doc={child}
              depth={depth + 1}
              open={open}
              onToggle={onToggle}
              active={active}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

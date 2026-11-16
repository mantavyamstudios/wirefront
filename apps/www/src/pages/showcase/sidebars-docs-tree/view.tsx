// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@wirefront/ui/sheet";
import { useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { BookmarkIcon, ChevronRightIcon, FileTextIcon, FolderIcon, FolderOpenIcon, ListTreeIcon, PlusIcon, SearchIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import type { DocNode } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("docsTreeShell.<key>"). */
export const DOCS_TREE_SHELL_MESSAGES = {
  title: "Documentation",
  contents: "Contents",
  contentsTitle: "Documentation contents",
  search: "Search docs…",
  newPage: "New page",
};

export interface DocsTreeShellProps {
  /** The page. Screens render inside the shell. */
  children: ReactNode;
  tree: DocNode[];
  /** The id of the page being shown; its folders open. */
  activeId?: string;
  /** Folders open on first render, besides the active page's. */
  defaultExpanded?: string[];
  /** Open your docs search. The field and "/" only work when given. */
  onSearch?: () => void;
  /** Start a page. Hidden when not given. */
  onNewPage?: () => void;
  className?: string;
}

/** The ids of every folder above the node with this id. */
function ancestorsOf(nodes: DocNode[], id: string, trail: string[] = []): string[] | undefined {
  for (const n of nodes) {
    if (n.id === id) return trail;
    const hit = n.children ? ancestorsOf(n.children, id, [...trail, n.id]) : undefined;
    if (hit) return hit;
  }
  return undefined;
}

function titleOf(nodes: DocNode[], id: string): string | undefined {
  for (const n of nodes) {
    if (n.id === id) return n.title;
    const hit = n.children ? titleOf(n.children, id) : undefined;
    if (hit) return hit;
  }
  return undefined;
}

export function DocsTreeShell({ children, tree, activeId, defaultExpanded = [], onSearch, onNewPage, className }: DocsTreeShellProps) {
  const t = useMessages("docsTreeShell", DOCS_TREE_SHELL_MESSAGES);
  const [navOpen, setNavOpen] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set([...defaultExpanded, ...(activeId ? (ancestorsOf(tree, activeId) ?? []) : [])]));
  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // "/" jumps to search, as the hint says.
  useEffect(() => {
    if (!onSearch) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      onSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSearch]);

  const row = "flex w-full items-center gap-1.5 py-1 pe-3 text-start text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset pointer-coarse:min-h-11";

  const renderNodes = (nodes: DocNode[], depth: number, inSheet: boolean): ReactNode =>
    nodes.map((node) => {
      const isFolder = Boolean(node.children?.length);
      const isOpen = expanded.has(node.id);
      const active = node.id === activeId;
      // Indentation is capped so deep trees don't eat narrow screens.
      const indent = { paddingInlineStart: `${Math.min(depth, 4) * 14 + 12}px` };
      const look = active ? "bg-foreground/[0.08] text-foreground" : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground";
      return (
        <li key={node.id}>
          {isFolder ? (
            <button aria-expanded={isOpen} className={cn(row, look)} onClick={() => toggle(node.id)} style={indent} type="button">
              <ChevronRightIcon aria-hidden className={cn("size-3.5 shrink-0 opacity-60 transition-transform motion-reduce:transition-none rtl:rotate-180", isOpen && "rotate-90 rtl:rotate-90")} />
              {isOpen ? <FolderOpenIcon aria-hidden className="size-3.5 shrink-0 opacity-70" /> : <FolderIcon aria-hidden className="size-3.5 shrink-0 opacity-70" />}
              <span className="truncate">{node.title}</span>
            </button>
          ) : node.href ? (
            <WirefrontLink aria-current={active ? "page" : undefined} className={cn(row, look)} href={node.href} onClick={() => inSheet && setNavOpen(false)} style={indent}>
              <span aria-hidden className="size-3.5 shrink-0" />
              <FileTextIcon aria-hidden className="size-3.5 shrink-0 opacity-60" />
              <span className="truncate">{node.title}</span>
            </WirefrontLink>
          ) : null}
          {isFolder && isOpen && node.children ? <ul>{renderNodes(node.children, depth + 1, inSheet)}</ul> : null}
        </li>
      );
    });

  const panel = (inSheet: boolean) => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-border/60 border-b px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div aria-hidden className="flex size-6 items-center justify-center rounded bg-foreground/[0.08]">
            <BookmarkIcon className="size-3.5" />
          </div>
          <div className="font-medium text-sm">{t.title}</div>
        </div>
        {onSearch ? (
          <button
            className="mt-3 flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-start outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11"
            onClick={() => {
              if (inSheet) setNavOpen(false);
              onSearch();
            }}
            type="button"
          >
            <SearchIcon aria-hidden className="size-3.5 opacity-50" />
            <span className="flex-1 truncate text-muted-foreground text-xs">{t.search}</span>
            <kbd className="rounded border border-border/60 bg-background/80 px-1 font-mono text-[10px] text-muted-foreground pointer-coarse:hidden">/</kbd>
          </button>
        ) : null}
      </div>
      <nav aria-label={t.title} className="flex-1 overflow-y-auto py-3">
        <ul>{renderNodes(tree, 0, inSheet)}</ul>
      </nav>
      {onNewPage ? (
        <div className="border-border/60 border-t px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground text-xs outline-none transition-colors hover:bg-foreground/[0.03] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11"
            onClick={onNewPage}
            type="button"
          >
            <PlusIcon aria-hidden className="size-3.5" />
            {t.newPage}
          </button>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={cn("min-h-svh bg-background text-foreground md:grid md:grid-cols-[280px_minmax(0,1fr)]", className)}>
      {/* Phones: content first, the tree behind a "Contents" trigger. */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-border/60 border-b bg-background/90 px-2 backdrop-blur md:hidden">
        <Sheet onOpenChange={setNavOpen} open={navOpen}>
          <SheetTrigger className="flex min-h-11 items-center gap-2 rounded-md px-2.5 text-muted-foreground text-sm transition-colors hover:bg-foreground/[0.04] hover:text-foreground">
            <ListTreeIcon aria-hidden className="size-4" />
            {t.contents}
          </SheetTrigger>
          <SheetContent className="max-w-[320px] bg-background" side="left">
            <SheetTitle className="sr-only">{t.contentsTitle}</SheetTitle>
            {panel(true)}
          </SheetContent>
        </Sheet>
        {activeId ? <span className="truncate text-sm">{titleOf(tree, activeId)}</span> : null}
      </header>

      <aside className="sticky top-0 hidden h-svh flex-col border-border/60 border-e bg-foreground/[0.02] md:flex">{panel(false)}</aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}

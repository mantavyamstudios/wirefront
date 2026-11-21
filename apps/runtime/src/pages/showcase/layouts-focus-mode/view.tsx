// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Progress } from "@base-ui/react/progress";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@wirefront/ui/sheet";
import { useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { FileTextIcon, ListIcon, Maximize2Icon, MenuIcon, Minimize2Icon, SearchIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import type { ReaderDocument } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("focusReader.<key>"). */
export const FOCUS_READER_MESSAGES = {
  progress: "Reading progress",
  openNavigation: "Open navigation",
  navigation: "Navigation",
  workspaceNav: "Workspace",
  documents: "Documents",
  quickFind: "Quick find…",
  onThisPage: "On this page",
  exitFocus: "Exit focus",
  escKey: "Esc",
  enterFocusMode: "Enter focus mode",
  exitFocusMode: "Exit focus mode",
};

export interface ReaderNavItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface FocusReaderProps {
  /** The article. Give its headings ids that match `toc`. */
  children: ReactNode;
  /** Your product or workspace name, top left. */
  brand: string;
  nav: ReaderNavItem[];
  documents: ReaderDocument[];
  /** The document being read. */
  activeDocumentId?: string;
  /** Sections of the article, linked by id. */
  toc: { id: string; label: string }[];
  user: { name: string };
  /** Open your search. Hidden when not given. */
  onSearch?: () => void;
  /** Start in focus mode. Esc leaves it. */
  defaultFocused?: boolean;
  className?: string;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export function FocusReader({ children, brand, nav, documents, activeDocumentId, toc, user, onSearch, defaultFocused = true, className }: FocusReaderProps) {
  const t = useMessages("focusReader", FOCUS_READER_MESSAGES);
  const [focused, setFocused] = useState(defaultFocused);
  const [progress, setProgress] = useState(0);

  // Reading progress follows the document scroll position.
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocused(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused]);

  const navPanel = (
    <nav aria-label={t.workspaceNav}>
      <ul className="flex flex-col gap-0.5">
        {nav.map((item) => (
          <li key={item.id}>
            <WirefrontLink
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-foreground/3 hover:text-foreground [&_svg]:size-4 [&_svg]:opacity-70 pointer-coarse:min-h-11"
              href={item.href}
            >
              {item.icon}
              {item.label}
            </WirefrontLink>
          </li>
        ))}
      </ul>
      <h2 className="mt-6 mb-1 px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t.documents}</h2>
      <ul className="flex flex-col gap-0.5">
        {documents.map((d) => {
          const active = d.id === activeDocumentId;
          return (
            <li key={d.id}>
              <WirefrontLink
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors pointer-coarse:min-h-11",
                  active ? "bg-foreground/6 text-foreground" : "text-muted-foreground hover:bg-foreground/3 hover:text-foreground",
                )}
                href={d.href}
              >
                <FileTextIcon aria-hidden className="size-3.5 opacity-60" />
                <span className="truncate">{d.title}</span>
              </WirefrontLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const tocList = (
    <ul className="flex flex-col gap-0.5">
      {toc.map((s) => (
        <li key={s.id}>
          <a className="block w-full rounded-md px-2 py-1.5 text-start text-muted-foreground text-sm transition-colors hover:bg-foreground/3 hover:text-foreground pointer-coarse:py-3" href={`#${s.id}`}>
            {s.label}
          </a>
        </li>
      ))}
    </ul>
  );

  const fade = "transition-all duration-300 motion-reduce:transition-none";

  return (
    <div className={cn("relative min-h-svh bg-background text-foreground", className)}>
      <Progress.Root aria-label={t.progress} className="fixed top-0 inset-s-0 inset-e-0 z-50" value={Math.round(progress)}>
        <Progress.Track className="h-0.5 w-full">
          <Progress.Indicator className="h-full bg-foreground transition-[width] duration-150 motion-reduce:transition-none" />
        </Progress.Track>
      </Progress.Root>

      <header className="fixed top-0 inset-e-0 inset-s-0 z-40 flex h-12 items-center justify-between gap-2 border-border/60 border-b bg-background/80 px-3 backdrop-blur sm:px-6">
        {/* Below xl the rails don't fit beside the article: open them as sheets. */}
        {!focused ? (
          <Sheet>
            <SheetTrigger
              aria-label={t.openNavigation}
              className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/4 hover:text-foreground xl:hidden pointer-coarse:size-11"
            >
              <MenuIcon className="size-4" />
            </SheetTrigger>
            <SheetContent className="max-w-70 bg-background px-3 py-4" side="left">
              <SheetTitle className="sr-only">{t.navigation}</SheetTitle>
              {navPanel}
            </SheetContent>
          </Sheet>
        ) : null}
        <div aria-hidden={focused} className={cn("flex items-center gap-2.5 max-sm:hidden", fade, focused ? "pointer-events-none -translate-x-2 opacity-0" : "opacity-100")}>
          <div aria-hidden className="size-6 rounded-md bg-linear-to-br from-primary/70 to-primary/30 ring-1 ring-border/60" />
          <span className="font-medium text-sm">{brand}</span>
        </div>
        {onSearch ? (
          <button
            className={cn("flex items-center gap-2 rounded-md border border-border/60 bg-card px-2.5 py-1 max-md:hidden", fade, focused ? "pointer-events-none opacity-0" : "opacity-100")}
            inert={focused}
            onClick={onSearch}
            type="button"
          >
            <SearchIcon aria-hidden className="size-3.5 opacity-50" />
            <span className="text-muted-foreground text-xs">{t.quickFind}</span>
            <Kbd className="text-[10px] pointer-coarse:hidden">⌘K</Kbd>
          </button>
        ) : null}
        <div className="ms-auto flex items-center gap-2 sm:gap-3">
          {!focused && toc.length ? (
            <Sheet>
              <SheetTrigger className="flex min-h-9 items-center gap-1.5 rounded-md px-2 text-muted-foreground text-xs transition-colors hover:bg-foreground/4 hover:text-foreground xl:hidden pointer-coarse:min-h-11">
                <ListIcon aria-hidden className="size-3.5" />
                {t.onThisPage}
              </SheetTrigger>
              <SheetContent className="max-w-75 bg-background px-5 py-6" side="right">
                <SheetTitle className="mb-3 px-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t.onThisPage}</SheetTitle>
                {tocList}
              </SheetContent>
            </Sheet>
          ) : null}
          {focused ? (
            <button className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 text-xs pointer-coarse:min-h-10" onClick={() => setFocused(false)} type="button">
              <Minimize2Icon aria-hidden className="size-3.5" />
              <span>{t.exitFocus}</span>
              <Kbd className="text-[10px] pointer-coarse:hidden">{t.escKey}</Kbd>
            </button>
          ) : (
            <Avatar className="size-7" title={user.name}>
              <AvatarFallback className="bg-foreground font-medium text-[11px] text-background">{initialsOf(user.name)}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </header>

      {/* Docked rails only at xl+, where they fit beside the centred article. */}
      <aside
        aria-hidden={focused}
        className={cn("fixed inset-s-0 top-12 bottom-0 z-30 hidden w-60 overflow-y-auto border-border/60 border-e bg-foreground/2 px-3 py-4 xl:block", fade, focused ? "pointer-events-none -translate-x-full opacity-0 rtl:translate-x-full" : "opacity-100")}
        inert={focused}
      >
        {navPanel}
      </aside>
      {toc.length ? (
        <aside
          aria-hidden={focused}
          className={cn("fixed inset-e-0 top-12 bottom-0 z-30 hidden w-70 overflow-y-auto border-border/60 border-s px-5 py-6 xl:block", fade, focused ? "pointer-events-none translate-x-full opacity-0 rtl:-translate-x-full" : "opacity-100")}
          inert={focused}
        >
          <h2 className="mb-3 px-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t.onThisPage}</h2>
          {tocList}
        </aside>
      ) : null}

      <main className={cn("mx-auto max-w-2xl px-5 pt-20 sm:px-6", fade, focused ? "pb-32 md:text-lg" : "pb-20")}>{children}</main>

      <button
        aria-label={focused ? t.exitFocusMode : t.enterFocusMode}
        className="fixed inset-e-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex size-11 items-center justify-center rounded-full border border-border/60 bg-card text-foreground shadow-sm transition-colors hover:bg-foreground/4 sm:inset-e-6 sm:bottom-6"
        onClick={() => setFocused((f) => !f)}
        type="button"
      >
        {focused ? <Maximize2Icon className="size-4" /> : <Minimize2Icon className="size-4" />}
      </button>
    </div>
  );
}

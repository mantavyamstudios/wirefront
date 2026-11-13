// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@wirefront/ui/dialog";
import { Kbd, KbdGroup } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import { KeyboardIcon, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";

import type { ShortcutGroup } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("shortcutsDialog.<key>"). */
export const SHORTCUTS_DIALOG_MESSAGES = {
  pageTitle: "Project board",
  trigger: "Shortcuts",
  title: "Keyboard shortcuts",
  search: "Search shortcuts",
  searchPlaceholder: "Search shortcuts…",
  total: "{count} total",
  noMatch: "No shortcuts match “{query}”.",
  reopenBefore: "Press",
  reopenAfter: "any time to reopen this list.",
};

export interface ShortcutsDialogProps {
  groups: ShortcutGroup[];
  /** The keys that open this dialog, e.g. ["⌘", "/"]. Pressing them (Ctrl on Windows and Linux for ⌘) opens it. */
  openKeys?: string[];
  /** A note on the end of the footer, e.g. the app version. */
  footerNote?: string;
  /** Open the dialog on first render. */
  defaultOpen?: boolean;
  className?: string;
}

/** Whether a keyboard event matches keys like ["⌘", "/"] (⌘ also matches Ctrl). */
function matches(event: KeyboardEvent, keys: string[]) {
  const wantsMod = keys.includes("⌘");
  const wantsShift = keys.includes("⇧");
  const key = keys.filter((k) => k !== "⌘" && k !== "⇧").at(-1)?.toLowerCase();
  return Boolean(key) && event.key.toLowerCase() === key && (event.metaKey || event.ctrlKey) === wantsMod && event.shiftKey === wantsShift;
}

function ShortcutsDialogScreen({ groups, openKeys = ["⌘", "/"], footerNote, defaultOpen, className }: ShortcutsDialogProps) {
  const t = useMessages("shortcutsDialog", SHORTCUTS_DIALOG_MESSAGES);
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = groups
    .map((g) => ({ ...g, shortcuts: g.shortcuts.filter((s) => !q || s.label.toLowerCase().includes(q) || s.keys.join(" ").toLowerCase().includes(q)) }))
    .filter((g) => g.shortcuts.length);
  const total = groups.reduce((sum, g) => sum + g.shortcuts.length, 0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!matches(event, openKeys)) return;
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openKeys]);

  return (
    // Real Dialog. The trigger is hidden on touch-only devices, where
    // keyboard shortcuts don't apply (the dialog still opens for the showcase).
    <div className={cn("relative min-h-svh bg-background", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <h1 className="font-heading text-2xl">{t.pageTitle}</h1>
        <Dialog
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setQuery("");
          }}
          open={open}
        >
          <DialogTrigger render={<Button className="pointer-coarse:hidden" variant="outline" />}>
            <KeyboardIcon />
            {t.trigger}
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-base">{t.title}</DialogTitle>
            </DialogHeader>

            <div className="border-border/60 border-y px-6 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-1.5 focus-within:ring-2 focus-within:ring-ring">
                <SearchIcon aria-hidden className="size-3.5 opacity-60" />
                <input
                  aria-label={t.search}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  type="search"
                  value={query}
                />
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{interpolate(t.total, { count: total })}</span>
              </div>
            </div>

            <div aria-live="polite" className="-mx-4 grid min-h-0 min-w-0 grid-cols-1 gap-x-8 overflow-y-auto px-4 sm:grid-cols-2">
              {shown.map((g) => (
                <section className="mb-6" key={g.name}>
                  <h2 className="mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{g.name}</h2>
                  <ul className="flex flex-col">
                    {g.shortcuts.map((s) => (
                      <li className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-foreground/[0.03]" key={s.label}>
                        <span className="min-w-0 text-sm">{s.label}</span>
                        <KbdGroup>
                          {s.keys.map((k) => (
                            <Kbd key={k}>{k}</Kbd>
                          ))}
                        </KbdGroup>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {shown.length === 0 ? <p className="py-8 text-center text-muted-foreground text-sm sm:col-span-2">{interpolate(t.noMatch, { query })}</p> : null}
            </div>

            <DialogFooter className="text-muted-foreground text-xs sm:items-center sm:justify-between">
              <span>
                {t.reopenBefore}{" "}
                <KbdGroup>
                  {openKeys.map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </KbdGroup>{" "}
                {t.reopenAfter}
              </span>
              {footerNote ? <span>{footerNote}</span> : null}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function ShortcutsDialog(props: ShortcutsDialogProps) {
  return (
    <ScreenBoundary name="ShortcutsDialog">
      <ShortcutsDialogScreen {...props} />
    </ScreenBoundary>
  );
}

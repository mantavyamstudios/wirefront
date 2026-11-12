// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@wirefront/ui/command";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { useMessages } from "@wirefront/ui/wirefront/provider";
import {
  ArrowRightIcon,
  CornerDownLeftIcon,
  FileTextIcon,
  FolderIcon,
  GitBranchIcon,
  HashIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UserPlusIcon,
  ZapIcon,
} from "lucide-react";
import { type ComponentType, useEffect, useState } from "react";

import type { CommandEntry, CommandKind, CommandGroup as Group } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("commandPalette.<key>"). */
export const COMMAND_PALETTE_MESSAGES = {
  title: "Workspace",
  trigger: "Search or jump to…",
  placeholder: "Type a command or search…",
  empty: "No results found.",
  footer: "Cmd-K",
  navigate: "navigate",
  select: "select",
};

export interface CommandPaletteProps {
  /** What to offer, in order: your app's commands plus any search results. */
  groups: Group[];
  /** Run the chosen entry (navigate, open a dialog…). The palette closes first. */
  onSelect: (entry: CommandEntry) => void;
  /** Called as the user types, e.g. to fetch matching documents into `groups`. */
  onQueryChange?: (query: string) => void;
  /** Open the palette on first render. */
  defaultOpen?: boolean;
  /** Also open with ⌘K / Ctrl+K. Defaults to true. */
  hotkey?: boolean;
  className?: string;
}

const ICONS: Record<CommandKind, ComponentType<{ className?: string }>> = {
  action: PlusIcon,
  invite: UserPlusIcon,
  switch: ZapIcon,
  document: FileTextIcon,
  project: FolderIcon,
  channel: HashIcon,
  branch: GitBranchIcon,
  settings: SettingsIcon,
};

export function CommandPalette({ groups, onSelect, onQueryChange, defaultOpen, hotkey = true, className }: CommandPaletteProps) {
  const t = useMessages("commandPalette", COMMAND_PALETTE_MESSAGES);
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const items = groups.map((g) => ({ value: g.label, id: g.id, items: g.items.map((entry) => ({ ...entry, value: entry.label })) }));

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);

  return (
    <div className={cn("relative min-h-svh bg-background", className)}>
      <div className="px-4 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-2xl">{t.title}</h1>
          <CommandDialog onOpenChange={setOpen} open={open}>
            <CommandDialogTrigger render={<Button variant="outline" />}>
              <SearchIcon />
              <span>{t.trigger}</span>
              <Kbd className="pointer-coarse:hidden">⌘K</Kbd>
            </CommandDialogTrigger>
            <CommandDialogPopup>
              <Command items={items} onValueChange={(value) => onQueryChange?.(String(value ?? ""))}>
                <CommandInput placeholder={t.placeholder} />
                <CommandEmpty>{t.empty}</CommandEmpty>
                <CommandList>
                  {(group: (typeof items)[number]) => (
                    <CommandGroup items={group.items} key={group.id}>
                      <CommandGroupLabel>{group.value}</CommandGroupLabel>
                      <CommandCollection>
                        {(entry: (typeof items)[number]["items"][number]) => {
                          const Icon = ICONS[entry.kind];
                          return (
                            <CommandItem
                              className="gap-2.5"
                              key={entry.id}
                              onClick={() => {
                                setOpen(false);
                                onSelect(entry);
                              }}
                              value={entry}
                            >
                              <Icon className="size-4 shrink-0 opacity-70" />
                              <span className="min-w-0 flex-1 truncate">
                                {entry.label}
                                {entry.hint ? <span className="ml-2 text-muted-foreground text-xs">{entry.hint}</span> : null}
                              </span>
                              {entry.shortcut ? (
                                <CommandShortcut className="pointer-coarse:hidden">{entry.shortcut}</CommandShortcut>
                              ) : (
                                <ArrowRightIcon className="size-3.5 opacity-30" />
                              )}
                            </CommandItem>
                          );
                        }}
                      </CommandCollection>
                    </CommandGroup>
                  )}
                </CommandList>
                {/* Keyboard legend only where there is a keyboard. */}
                <CommandFooter className="pointer-coarse:hidden">
                  <span>{t.footer}</span>
                  <span className="flex items-center gap-3 font-mono text-[10px]">
                    <span className="inline-flex items-center gap-1">
                      <Kbd>↑</Kbd>
                      <Kbd>↓</Kbd>
                      {t.navigate}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CornerDownLeftIcon className="size-3" />
                      {t.select}
                    </span>
                  </span>
                </CommandFooter>
              </Command>
            </CommandDialogPopup>
          </CommandDialog>
        </div>
        <div aria-hidden className="mt-4 grid grid-cols-1 gap-3 opacity-40 sm:grid-cols-2 lg:grid-cols-3">
          {PLACEHOLDER_CARDS.map((key) => (
            <div className="h-24 rounded-xl border border-border/60 bg-background" key={key} />
          ))}
        </div>
      </div>
    </div>
  );
}

const PLACEHOLDER_CARDS = ["p1", "p2", "p3", "p4", "p5", "p6"];

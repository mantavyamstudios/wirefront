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
import type { ComponentType } from "react";
import { Button } from "@orbit/ui/button";
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
} from "@orbit/ui/command";
import { Kbd } from "@orbit/ui/kbd";

interface Cmd {
  label: string;
  hint?: string;
  Icon: ComponentType<{ className?: string }>;
  shortcut?: string;
  active?: boolean;
}

const GROUPS: { name: string; items: Cmd[] }[] = [
  {
    name: "Suggestions",
    items: [
      { label: "Create new project", Icon: PlusIcon, shortcut: "C P", active: true },
      { label: "Invite teammate", hint: "via email", Icon: UserPlusIcon, shortcut: "I" },
      { label: "Switch workspace", hint: "Acme inc.", Icon: ZapIcon, shortcut: "⌘⇧W" },
    ],
  },
  {
    name: "Jump to",
    items: [
      { label: "Onboarding handbook v3", hint: "Document", Icon: FileTextIcon },
      { label: "design-system", hint: "Project", Icon: FolderIcon },
      { label: "#design-crit", hint: "Channel", Icon: HashIcon },
      { label: "feat/audit-log", hint: "Branch", Icon: GitBranchIcon },
    ],
  },
  {
    name: "Settings",
    items: [
      { label: "Open profile settings", Icon: SettingsIcon, shortcut: "G P" },
      { label: "Manage API keys", Icon: SettingsIcon },
    ],
  },
];

// Built on the Command primitive (Base UI Autocomplete inside a Dialog):
// combobox/listbox semantics, arrow-key navigation, Esc, focus trap.
const GROUPED = GROUPS.map((g) => ({
  value: g.name,
  items: g.items.map((c) => ({ ...c, value: c.label })),
}));

export function ModalsCommandPaletteShowcasePage() {
  return (
    <div className="relative min-h-svh bg-background">
      <div className="px-4 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="font-heading text-2xl">Workspace</div>
          <CommandDialog defaultOpen>
            <CommandDialogTrigger render={<Button variant="outline" />}>
              <SearchIcon />
              <span>Search or jump to…</span>
              <Kbd className="pointer-coarse:hidden">⌘K</Kbd>
            </CommandDialogTrigger>
            <CommandDialogPopup>
              <Command items={GROUPED}>
                <CommandInput placeholder="Type a command or search…" />
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandList>
                  {(group: (typeof GROUPED)[number]) => (
                    <CommandGroup key={group.value} items={group.items}>
                      <CommandGroupLabel>{group.value}</CommandGroupLabel>
                      <CommandCollection>
                        {(c: (typeof GROUPED)[number]["items"][number]) => (
                          <CommandItem key={c.value} value={c} className="gap-2.5">
                            <c.Icon className="size-4 shrink-0 opacity-70" />
                            <span className="min-w-0 flex-1 truncate">
                              {c.label}
                              {c.hint ? (
                                <span className="ml-2 text-muted-foreground text-xs">
                                  {c.hint}
                                </span>
                              ) : null}
                            </span>
                            {c.shortcut ? (
                              <CommandShortcut className="pointer-coarse:hidden">{c.shortcut}</CommandShortcut>
                            ) : (
                              <ArrowRightIcon className="size-3.5 opacity-30" />
                            )}
                          </CommandItem>
                        )}
                      </CommandCollection>
                    </CommandGroup>
                  )}
                </CommandList>
                {/* Keyboard legend only where there is a keyboard. */}
                <CommandFooter className="pointer-coarse:hidden">
                  <span>Cmd-K</span>
                  <span className="flex items-center gap-3 font-mono text-[10px]">
                    <span className="inline-flex items-center gap-1">
                      <Kbd>↑</Kbd>
                      <Kbd>↓</Kbd>
                      navigate
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CornerDownLeftIcon className="size-3" />
                      select
                    </span>
                  </span>
                </CommandFooter>
              </Command>
            </CommandDialogPopup>
          </CommandDialog>
        </div>
        <div aria-hidden className="mt-4 grid grid-cols-1 gap-3 opacity-40 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-border/60 bg-background"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

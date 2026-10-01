import { KeyboardIcon, SearchIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@orbit/ui/dialog";
import { Kbd, KbdGroup } from "@orbit/ui/kbd";

const GROUPS: { name: string; items: { keys: string[]; label: string }[] }[] = [
  {
    name: "General",
    items: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["⌘", "/"], label: "Show keyboard shortcuts" },
      { keys: ["G", "H"], label: "Go home" },
      { keys: ["G", "P"], label: "Go to projects" },
      { keys: ["G", "I"], label: "Go to inbox" },
    ],
  },
  {
    name: "Navigation",
    items: [
      { keys: ["J"], label: "Next item" },
      { keys: ["K"], label: "Previous item" },
      { keys: ["⌘", "↵"], label: "Open selected" },
      { keys: ["Esc"], label: "Close overlay" },
    ],
  },
  {
    name: "Editing",
    items: [
      { keys: ["⌘", "S"], label: "Save changes" },
      { keys: ["⌘", "Z"], label: "Undo" },
      { keys: ["⌘", "⇧", "Z"], label: "Redo" },
      { keys: ["⌘", "B"], label: "Bold" },
      { keys: ["⌘", "I"], label: "Italic" },
    ],
  },
  {
    name: "Issues",
    items: [
      { keys: ["C"], label: "New issue" },
      { keys: ["A"], label: "Assign to…" },
      { keys: ["L"], label: "Add label" },
      { keys: ["P"], label: "Set priority" },
      { keys: ["⌘", "⇧", "M"], label: "Mark as done" },
    ],
  },
];

export function ModalsShortcutsShowcasePage() {
  return (
    // Real Dialog. The trigger is hidden on touch-only devices, where
    // keyboard shortcuts don't apply (the dialog still opens for the showcase).
    <div className="relative min-h-svh bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-8 sm:px-10 sm:py-10">
        <div className="font-heading text-2xl">Project board</div>
      <Dialog defaultOpen>
        <DialogTrigger render={<Button variant="outline" className="pointer-coarse:hidden" />}>
          <KeyboardIcon />
          Shortcuts
        </DialogTrigger>
        <DialogPopup className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Keyboard shortcuts</DialogTitle>
          </DialogHeader>

          <div className="border-border/60 border-y px-6 py-3">
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-1.5">
              <SearchIcon className="size-3.5 opacity-60" />
              <input
                aria-label="Search shortcuts"
                placeholder="Search shortcuts…"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {GROUPS.reduce((sum, g) => sum + g.items.length, 0)} total
              </span>
            </div>
          </div>

          <DialogPanel className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {GROUPS.map((g) => (
              <div key={g.name} className="mb-6">
                <div className="mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                  {g.name}
                </div>
                <ul className="flex flex-col">
                  {g.items.map((s) => (
                    <li
                      key={s.label}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-foreground/[0.03]"
                    >
                      <span className="min-w-0 text-sm">{s.label}</span>
                      <KbdGroup>
                        {s.keys.map((k, i) => (
                          <Kbd key={i}>{k}</Kbd>
                        ))}
                      </KbdGroup>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </DialogPanel>

          <DialogFooter className="text-muted-foreground text-xs sm:items-center sm:justify-between">
            <span>
              Press <Kbd>⌘</Kbd>
              <Kbd>/</Kbd> any time to reopen this list.
            </span>
            <span>v3.4 · 47 shortcuts</span>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
      </div>
    </div>
  );
}

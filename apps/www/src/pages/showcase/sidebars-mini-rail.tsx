import { useState } from "react";
import {
  BellIcon,
  CheckIcon,
  ChevronDownIcon,
  CompassIcon,
  HomeIcon,
  InboxIcon,
  LayersIcon,
  PlusIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { Sheet, SheetPopup, SheetTitle, SheetTrigger } from "@orbit/ui/sheet";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@orbit/ui/tooltip";

const ITEMS = [
  { icon: HomeIcon, label: "Home" },
  { icon: InboxIcon, label: "Inbox", badge: 4 },
  { icon: BellIcon, label: "Activity" },
  { icon: LayersIcon, label: "Projects", active: true },
  { icon: UsersIcon, label: "People" },
  { icon: CompassIcon, label: "Discover" },
];

const WORKSPACES = [
  { letter: "A", name: "Acme inc.", color: "bg-gradient-to-br from-primary/70 to-primary/30", active: true },
  { letter: "B", name: "Bluefin", color: "bg-gradient-to-br from-emerald-500/70 to-emerald-500/30" },
  { letter: "M", name: "Moonbase", color: "bg-gradient-to-br from-amber-500/70 to-amber-500/30" },
];

// Bottom tab bars fit five destinations; the rest stay in the rail/overflow.
const MOBILE_TABS = ITEMS.slice(0, 5);

export function SidebarsMiniRailShowcasePage() {
  const active = WORKSPACES.find((w) => w.active)!;

  return (
    <div className="min-h-svh bg-background text-foreground md:grid md:grid-cols-[60px_minmax(0,1fr)]">
      {/* Mobile: top bar with workspace switcher */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border/60 bg-background/90 px-3 backdrop-blur md:hidden">
        <WorkspaceSwitcher current={active} />
        <div className="flex size-8 items-center justify-center rounded-full bg-foreground font-medium text-[11px] text-background">
          S
        </div>
      </header>

      {/* Desktop: 60px icon rail */}
      <aside className="sticky top-0 hidden h-svh flex-col items-center border-r border-border/60 bg-foreground/[0.02] py-3 md:flex">
        <ul className="flex flex-col items-center gap-1.5">
          {WORKSPACES.map((w) => (
            <li key={w.letter} className="relative">
              <RailTooltip label={w.name}>
                <TooltipTrigger
                  aria-label={`Switch to ${w.name}`}
                  aria-current={w.active ? "true" : undefined}
                  className={`flex size-9 items-center justify-center rounded-lg font-medium text-[12px] text-foreground/85 transition-transform hover:scale-105 ${w.color}`}
                >
                  {w.letter}
                </TooltipTrigger>
              </RailTooltip>
              {w.active ? (
                <span className="-translate-y-1/2 absolute top-1/2 -left-3 h-5 w-1 rounded-r-full bg-foreground" />
              ) : null}
            </li>
          ))}
          <li>
            <RailTooltip label="Add workspace">
              <TooltipTrigger
                aria-label="Add workspace"
                className="flex size-9 items-center justify-center rounded-lg border border-dashed border-border/70 text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
              >
                <PlusIcon className="size-4" />
              </TooltipTrigger>
            </RailTooltip>
          </li>
        </ul>

        <div className="my-4 h-px w-7 bg-border/60" />

        <nav aria-label="Main" className="flex flex-1 flex-col items-center">
          <ul className="flex flex-col items-center gap-1">
            {ITEMS.map((item) => (
              <li key={item.label} className="relative">
                <RailTooltip label={item.label}>
                  <TooltipTrigger
                    aria-label={item.badge ? `${item.label}, ${item.badge} unread` : item.label}
                    aria-current={item.active ? "page" : undefined}
                    className={`group flex size-9 items-center justify-center rounded-lg transition-colors ${
                      item.active
                        ? "bg-foreground/[0.08] text-foreground"
                        : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
                    }`}
                  >
                    <item.icon className="size-4" />
                  </TooltipTrigger>
                </RailTooltip>
                {item.active ? (
                  <span className="-translate-y-1/2 absolute top-1/2 -left-3 h-5 w-1 rounded-r-full bg-foreground" />
                ) : null}
                {item.badge ? <Badge count={item.badge} className="top-0.5 right-0.5" /> : null}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col items-center gap-2">
          <RailTooltip label="Settings">
            <TooltipTrigger
              aria-label="Settings"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
            >
              <SettingsIcon className="size-4" />
            </TooltipTrigger>
          </RailTooltip>
          <div className="flex size-8 items-center justify-center rounded-full bg-foreground font-medium text-[11px] text-background ring-2 ring-background">
            S
          </div>
        </div>
      </aside>

      <main className="flex min-h-[calc(100svh-3.5rem-4rem)] items-center justify-center px-6 pb-[calc(4rem+env(safe-area-inset-bottom))] text-muted-foreground md:min-h-svh md:pb-0">
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em]">
            Main pane
          </div>
          <p className="mt-1.5 text-sm">
            <span className="md:hidden">Primary destinations live in the bottom bar.</span>
            <span className="hidden md:inline">Mini rail — hover or focus for tooltips.</span>
          </p>
        </div>
      </main>

      {/* Mobile: bottom tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {MOBILE_TABS.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                aria-current={item.active ? "page" : undefined}
                className={`relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
                  item.active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="relative">
                  <item.icon className="size-5" />
                  {item.badge ? <Badge count={item.badge} className="-top-1.5 -right-2.5" /> : null}
                </span>
                {item.label}
                {item.badge ? <span className="sr-only">, {item.badge} unread</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function RailTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      {children}
      <TooltipPopup side="right">{label}</TooltipPopup>
    </Tooltip>
  );
}

function Badge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute flex size-4 items-center justify-center rounded-full bg-destructive font-medium text-[10px] text-destructive-foreground ring-2 ring-background ${className ?? ""}`}
    >
      {count}
    </span>
  );
}

function WorkspaceSwitcher({ current }: { current: (typeof WORKSPACES)[number] }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex min-h-11 items-center gap-2 rounded-md px-1.5 text-left transition-colors hover:bg-foreground/[0.04]">
        <span
          className={`flex size-8 items-center justify-center rounded-lg font-medium text-[12px] text-foreground/85 ${current.color}`}
        >
          {current.letter}
        </span>
        <span className="font-medium text-sm">{current.name}</span>
        <ChevronDownIcon className="size-3.5 opacity-60" />
      </SheetTrigger>
      <SheetPopup side="bottom" className="pb-[env(safe-area-inset-bottom)]">
        <div className="px-4 pt-4 pb-2">
          <SheetTitle className="font-heading text-base">Workspaces</SheetTitle>
        </div>
        <ul className="px-2 pb-3">
          {WORKSPACES.map((w) => (
            <li key={w.letter}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-current={w.active ? "true" : undefined}
                className="flex min-h-12 w-full items-center gap-3 rounded-md px-2 text-left text-sm transition-colors hover:bg-foreground/[0.04]"
              >
                <span
                  className={`flex size-8 items-center justify-center rounded-lg font-medium text-[12px] text-foreground/85 ${w.color}`}
                >
                  {w.letter}
                </span>
                <span className="flex-1">{w.name}</span>
                {w.active ? <CheckIcon className="size-4" /> : null}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="flex min-h-12 w-full items-center gap-3 rounded-md px-2 text-left text-muted-foreground text-sm transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
            >
              <span className="flex size-8 items-center justify-center rounded-lg border border-dashed border-border/70">
                <PlusIcon className="size-4" />
              </span>
              Add workspace
            </button>
          </li>
        </ul>
      </SheetPopup>
    </Sheet>
  );
}

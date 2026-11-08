import { useState } from "react";
import {
  BellIcon,
  ChevronDownIcon,
  CompassIcon,
  HashIcon,
  HomeIcon,
  InboxIcon,
  LayersIcon,
  MenuIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { Sheet, SheetPopup, SheetTitle, SheetTrigger } from "@orbit/ui/sheet";

const PRIMARY = [
  { icon: HomeIcon, label: "Home" },
  { icon: InboxIcon, label: "Inbox", badge: 4 },
  { icon: BellIcon, label: "Activity" },
  { icon: LayersIcon, label: "Projects", active: true },
  { icon: UsersIcon, label: "People" },
  { icon: CompassIcon, label: "Discover" },
];

const PROJECTS = [
  { name: "Onboarding redesign", color: "bg-emerald-500/80" },
  { name: "Q3 planning", color: "bg-amber-500/80", active: true },
  { name: "Marketing site", color: "bg-violet-500/80" },
  { name: "Dust storm", color: "bg-sky-500/80" },
];

const TEAMS = [
  { name: "design", count: 6 },
  { name: "engineering", count: 24 },
  { name: "growth", count: 4 },
];

// Rows grow to 44px on touch screens; desktop keeps the dense rhythm.
const ROW = "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors pointer-coarse:min-h-11";

export function SidebarsWorkspaceRailShowcasePage() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-svh bg-background text-foreground md:grid md:grid-cols-[260px_minmax(0,1fr)]">
      {/* Mobile: top bar + off-canvas rail */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-background/90 px-2 backdrop-blur md:hidden">
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger
            aria-label="Open navigation"
            className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
          >
            <MenuIcon className="size-5" />
          </SheetTrigger>
          <SheetPopup side="left" className="max-w-[300px] bg-background">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <RailContent inSheet onNavigate={() => setNavOpen(false)} />
          </SheetPopup>
        </Sheet>
        <WorkspaceMark />
        <span className="truncate font-medium text-sm">Acme inc.</span>
        <button
          type="button"
          aria-label="Search"
          className="ml-auto flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
        >
          <SearchIcon className="size-4" />
        </button>
      </header>

      {/* Desktop: docked rail */}
      <aside className="sticky top-0 hidden h-svh flex-col border-r border-border/60 bg-foreground/[0.02] md:flex">
        <RailContent />
      </aside>

      <main className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-6 text-muted-foreground md:min-h-svh md:px-10">
        <div className="text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em]">
            Main pane
          </div>
          <p className="mt-1.5 text-sm">Sidebar showcase — content omitted.</p>
        </div>
      </main>
    </div>
  );
}

function WorkspaceMark() {
  return (
    <div className="size-7 shrink-0 rounded-md bg-gradient-to-br from-primary/70 to-primary/30 ring-1 ring-border/60" />
  );
}

function RailContent({
  inSheet = false,
  onNavigate,
}: {
  inSheet?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <button
        type="button"
        aria-haspopup="menu"
        className={`flex w-full items-center justify-between gap-2 border-b border-border/60 px-3.5 py-3 text-left transition-colors hover:bg-foreground/[0.03] ${
          inSheet ? "pe-14" : ""
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <WorkspaceMark />
          <div className="min-w-0">
            <div className="truncate font-medium text-sm">Acme inc.</div>
            <div className="truncate font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              Pro · 24 members
            </div>
          </div>
        </div>
        <ChevronDownIcon className="size-3.5 shrink-0 opacity-60" />
      </button>

      <div className="px-3 pt-3">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-left transition-colors hover:bg-background pointer-coarse:min-h-11"
        >
          <SearchIcon className="size-3.5 opacity-50" />
          <span className="flex-1 truncate text-muted-foreground text-xs">
            Quick find…
          </span>
          <kbd className="rounded border border-border/60 bg-background/80 px-1 font-mono text-[10px] text-muted-foreground pointer-coarse:hidden">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav aria-label="Workspace" className="mt-3 flex-1 overflow-y-auto px-2 pb-4">
        <ul className="flex flex-col gap-0.5">
          {PRIMARY.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={onNavigate}
                aria-current={item.active ? "page" : undefined}
                className={`${ROW} justify-between ${
                  item.active
                    ? "bg-foreground/[0.06] text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <item.icon className="size-4 opacity-70" />
                  {item.label}
                </span>
                {item.badge ? (
                  <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                    {item.badge}
                    <span className="sr-only"> unread</span>
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>

        <SectionLabel>Projects</SectionLabel>
        <ul className="flex flex-col gap-0.5">
          {PROJECTS.map((p) => (
            <li key={p.name}>
              <button
                type="button"
                onClick={onNavigate}
                aria-current={p.active ? "page" : undefined}
                className={`${ROW} ${
                  p.active
                    ? "bg-foreground/[0.06] text-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground"
                }`}
              >
                <span className={`size-2 shrink-0 rounded-sm ${p.color}`} />
                <span className="truncate">{p.name}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={`${ROW} gap-2 text-muted-foreground/70 text-xs hover:bg-foreground/[0.03] hover:text-foreground`}
            >
              <PlusIcon className="size-3.5" />
              New project
            </button>
          </li>
        </ul>

        <SectionLabel>Teams</SectionLabel>
        <ul className="flex flex-col gap-0.5">
          {TEAMS.map((t) => (
            <li key={t.name}>
              <button
                type="button"
                onClick={onNavigate}
                className={`${ROW} justify-between text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground`}
              >
                <span className="flex items-center gap-2.5">
                  <HashIcon className="size-3.5 opacity-60" />
                  {t.name}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  {t.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-2 border-t border-border/60 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="flex size-7 items-center justify-center rounded-full bg-foreground font-medium text-[11px] text-background">
          M
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-sm">Mantavyam</div>
          <div className="flex items-center gap-1.5 truncate text-muted-foreground text-xs">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Online
          </div>
        </div>
        <button
          type="button"
          className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground pointer-coarse:size-11"
          aria-label="Settings"
        >
          <SettingsIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 mb-1 flex items-center justify-between px-2">
      <span className="font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.25em]">
        {children}
      </span>
    </div>
  );
}

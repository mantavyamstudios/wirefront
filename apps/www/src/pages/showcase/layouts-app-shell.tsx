// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import {
  BellIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  HashIcon,
  HomeIcon,
  InboxIcon,
  MenuIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@wirefront/ui/input-group";
import { Kbd } from "@wirefront/ui/kbd";
import { Sheet, SheetPopup, SheetTitle, SheetTrigger } from "@wirefront/ui/sheet";

const PRIMARY = [
  { key: "home", icon: HomeIcon, label: "Home" },
  { key: "inbox", icon: InboxIcon, label: "Inbox", badge: "4" },
  { key: "activity", icon: BellIcon, label: "Activity" },
];

const PROJECTS = [
  { key: "onboarding", name: "Onboarding redesign", color: "bg-emerald-500/80", count: "23" },
  { key: "q3", name: "Q3 planning", color: "bg-amber-500/80", count: "12" },
  { key: "marketing", name: "Marketing site", color: "bg-violet-500/80", count: "7" },
  { key: "dust", name: "Dust storm", color: "bg-sky-500/80", count: "31" },
];

const TEAMS = [
  { key: "design", name: "design" },
  { key: "engineering", name: "engineering" },
  { key: "growth", name: "growth" },
];

const STATS = [
  { label: "Unread", value: "12", delta: "+3 today" },
  { label: "Mentions", value: "3", delta: "+1 today" },
  { label: "Following", value: "8", delta: "2 active" },
];

const ACTIVITY = [
  { name: "Maya Chen", initials: "MC", action: "commented on Onboarding redesign", time: "2m ago" },
  { name: "Riya Patel", initials: "RP", action: "assigned you to Q3 planning", time: "14m ago" },
  { name: "Tomás García", initials: "TG", action: "mentioned you in Dust storm", time: "1h ago" },
  { name: "Jules Wren", initials: "JW", action: "merged a PR in Marketing site", time: "3h ago" },
  { name: "Priya Shah", initials: "PS", action: "shared a doc with Inbox", time: "yesterday" },
];

export function LayoutsAppShellShowcasePage() {
  const [activeItem, setActiveItem] = useState("inbox");
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 px-2 backdrop-blur sm:gap-4 md:px-4">
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger
            aria-label="Open navigation"
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground md:hidden"
          >
            <MenuIcon className="size-5" />
          </SheetTrigger>
          <SheetPopup side="left" className="max-w-[300px] bg-background">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarNav
              activeItem={activeItem}
              onSelect={(key) => {
                setActiveItem(key);
                setNavOpen(false);
              }}
            />
          </SheetPopup>
        </Sheet>

        <button
          type="button"
          aria-haspopup="menu"
          className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 transition-colors hover:bg-foreground/[0.03]"
        >
          <span className="size-6 shrink-0 rounded bg-gradient-to-br from-emerald-500/80 to-sky-500/70" />
          <span className="truncate whitespace-nowrap font-medium text-sm">Acme Inc.</span>
          <ChevronDownIcon className="size-3.5 shrink-0 opacity-60" />
        </button>

        {/* Inline search from md up; an icon button below that. */}
        <div className="mx-auto hidden w-full max-w-md md:block">
          <InputGroup>
            <InputGroupInput placeholder="Search…" aria-label="Search" />
            <InputGroupAddon align="inline-end">
              <Kbd>⌘K</Kbd>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" aria-label="Search" className="md:hidden">
            <SearchIcon />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <BellIcon />
          </Button>
          <div className="relative">
            <Avatar className="size-7">
              <AvatarFallback>MS</AvatarFallback>
            </Avatar>
            <span className="absolute right-0 bottom-0 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>
        </div>
      </header>

      <div className="flex-1 md:grid md:grid-cols-[256px_minmax(0,1fr)]">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] border-r border-border/60 bg-foreground/[0.015] md:block">
          <SidebarNav activeItem={activeItem} onSelect={setActiveItem} />
        </aside>

        <main className="min-w-0 p-4 md:p-6">
          <div className="font-mono text-muted-foreground text-xs">
            Home / Inbox
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <h1 className="font-heading text-2xl tracking-tight">Inbox</h1>
            <Button size="sm">
              <PlusIcon />
              New
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                  {s.label}
                </div>
                <div className="mt-2 font-heading text-2xl">{s.value}</div>
                <div className="mt-1 text-muted-foreground text-xs">
                  {s.delta}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
              Recent activity
            </div>
            <div className="rounded-xl border border-border bg-card">
              <ul className="divide-y divide-border/60">
                {ACTIVITY.map((a) => (
                  <li
                    key={a.name + a.time}
                    className="flex items-start gap-3 px-4 py-3 sm:items-center"
                  >
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback>{a.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-sm sm:flex sm:items-center sm:gap-3">
                      <p className="line-clamp-2 sm:line-clamp-1 sm:flex-1">
                        <span className="font-medium">{a.name}</span>{" "}
                        <span className="text-muted-foreground">{a.action}</span>
                      </p>
                      <span className="mt-0.5 block shrink-0 font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em] sm:mt-0 sm:tracking-[0.2em]">
                        {a.time}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarNav({
  activeItem,
  onSelect,
}: {
  activeItem: string;
  onSelect: (key: string) => void;
}) {
  const row = (active: boolean) =>
    `flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors pointer-coarse:min-h-11 ${
      active
        ? "bg-foreground/[0.06] text-foreground"
        : "text-muted-foreground hover:bg-foreground/[0.04]"
    }`;

  return (
    <nav aria-label="Workspace" className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto">
        <SidebarSection label="WORKSPACE" />
        <ul className="flex flex-col gap-0.5 px-2">
          {PRIMARY.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => onSelect(item.key)}
                aria-current={activeItem === item.key ? "page" : undefined}
                className={row(activeItem === item.key)}
              >
                <item.icon className="size-4 opacity-70" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>

        <SidebarSection label="PROJECTS" />
        <ul className="flex flex-col gap-0.5 px-2">
          {PROJECTS.map((p) => (
            <li key={p.key}>
              <button
                type="button"
                onClick={() => onSelect(p.key)}
                aria-current={activeItem === p.key ? "page" : undefined}
                className={row(activeItem === p.key)}
              >
                <span className={`size-2 shrink-0 rounded-sm ${p.color}`} />
                <span className="flex-1 truncate text-left">{p.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground/70">
                  {p.count}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <SidebarSection label="TEAMS" />
        <ul className="flex flex-col gap-0.5 px-2 pb-3">
          {TEAMS.map((t) => (
            <li key={t.key}>
              <button
                type="button"
                onClick={() => onSelect(t.key)}
                aria-current={activeItem === t.key ? "page" : undefined}
                className={row(activeItem === t.key)}
              >
                <HashIcon className="size-3.5 opacity-60" />
                <span className="flex-1 text-left">{t.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className="flex items-center gap-2 border-t border-border/60 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-left transition-colors hover:bg-foreground/[0.03]"
      >
        <Avatar className="size-7">
          <AvatarFallback>MS</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-sm">Mantavyam</div>
          <div className="truncate text-muted-foreground text-xs">
            hello@mantavyam.com
          </div>
        </div>
        <ChevronUpIcon className="size-3.5 opacity-60" />
      </button>
    </nav>
  );
}

function SidebarSection({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1.5 font-mono text-[10px] text-muted-foreground tracking-[0.25em]">
      {label}
    </div>
  );
}

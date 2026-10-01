import { useState } from "react";
import { ArchiveIcon, ChevronLeftIcon, FilterIcon, InboxIcon, SearchIcon } from "lucide-react";

interface Thread {
  id: string;
  initials: string;
  color: string;
  name: string;
  preview: string;
  time: string;
  unread?: boolean;
  active?: boolean;
  pinned?: boolean;
}

const THREADS: Thread[] = [
  {
    id: "1",
    initials: "MO",
    color: "bg-emerald-500/80",
    name: "Maya Okafor",
    preview: "I rewrote the audit log query — should we land it tonight or…",
    time: "2m",
    unread: true,
    pinned: true,
  },
  {
    id: "2",
    initials: "JL",
    color: "bg-amber-500/80",
    name: "James Lin",
    preview: "Wrapped the migration. Feel free to merge whenever.",
    time: "14m",
    unread: true,
  },
  {
    id: "3",
    initials: "RP",
    color: "bg-violet-500/80",
    name: "Riya Patel",
    preview: "Heads up — invite emails are bouncing for big-corp.com",
    time: "1h",
    unread: true,
    active: true,
  },
  {
    id: "4",
    initials: "DK",
    color: "bg-sky-500/80",
    name: "Dani Kim",
    preview: "Bookmarked your sidebar design from yesterday, super clean.",
    time: "3h",
  },
  {
    id: "5",
    initials: "AT",
    color: "bg-rose-500/80",
    name: "Alex Tran",
    preview: "Pricing page copy is ready for your eyes.",
    time: "Yesterday",
  },
  {
    id: "6",
    initials: "BF",
    color: "bg-orange-500/80",
    name: "Ben Flores",
    preview: "Approved the new permission scopes — see you on standup.",
    time: "Mon",
  },
  {
    id: "7",
    initials: "SQ",
    color: "bg-cyan-500/80",
    name: "Sara Quinn",
    preview: "We should chat about the empty-state copy direction.",
    time: "Mon",
  },
];

const TABS = ["Unread · 3", "All", "Mentions"] as const;

export function SidebarsInboxRailShowcasePage() {
  const [selectedId, setSelectedId] = useState(
    THREADS.find((t) => t.active)?.id ?? THREADS[0]!.id,
  );
  // Below md the list and the conversation are separate views.
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Unread · 3");
  const selected = THREADS.find((t) => t.id === selectedId) ?? THREADS[0]!;

  return (
    <div className="min-h-svh bg-background text-foreground md:grid md:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
      <aside
        className={`flex min-h-svh flex-col border-border/60 bg-foreground/[0.02] md:sticky md:top-0 md:h-svh md:min-h-0 md:border-r ${
          mobileView === "detail" ? "max-md:hidden" : ""
        }`}
      >
        <div className="border-b border-border/60 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <InboxIcon className="size-4 opacity-70" />
              <h1 className="font-medium text-sm">Inbox</h1>
              <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                3<span className="sr-only"> unread</span>
              </span>
            </div>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground pointer-coarse:size-11"
              aria-label="Filter"
            >
              <FilterIcon className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            className="mt-3 flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-left transition-colors hover:bg-background pointer-coarse:min-h-11"
          >
            <SearchIcon className="size-3.5 opacity-50" />
            <span className="flex-1 truncate text-muted-foreground text-xs">
              Search…
            </span>
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Filter threads"
          className="flex items-center gap-1 border-b border-border/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.2em]"
        >
          {TABS.map((t) => (
            <Tab key={t} active={tab === t} onClick={() => setTab(t)}>
              {t}
            </Tab>
          ))}
        </div>

        <ul className="flex-1 overflow-y-auto">
          {THREADS.map((t) => {
            const isActive = t.id === selected.id;
            return (
              <li key={t.id} className="border-b border-border/40">
                <button
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => {
                    setSelectedId(t.id);
                    setMobileView("detail");
                  }}
                  className={`relative w-full px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "md:bg-foreground/[0.06]"
                      : "hover:bg-foreground/[0.03]"
                  }`}
                >
                  {t.unread ? (
                    <span className="-translate-y-1/2 absolute top-1/2 left-1.5 size-1.5 rounded-full bg-primary">
                      <span className="sr-only">Unread</span>
                    </span>
                  ) : null}
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full font-medium text-[11px] text-background ${t.color}`}
                    >
                      {t.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-sm ${t.unread ? "font-semibold" : "font-medium"}`}
                        >
                          {t.name}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground/70">
                          {t.time}
                        </span>
                      </div>
                      <p
                        className={`mt-0.5 line-clamp-2 text-xs leading-snug ${t.unread ? "text-foreground/80" : "text-muted-foreground"}`}
                      >
                        {t.preview}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-border/60 px-4 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          <span>{THREADS.length} threads</span>
          <button
            type="button"
            className="inline-flex min-h-8 items-center gap-1 rounded px-1.5 transition-colors hover:text-foreground pointer-coarse:min-h-11"
          >
            <ArchiveIcon className="size-3" />
            Archive read
          </button>
        </div>
      </aside>

      <main
        className={`flex min-h-svh flex-col md:min-h-0 ${
          mobileView === "list" ? "max-md:hidden" : ""
        }`}
      >
        {/* Mobile-only back bar for the detail view */}
        <div className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border/60 bg-background/90 px-2 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="flex min-h-11 items-center gap-1 rounded-md px-2 text-muted-foreground text-sm transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
          >
            <ChevronLeftIcon className="size-4" />
            Inbox
          </button>
          <span className="truncate font-medium text-sm">{selected.name}</span>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 text-center text-muted-foreground">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em]">
              Conversation pane
            </div>
            <p className="mt-1.5 text-sm">
              {selected.name} — {selected.preview}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Tab({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`min-h-7 rounded px-2 py-1 transition-colors pointer-coarse:min-h-11 ${
        active
          ? "bg-foreground/[0.08] text-foreground"
          : "text-muted-foreground/70 hover:bg-foreground/[0.03] hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

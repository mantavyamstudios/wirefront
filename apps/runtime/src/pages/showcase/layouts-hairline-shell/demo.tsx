// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the shell around a sample issue tracker (devl.dev's original
// page), inside devl.dev's frame. Not shipped by the registry; builders render
// their own pages as children.

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import {
  ChevronRightIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
  HouseIcon,
  InboxIcon,
  LayersIcon,
  type LucideIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SignalHighIcon,
  SignalLowIcon,
  SignalMediumIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@wirefront/ui/tooltip";
import { cn } from "@wirefront/ui/lib/utils";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { type AnchorHTMLAttributes, createContext, useContext } from "react";
import { DevlFrame } from "../_devl-frame";
import { HairlineShell } from "./view";

type HairlineTone = "orange" | "teal" | "cyan" | "violet" | "rose" | "info" | "success" | "warning";

interface HairlineWorkspace {
  id: string;
  name: string;
  initial: string;
  tone: HairlineTone;
}

interface HairlineNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface HairlineProject {
  id: string;
  name: string;
  tone: HairlineTone;
  prefix?: string;
  open?: number;
}

interface HairlineIssue {
  id: string;
  title: string;
  status: "progress" | "todo" | "backlog";
  priority: "high" | "medium" | "low";
  label?: { name: string; tone: HairlineTone };
  assignee: string;
  due?: string;
  project?: string;
  unread?: boolean;
}


const swatch: Record<HairlineTone, string> = {
  "orange": "bg-category-7",
  "teal": "bg-category-6",
  "cyan": "bg-category-6",
  "violet": "bg-category-5",
  "rose": "bg-category-4",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
};

const spring = { type: "spring", stiffness: 500, damping: 40 } as const;

const defaultWorkspaces: HairlineWorkspace[] = [
  { id: "northwind", name: "Northwind", initial: "N", tone: "info" },
  { id: "pilot", name: "Pilot Studio", initial: "P", tone: "teal" },
];

const defaultNav: HairlineNavItem[] = [
  { id: "home", label: "Home", icon: HouseIcon },
  { id: "inbox", label: "Inbox", icon: InboxIcon, count: 4 },
  { id: "mine", label: "My issues", icon: CircleDotIcon },
  { id: "views", label: "Views", icon: LayersIcon },
];

const defaultProjects: HairlineProject[] = [
  { id: "billing", name: "Billing v2", tone: "teal", prefix: "BIL" },
  { id: "atlas", name: "Atlas redesign", tone: "orange", prefix: "ATL" },
  { id: "mobile", name: "Mobile beta", tone: "info", prefix: "MOB" },
  { id: "growth", name: "Growth", tone: "violet", prefix: "GRO" },
  { id: "infra", name: "Infra", tone: "rose", prefix: "INF" },
];

const defaultIssues: HairlineIssue[] = [
  { id: "BIL-142", title: "Prorate seat changes mid-cycle", status: "progress", priority: "high", label: { name: "Pricing", tone: "orange" }, assignee: "IM", due: "Oct 28" },
  { id: "BIL-139", title: "Retry failed card charges with backoff", status: "progress", priority: "high", label: { name: "Payments", tone: "teal" }, assignee: "KT", due: "Oct 30" },
  { id: "BIL-151", title: "Invoice PDF uses workspace logo", status: "progress", priority: "medium", assignee: "RL" },
  { id: "BIL-128", title: "Usage meter rounds to two decimals", status: "progress", priority: "low", label: { name: "Bug", tone: "warning" }, assignee: "TB", due: "Nov 2" },
  { id: "BIL-155", title: "Tax ID field for EU workspaces", status: "todo", priority: "high", label: { name: "Compliance", tone: "info" }, assignee: "IM", due: "Nov 6", unread: true },
  { id: "BIL-157", title: "Show next invoice estimate on plan page", status: "todo", priority: "medium", label: { name: "Pricing", tone: "orange" }, assignee: "RL" },
  { id: "BIL-160", title: "Webhook for subscription.paused", status: "todo", priority: "medium", label: { name: "API", tone: "violet" }, assignee: "KT" },
  { id: "BIL-161", title: "Downgrade flow keeps annual discount", status: "todo", priority: "low", assignee: "TB", due: "Nov 9" },
  { id: "BIL-163", title: "Copy pass on failed payment emails", status: "todo", priority: "low", assignee: "RL" },
  { id: "BIL-118", title: "Credit notes for partial refunds", status: "backlog", priority: "medium", label: { name: "Payments", tone: "teal" }, assignee: "KT" },
  { id: "BIL-121", title: "Multi-currency price books", status: "backlog", priority: "low", label: { name: "Pricing", tone: "orange" }, assignee: "IM" },
  { id: "BIL-124", title: "Export invoices as CSV", status: "backlog", priority: "low", assignee: "TB" },
  { id: "ATL-212", title: "Collapse sidebar to an icon rail", status: "progress", priority: "high", label: { name: "Design", tone: "violet" }, assignee: "IM", due: "Oct 29", project: "atlas", unread: true },
  { id: "ATL-208", title: "Breadcrumb overflow on narrow screens", status: "progress", priority: "medium", label: { name: "Bug", tone: "warning" }, assignee: "RL", project: "atlas" },
  { id: "ATL-219", title: "Keyboard map for navigation", status: "todo", priority: "medium", assignee: "KT", project: "atlas" },
  { id: "ATL-224", title: "Empty states for project pages", status: "todo", priority: "low", label: { name: "Design", tone: "violet" }, assignee: "TB", project: "atlas" },
  { id: "ATL-190", title: "Audit icon sizes in the sidebar", status: "backlog", priority: "low", assignee: "KT", project: "atlas" },
  { id: "MOB-88", title: "Push notifications for mentions only", status: "progress", priority: "high", label: { name: "API", tone: "violet" }, assignee: "KT", due: "Nov 4", project: "mobile" },
  { id: "MOB-91", title: "Offline drafts survive app restarts", status: "todo", priority: "medium", assignee: "IM", project: "mobile", unread: true },
  { id: "MOB-95", title: "Deep links open the right workspace", status: "todo", priority: "low", assignee: "RL", project: "mobile" },
  { id: "MOB-73", title: "Haptics on swipe actions", status: "backlog", priority: "low", assignee: "TB", project: "mobile" },
  { id: "GRO-31", title: "Guided first project checklist", status: "progress", priority: "medium", label: { name: "Onboarding", tone: "teal" }, assignee: "IM", project: "growth" },
  { id: "GRO-34", title: "Test invite email subject lines", status: "todo", priority: "low", assignee: "RL", project: "growth" },
  { id: "GRO-22", title: "Drop company size from signup", status: "backlog", priority: "low", assignee: "KT", project: "growth" },
  { id: "INF-57", title: "Alert on p95 latency, not p50", status: "progress", priority: "high", label: { name: "Reliability", tone: "rose" }, assignee: "TB", due: "Oct 31", project: "infra" },
  { id: "INF-61", title: "Runbook for the failover drill", status: "todo", priority: "medium", assignee: "IM", project: "infra", unread: true },
];

const people: Record<string, string> = {
  IM: "bg-category-6/16 text-category-6-foreground",
  KT: "bg-info/16 text-info-foreground",
  RL: "bg-category-7/16 text-category-7-foreground",
  TB: "bg-category-5/20 text-category-5-foreground",
};

const groups = [
  { id: "progress", label: "In progress", icon: CircleDotIcon, tone: "text-warning-foreground" },
  { id: "todo", label: "Todo", icon: CircleIcon, tone: "text-muted-foreground" },
  { id: "backlog", label: "Backlog", icon: CircleDashedIcon, tone: "text-muted-foreground" },
] as const;

const priorityIcon = { high: SignalHighIcon, medium: SignalMediumIcon, low: SignalLowIcon };

function IssueList({ issues, fresh, onAdd }: { issues: HairlineIssue[]; fresh: string | null; onAdd: (status: HairlineIssue["status"]) => void }) {
  const [closed, setClosed] = useState<string[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const issuesRef = useRef(issues);
  issuesRef.current = issues;

  useEffect(() => {
    if (!fresh) return;
    const status = issuesRef.current.find((i) => i.id === fresh)?.status;
    setClosed((c) => c.filter((g) => g !== status));
    setFocus(fresh);
    const raf = requestAnimationFrame(() =>
      listRef.current?.querySelector<HTMLButtonElement>(`[data-issue="${fresh}"]`)?.focus(),
    );
    return () => cancelAnimationFrame(raf);
  }, [fresh]);

  // j/k and the arrow keys move between rows.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.addEventListener("keydown", onKeyDown);
    return () => list.removeEventListener("keydown", onKeyDown);
  });

  const onKeyDown = (e: globalThis.KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "j", "k"].includes(e.key)) return;
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("[data-issue]") ?? []);
    const i = rows.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "ArrowDown" || e.key === "j" ? Math.min(rows.length - 1, i + 1) : Math.max(0, i - 1);
    rows[next]?.focus();
    setFocus(rows[next]?.dataset.issue ?? null);
    e.preventDefault();
  };

  return (
    <div className="min-w-0" ref={listRef}>
      {groups.map((g) => {
        const rows = issues.filter((i) => i.status === g.id);
        if (rows.length === 0) return null;
        const isOpen = !closed.includes(g.id);
        return (
          <section key={g.id}>
            <div className="sticky top-0 z-10 flex h-9 items-center border-b bg-background pe-2">
              <button
                aria-expanded={isOpen}
                className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 ps-4 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset @3xl:ps-5"
                onClick={() => setClosed((c) => (isOpen ? [...c, g.id] : c.filter((x) => x !== g.id)))}
                type="button"
              >
                <ChevronRightIcon
                  className={cn("size-3.5 text-muted-foreground transition-transform duration-200 ease-out", isOpen && "rotate-90")}
                />
                <g.icon className={cn("size-3.5", g.tone)} />
                <span className="font-medium text-[13px]">{g.label}</span>
                <span className="text-muted-foreground text-xs tabular-nums">{rows.length}</span>
              </button>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button aria-label={`New issue in ${g.label}`} onClick={() => onAdd(g.id)} size="icon-sm" variant="ghost" />
                  }
                >
                  <PlusIcon />
                </TooltipTrigger>
                <TooltipContent>New issue in {g.label}</TooltipContent>
              </Tooltip>
            </div>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.ul
                  animate={{ height: "auto" }}
                  className="overflow-hidden"
                  exit={{ height: 0 }}
                  initial={{ height: 0 }}
                  transition={spring}
                >
                  <AnimatePresence initial={false}>
                    {rows.map((issue) => {
                      const P = priorityIcon[issue.priority];
                      return (
                        <motion.li
                          animate={{ height: "auto", opacity: 1 }}
                          className="border-b last:border-b-0"
                          initial={{ height: 0, opacity: 0 }}
                          key={issue.id}
                          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        >
                          <button
                            className={cn(
                              "group/issue relative flex h-10 w-full cursor-pointer items-center gap-3 px-4 text-start outline-none transition-colors duration-150 hover:bg-accent/60 focus-visible:bg-accent @3xl:h-9 @3xl:px-5",
                              focus === issue.id && "bg-accent",
                            )}
                            data-issue={issue.id}
                            onClick={() => setFocus(issue.id)}
                            onFocus={() => setFocus(issue.id)}
                            type="button"
                          >
                            {focus === issue.id && <span aria-hidden className="absolute inset-y-0 inset-s-0 w-0.5 bg-foreground" />}
                            <P
                              aria-label={`${issue.priority} priority`}
                              className={cn(
                                "size-3.5 shrink-0",
                                issue.priority === "high" ? "text-foreground" : "text-muted-foreground",
                              )}
                            />
                            <span className="hidden w-16 shrink-0 font-mono text-muted-foreground text-xs @md:block">
                              {issue.id}
                            </span>
                            <g.icon className={cn("size-3.5 shrink-0", g.tone)} />
                            <span className="min-w-0 flex-1 truncate text-[13px]">
                              {issue.title}
                            </span>
                            {issue.label && (
                              <span className="hidden h-5 shrink-0 items-center gap-1.5 rounded-full border px-2 text-[11px] text-muted-foreground @2xl:inline-flex">
                                <span className={cn("size-1.5 rounded-full", swatch[issue.label.tone])} />
                                {issue.label.name}
                              </span>
                            )}
                            <span className="hidden w-12 shrink-0 text-end text-muted-foreground text-xs tabular-nums @xl:block">
                              {issue.due ?? ""}
                            </span>
                            <Avatar className="size-5 shrink-0">
                              <AvatarFallback className={cn("text-[9px]", people[issue.assignee] ?? "bg-muted")}>
                                {issue.assignee}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </motion.ul>
              )}
            </AnimatePresence>
          </section>
        );
      })}
    </div>
  );
}

function EmptyPane({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-xs/5">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-pretty text-muted-foreground text-xs">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function IssueBoard({ issues }: { issues: HairlineIssue[] }) {
  return (
    <div className="grid min-h-full grid-cols-1 divide-y @lg:grid-cols-3 @lg:divide-x @lg:divide-y-0">
      {groups.map((g) => {
        const rows = issues.filter((i) => i.status === g.id);
        return (
          <div className="flex flex-col gap-1.5 p-2" key={g.id}>
            <div className="flex h-8 items-center gap-2 px-2">
              <g.icon className={cn("size-3.5", g.tone)} />
              <span className="font-medium">{g.label}</span>
              <span className="text-muted-foreground text-xs tabular-nums">{rows.length}</span>
            </div>
            {rows.map((issue, i) => {
              const P = priorityIcon[issue.priority];
              return (
                <motion.button
                  animate={{ opacity: 1, y: 0 }}
                  className="flex cursor-pointer flex-col gap-2 rounded-lg border bg-card p-2.5 text-start outline-none transition-[background-color,scale] duration-150 ease-out hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
                  initial={{ opacity: 0, y: 6 }}
                  key={issue.id}
                  transition={{ ...spring, delay: i * 0.025 }}
                  type="button"
                >
                  <span className="flex items-center gap-2 text-muted-foreground text-xs">
                    <span className="font-mono">{issue.id}</span>
                    <Avatar className="ms-auto size-4.5">
                      <AvatarFallback className={cn("text-[8px]", people[issue.assignee] ?? "bg-muted")}>
                        {issue.assignee}
                      </AvatarFallback>
                    </Avatar>
                  </span>
                  <span className="line-clamp-2 leading-snug">{issue.title}</span>
                  <span className="flex items-center gap-2 text-muted-foreground text-xs">
                    <P className="size-3.5" />
                    {issue.label && (
                      <span className="inline-flex items-center gap-1">
                        <span className={cn("size-1.5 rounded-full", swatch[issue.label.tone])} />
                        {issue.label.name}
                      </span>
                    )}
                    {issue.due && <span className="ms-auto tabular-nums">{issue.due}</span>}
                  </span>
                </motion.button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}


const COLOR: Record<HairlineTone, number> = { orange: 7, teal: 6, cyan: 6, violet: 5, rose: 4, info: 1, success: 2, warning: 3 };

const GoContext = createContext<(id: string) => void>(() => {});

/** Hash links switch the demo's page instead of navigating. */
function DemoLink({ href, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const go = useContext(GoContext);
  return (
    <a
      {...props}
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (href?.startsWith("#")) {
          e.preventDefault();
          go(href.slice(1));
        }
      }}
    />
  );
}

export function LayoutsHairlineShellShowcasePage() {
  const user = { name: "Ines Moreau", initials: "IM" };
  const [workspace, setWorkspace] = useState(defaultWorkspaces[0]?.id ?? "");
  const [active, setActive] = useState(defaultProjects[0]?.id ?? "home");
  const [view, setView] = useState<"list" | "board">("list");
  const [items, setItems] = useState(defaultIssues);
  const [fresh, setFresh] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const viewGroup = useId();

  const project = defaultProjects.find((p) => p.id === active);
  const navItem = defaultNav.find((n) => n.id === active);
  const title = project?.name ?? navItem?.label ?? "Search";
  const scope = (i: HairlineIssue) => i.project ?? defaultProjects[0]?.id;
  const q = query.trim().toLowerCase();
  const visible = items.filter((i) => {
    if (project) return scope(i) === project.id;
    if (active === "mine") return i.assignee === user.initials;
    if (active === "inbox") return i.unread;
    if (active === "views") return false;
    if (active === "search") return !q || i.title.toLowerCase().includes(q) || i.id.toLowerCase().includes(q);
    return true;
  });
  const inProgress = visible.filter((i) => i.status === "progress").length;

  useEffect(() => {
    if (!fresh) return;
    const t = setTimeout(() => setFresh(null), 600);
    return () => clearTimeout(t);
  }, [fresh]);

  const addIssue = (status: HairlineIssue["status"] = "todo") => {
    const target = project ?? defaultProjects[0];
    if (!target) return;
    const prefix = target.prefix ?? target.name.slice(0, 3).toUpperCase();
    const top = Math.max(0, ...items.filter((i) => i.id.startsWith(`${prefix}-`)).map((i) => Number(i.id.split("-")[1]) || 0));
    const id = `${prefix}-${top + 1}`;
    setItems((xs) => [{ id, title: "Untitled issue", status, priority: "medium", assignee: user.initials, project: target.id }, ...xs]);
    setActive(target.id);
    setFresh(id);
  };

  return (
    <DevlFrame>
      <GoContext.Provider value={setActive}>
        <WirefrontProvider link={DemoLink}>
          <HairlineShell
            actions={
              <>
                <LayoutGroup id={viewGroup}>
                  <RadioGroup aria-label="Layout" className="hidden items-center rounded-md border p-0.5 @lg:flex" onValueChange={(v) => setView(v as "list" | "board")} value={view}>
                    {(["list", "board"] as const).map((v) => (
                      <Radio.Root
                        className={cn(
                          "relative h-6 cursor-pointer rounded-[calc(var(--radius)*0.5)] px-2 text-xs capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          view === v ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                        key={v}
                        value={v}
                      >
                        {view === v && <motion.span className="absolute inset-0 rounded-[calc(var(--radius)*0.5)] bg-accent" layoutId="hairline-view" transition={spring} />}
                        <span className="relative">{v}</span>
                      </Radio.Root>
                    ))}
                  </RadioGroup>
                </LayoutGroup>
                <Button aria-label="New issue" onClick={() => addIssue()} size="sm">
                  <PlusIcon />
                  <span className="hidden @md:inline">New issue</span>
                </Button>
              </>
            }
            activeId={active}
            className="h-190"
            currentWorkspaceId={workspace}
            footer={
              <>
                <span className="tabular-nums">
                  {visible.length} {visible.length === 1 ? "issue" : "issues"} · {inProgress} in progress
                </span>
                <span className="ms-auto flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-success" />
                  Synced
                  <RefreshCwIcon className="hidden size-3 @md:inline" />
                </span>
              </>
            }
            nav={defaultNav.map((n) => ({
              id: n.id,
              label: n.label,
              href: `#${n.id}`,
              icon: <n.icon />,
              count: n.id === "inbox" ? items.filter((i) => i.unread).length : n.count,
            }))}
            onNew={() => addIssue()}
            onNewWorkspace={() => {}}
            onSearch={() => setActive("search")}
            onShortcuts={() => {}}
            onSignOut={() => {}}
            onSwitchWorkspace={setWorkspace}
            profileHref="#profile"
            projects={defaultProjects.map((p) => ({ id: p.id, name: p.name, href: `#${p.id}`, color: COLOR[p.tone], count: items.filter((i) => scope(i) === p.id).length }))}
            settingsHref="#settings"
            title={
              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1">
                <span className="hidden text-muted-foreground @md:inline">Northwind</span>
                <ChevronRightIcon aria-hidden className="hidden size-3.5 text-muted-foreground @md:inline" />
                <span aria-current="page" className="truncate font-medium">
                  {title}
                </span>
              </nav>
            }
            user={user}
            workspaces={defaultWorkspaces.map((w) => ({ id: w.id, name: w.name, color: COLOR[w.tone] }))}
          >
            {active === "search" && (
              <div className="sticky top-0 z-20 flex h-11 items-center gap-2 border-b bg-background px-4 @3xl:px-5">
                <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
                <input
                  aria-label="Search issues"
                  className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title or ID"
                  value={query}
                />
                {query && (
                  <Button aria-label="Clear search" onClick={() => setQuery("")} size="icon-xs" variant="ghost">
                    <XIcon />
                  </Button>
                )}
              </div>
            )}
            {active === "views" ? (
              <EmptyPane body="Save a filter, like high priority bugs due this week, and it will live here." icon={LayersIcon} title="No saved views yet" />
            ) : visible.length === 0 ? (
              <EmptyPane body="Issues you create or are assigned will show up here." icon={CircleDashedIcon} title="Nothing here" />
            ) : view === "list" ? (
              <IssueList fresh={fresh} issues={visible} onAdd={addIssue} />
            ) : (
              <IssueBoard issues={visible} />
            )}
          </HairlineShell>
        </WirefrontProvider>
      </GoContext.Provider>
    </DevlFrame>
  );
}

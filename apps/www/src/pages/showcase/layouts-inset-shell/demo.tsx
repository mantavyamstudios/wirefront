// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Showcase only: the shell with demo navigation and sample pages inside it.
// Not shipped by the registry; builders pass their own nav and render their pages as children.

import { LayoutGroup, motion } from "motion/react";
import {
  CalendarIcon,
  ChartColumnIcon,
  ChevronRightIcon,
  CircleDotIcon,
  FileTextIcon,
  HouseIcon,
  InboxIcon,
  KeyboardIcon,
  LayoutGridIcon,
  type LucideIcon,
  PlusIcon,
  SettingsIcon,
  Share2Icon,
  UserRoundIcon,
} from "lucide-react";
import { type AnchorHTMLAttributes, createContext, type ReactNode, useContext, useId, useState } from "react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { DevlFrame } from "../_devl-frame";
import * as fixtures from "./fixtures";
import { InsetShell, type NavSection } from "./view";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";

// shadcn's Badge has no status tones; render them as a secondary badge with
// Wirefront's semantic tokens.
const TONE_CLASS = {
  success: "bg-success/8 text-success-foreground dark:bg-success/16",
  warning: "bg-warning/8 text-warning-foreground dark:bg-warning/16",
  info: "bg-info/8 text-info-foreground dark:bg-info/16",
  error: "bg-destructive/8 text-destructive-foreground dark:bg-destructive/16",
} as const;
type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
const badgeVariant = (v: string): BadgeVariant => (v in TONE_CLASS ? "secondary" : (v as BadgeVariant));
const badgeTone = (v: string): string | undefined => TONE_CLASS[v as keyof typeof TONE_CLASS];

type ShellTone = "orange" | "teal" | "cyan" | "violet" | "rose" | "info" | "success" | "warning";

interface ShellProject {
  id: string;
  name: string;
  tone: ShellTone;
  open?: number;
}

const dot: Record<ShellTone, string> = {
  "orange": "bg-orange-500",
  "teal": "bg-teal-500",
  "cyan": "bg-cyan-500",
  "violet": "bg-violet-500",
  "rose": "bg-rose-500",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
};

const soft: Record<ShellTone, string> = {
  orange: "bg-orange-500/14",
  teal: "bg-teal-500/14",
  cyan: "bg-cyan-500/14",
  violet: "bg-violet-500/14",
  rose: "bg-rose-500/14",
  info: "bg-info/14",
  success: "bg-success/14",
  warning: "bg-warning/14",
};

const spring = { type: "spring", stiffness: 420, damping: 36 } as const;

const demoNav: { id: string; label: string; icon: LucideIcon; count?: number }[] = [
  { id: "home", label: "Home", icon: HouseIcon },
  { id: "inbox", label: "Inbox", icon: InboxIcon, count: 4 },
  { id: "issues", label: "My issues", icon: CircleDotIcon, count: 6 },
  { id: "projects", label: "Projects", icon: LayoutGridIcon },
  { id: "docs", label: "Docs", icon: FileTextIcon },
  { id: "reports", label: "Reports", icon: ChartColumnIcon },
];

const defaultProjects: ShellProject[] = [
  { id: "atlas", name: "Atlas redesign", tone: "orange", open: 24 },
  { id: "billing", name: "Billing v2", tone: "teal", open: 9 },
  { id: "mobile", name: "Mobile beta", tone: "info", open: 17 },
  { id: "growth", name: "Growth experiments", tone: "violet", open: 6 },
  { id: "infra", name: "Infra hardening", tone: "rose", open: 3 },
];

type Status = "on-track" | "at-risk" | "done";

interface ProjectDetail {
  summary: string;
  status: Status;
  progress: number;
  week: number;
  open: number;
  total: number;
  target: string;
  targetIn: string;
  targetNote: string;
  milestones: { name: string; date: string; done: number }[];
  updates: { who: string; what: string; target: string; to?: string; time: string }[];
}

const people: Record<string, { initials: string; tone: string }> = {
  "Kai Tanaka": { initials: "KT", tone: "bg-blue-500/14 text-blue-700 dark:text-blue-300" },
  "Rosa Lind": { initials: "RL", tone: "bg-orange-500/14 text-orange-800 dark:text-orange-300" },
  "Ines Moreau": { initials: "IM", tone: "bg-teal-500/16 text-teal-800 dark:text-teal-300" },
  "Theo Brandt": { initials: "TB", tone: "bg-violet-500/16 text-violet-700 dark:text-violet-300" },
};

const details: Record<string, ProjectDetail> = {
  atlas: {
    summary: "A calmer navigation model for Orbit: fewer top-level items, projects one click away, and a sidebar that gets out of the way.",
    status: "on-track",
    progress: 68,
    week: 9,
    open: 24,
    total: 76,
    target: "Nov 14",
    targetIn: "in 21 days",
    targetNote: "Beta review with 50 teams",
    milestones: [
      { name: "Research synthesis", date: "Oct 4", done: 100 },
      { name: "Navigation & IA", date: "Oct 22", done: 82 },
      { name: "Component audit", date: "Nov 3", done: 46 },
      { name: "Beta to 50 teams", date: "Nov 14", done: 12 },
    ],
    updates: [
      { who: "Kai Tanaka", what: "moved", target: "Sidebar density pass", to: "In review", time: "12m" },
      { who: "Rosa Lind", what: "commented on", target: "Breadcrumb overflow", time: "48m" },
      { who: "Ines Moreau", what: "closed", target: "Empty states for projects", time: "2h" },
      { who: "Theo Brandt", what: "added", target: "Keyboard map for nav", to: "Backlog", time: "3h" },
    ],
  },
  billing: {
    summary: "Usage-based pricing with prorated seat changes, a clearer invoice and fewer failed renewals.",
    status: "at-risk",
    progress: 41,
    week: 3,
    open: 9,
    total: 22,
    target: "Dec 2",
    targetIn: "in 39 days",
    targetNote: "Migrate the first 200 workspaces",
    milestones: [
      { name: "Pricing model sign-off", date: "Oct 1", done: 100 },
      { name: "Proration engine", date: "Oct 28", done: 64 },
      { name: "Invoice redesign", date: "Nov 12", done: 20 },
      { name: "Staged migration", date: "Dec 2", done: 0 },
    ],
    updates: [
      { who: "Theo Brandt", what: "flagged", target: "Tax rounding for EU", to: "Blocked", time: "25m" },
      { who: "Ines Moreau", what: "moved", target: "Retry failed charges", to: "In progress", time: "1h" },
      { who: "Kai Tanaka", what: "closed", target: "Seat count webhook", time: "4h" },
    ],
  },
  mobile: {
    summary: "A native iOS and Android app for triage on the go: inbox, quick replies and push for mentions.",
    status: "on-track",
    progress: 55,
    week: 6,
    open: 17,
    total: 38,
    target: "Nov 28",
    targetIn: "in 35 days",
    targetNote: "TestFlight to 400 testers",
    milestones: [
      { name: "Navigation shell", date: "Oct 10", done: 100 },
      { name: "Inbox and replies", date: "Nov 1", done: 70 },
      { name: "Push notifications", date: "Nov 18", done: 30 },
      { name: "Public beta", date: "Nov 28", done: 0 },
    ],
    updates: [
      { who: "Rosa Lind", what: "shipped", target: "Swipe to archive", time: "40m" },
      { who: "Kai Tanaka", what: "commented on", target: "Offline drafts", time: "2h" },
      { who: "Theo Brandt", what: "moved", target: "Deep links", to: "In review", time: "5h" },
    ],
  },
  growth: {
    summary: "Small weekly bets on activation: a shorter signup, a guided first project and better invite emails.",
    status: "on-track",
    progress: 30,
    week: 4,
    open: 6,
    total: 14,
    target: "Dec 15",
    targetIn: "in 52 days",
    targetNote: "Lift week-one activation to 45%",
    milestones: [
      { name: "Signup in two steps", date: "Oct 18", done: 100 },
      { name: "Guided first project", date: "Nov 8", done: 35 },
      { name: "Invite email tests", date: "Nov 25", done: 10 },
      { name: "Readout", date: "Dec 15", done: 0 },
    ],
    updates: [
      { who: "Ines Moreau", what: "started", target: "Invite subject line test", time: "1h" },
      { who: "Rosa Lind", what: "closed", target: "Remove company size field", time: "1d" },
    ],
  },
  infra: {
    summary: "Fewer pages at night: faster deploy rollbacks, regional failover for the API and saner alert thresholds.",
    status: "done",
    progress: 92,
    week: 5,
    open: 3,
    total: 41,
    target: "Oct 31",
    targetIn: "in 7 days",
    targetNote: "Failover drill with on-call",
    milestones: [
      { name: "One-click rollback", date: "Sep 20", done: 100 },
      { name: "Alert threshold review", date: "Oct 6", done: 100 },
      { name: "Regional failover", date: "Oct 24", done: 100 },
      { name: "Failover drill", date: "Oct 31", done: 60 },
    ],
    updates: [
      { who: "Kai Tanaka", what: "closed", target: "Failover for eu-west", time: "3h" },
      { who: "Theo Brandt", what: "scheduled", target: "Drill with on-call", to: "Oct 31", time: "6h" },
    ],
  },
};

const statusBadge: Record<Status, { label: string; variant: "success" | "warning" | "info" }> = {
  "on-track": { label: "On track", variant: "success" },
  "at-risk": { label: "At risk", variant: "warning" },
  done: { label: "Wrapping up", variant: "info" },
};

const ease = [0.23, 1, 0.32, 1] as const;

const owners: Record<string, { lead: string; start: string; team: string }> = {
  atlas: { lead: "Kai Tanaka", start: "Sep 8", team: "Design" },
  billing: { lead: "Theo Brandt", start: "Sep 15", team: "Payments" },
  mobile: { lead: "Rosa Lind", start: "Sep 1", team: "Mobile" },
  growth: { lead: "Ines Moreau", start: "Oct 6", team: "Growth" },
  infra: { lead: "Kai Tanaka", start: "Aug 25", team: "Platform" },
};

function PersonDot({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn("size-5", className)}>
      <AvatarFallback className={cn("font-medium text-[9px]", people[name]?.tone)}>{people[name]?.initials}</AvatarFallback>
    </Avatar>
  );
}

function ProgressRing({ value, tone }: { value: number; tone: ShellTone }) {
  const r = 6;
  const c = 2 * Math.PI * r;
  return (
    <svg aria-hidden className="size-4 -rotate-90" viewBox="0 0 16 16">
      <circle className="stroke-muted" cx="8" cy="8" fill="none" r={r} strokeWidth="2.5" />
      <motion.circle
        animate={{ strokeDashoffset: c * (1 - value / 100) }}
        className={ringTone[tone]}
        cx="8"
        cy="8"
        fill="none"
        initial={{ strokeDashoffset: c }}
        r={r}
        strokeDasharray={c}
        strokeLinecap="round"
        strokeWidth="2.5"
        transition={{ duration: 0.6, ease, delay: 0.1 }}
      />
    </svg>
  );
}

const ringTone: Record<ShellTone, string> = {
  orange: "stroke-orange-500",
  teal: "stroke-teal-500",
  cyan: "stroke-cyan-500",
  violet: "stroke-violet-500",
  rose: "stroke-rose-500",
  info: "stroke-info",
  success: "stroke-success",
  warning: "stroke-warning",
};

function Properties({ project, d, className }: { project: ShellProject; d: ProjectDetail; className?: string }) {
  const o = owners[project.id] ?? owners.atlas;
  const badge = statusBadge[d.status];
  const members = Array.from(new Set([o.lead, ...d.updates.map((u) => u.who)]));
  const row = "flex min-h-8 items-center gap-2";
  return (
    <dl className={cn("grid grid-cols-[88px_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm", className)}>
      <dt className={cn(row, "text-muted-foreground text-xs")}>Status</dt>
      <dd className={row}>
        <Badge variant={badgeVariant(badge.variant)} className={badgeTone(badge.variant)}>{badge.label}</Badge>
      </dd>
      <dt className={cn(row, "text-muted-foreground text-xs")}>Lead</dt>
      <dd className={cn(row, "min-w-0")}>
        <PersonDot name={o.lead} />
        <span className="truncate">{o.lead}</span>
      </dd>
      <dt className={cn(row, "text-muted-foreground text-xs")}>Members</dt>
      <dd className={row}>
        <span className="flex -space-x-1">
          {members.map((m) => (
            <PersonDot className="bg-background ring-2 ring-background" key={m} name={m} />
          ))}
        </span>
        <span className="text-muted-foreground text-xs tabular-nums">{members.length}</span>
      </dd>
      <dt className={cn(row, "text-muted-foreground text-xs")}>Dates</dt>
      <dd className={cn(row, "tabular-nums")}>
        <CalendarIcon className="size-3.5 text-muted-foreground" />
        {o.start}
        <ChevronRightIcon className="size-3 text-muted-foreground" />
        {d.target}
      </dd>
      <dt className={cn(row, "text-muted-foreground text-xs")}>Team</dt>
      <dd className={row}>
        <span className="inline-flex h-6 items-center gap-1.5 rounded-md border px-2 text-xs">
          <span className={cn("size-1.5 rounded-full", dot[project.tone])} />
          {o.team}
        </span>
      </dd>
    </dl>
  );
}

function ProjectOverview({ project }: { project: ShellProject }) {
  const d = details[project.id] ?? details.atlas;
  const [tab, setTab] = useState("overview");
  const tabId = useId();
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "issues", label: "Issues", count: d.open },
    { id: "docs", label: "Docs", count: d.milestones.length + 3 },
    { id: "activity", label: "Activity" },
  ];
  const closed = d.total - d.open;
  return (
    <div className="mx-auto flex w-full max-w-5xl gap-10 px-4 py-6 @3xl:px-8 @3xl:py-8">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className={cn("flex size-8 items-center justify-center rounded-lg", soft[project.tone])}>
            <span className={cn("size-2.5 rounded-full", dot[project.tone])} />
          </span>
          <h1 className="mt-2 text-balance font-heading font-semibold text-2xl tracking-tight">{project.name}</h1>
          <p className="max-w-xl text-pretty text-muted-foreground">{d.summary}</p>
        </div>

        <Properties className="rounded-xl border bg-card px-4 py-3 @4xl:hidden" d={d} project={project} />

        <LayoutGroup id={tabId}>
          <div className="flex gap-1 overflow-x-auto border-b [scrollbar-width:none]" role="tablist">
            {tabs.map((t) => (
              <button
                aria-selected={tab === t.id}
                className={cn(
                  "relative flex h-9 shrink-0 cursor-pointer items-center gap-1.5 px-2.5 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                key={t.id}
                onClick={() => setTab(t.id)}
                role="tab"
                type="button"
              >
                {t.label}
                {t.count !== undefined && <span className="text-muted-foreground text-xs tabular-nums">{t.count}</span>}
                {tab === t.id && (
                  <motion.span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-foreground" layoutId="tab" transition={spring} />
                )}
              </button>
            ))}
          </div>
        </LayoutGroup>

        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-medium">Progress</h2>
            <span className="text-muted-foreground text-xs tabular-nums">
              <span className="text-success-foreground">+{d.week}%</span> this week
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                animate={{ scaleX: d.progress / 100 }}
                className={cn("h-full origin-left rounded-full", dot[project.tone])}
                initial={{ scaleX: 0 }}
                key={project.id}
                transition={{ duration: 0.6, ease, delay: 0.1 }}
              />
            </div>
            <span className="w-10 text-right font-medium tabular-nums">{d.progress}%</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground text-xs tabular-nums">
            <span>
              <span className="font-medium text-foreground">{closed}</span> done
            </span>
            <span>
              <span className="font-medium text-foreground">{d.open}</span> open
            </span>
            <span>
              Target <span className="font-medium text-foreground">{d.target}</span> · {d.targetIn}
            </span>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Milestones</h2>
            <Button className="-me-2" size="xs" variant="ghost">
              <PlusIcon />
              Add
            </Button>
          </div>
          <ul className="divide-y rounded-xl border bg-card">
            {d.milestones.map((m) => {
              const done = m.done === 100;
              return (
                <li className="flex h-11 items-center gap-3 px-3.5" key={m.name}>
                  <span
                    aria-label={done ? "Complete" : `${m.done}% complete`}
                    className={cn(
                      "size-2.5 shrink-0 rotate-45 rounded-[calc(var(--radius)*0.2)] border",
                      done ? "border-success bg-success" : m.done > 0 ? cn("border-transparent", dot[project.tone]) : "border-muted-foreground/50",
                    )}
                    role="img"
                  />
                  <span className={cn("min-w-0 flex-1 truncate", done && "text-muted-foreground")}>{m.name}</span>
                  <span className="w-10 text-right text-muted-foreground text-xs tabular-nums">{m.done}%</span>
                  <span className="w-14 text-right text-muted-foreground text-xs tabular-nums">{m.date}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-medium">Latest updates</h2>
          <ul className="relative flex flex-col gap-4 before:absolute before:top-3 before:bottom-3 before:left-[9.5px] before:w-px before:bg-border">
            {d.updates.map((u) => (
              <li className="relative flex gap-3" key={u.target}>
                <PersonDot className="bg-background ring-4 ring-background" name={u.who} />
                <p className="min-w-0 flex-1 text-pretty text-muted-foreground leading-5">
                  <span className="font-medium text-foreground">{u.who}</span> {u.what}{" "}
                  <span className="text-foreground">{u.target}</span>
                  {u.to && (
                    <>
                      {" "}
                      to <span className="text-foreground">{u.to}</span>
                    </>
                  )}
                </p>
                <span className="text-muted-foreground text-xs tabular-nums leading-5">{u.time} ago</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside aria-label="Project properties" className="hidden w-64 shrink-0 flex-col gap-4 @4xl:flex">
        <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs">
          <ProgressRing tone={project.tone} value={d.progress} />
          <span className="tabular-nums">{d.progress}% complete</span>
        </div>
        <Properties d={d} project={project} />
        <div className="border-t pt-4 text-muted-foreground text-xs leading-5">
          <div className="font-medium text-foreground">Next up</div>
          {d.targetNote} on <span className="text-foreground tabular-nums">{d.target}</span>.
        </div>
      </aside>
    </div>
  );
}

const inbox = [
  { who: "Kai Tanaka", what: "assigned you", target: "Sidebar density pass", where: "Atlas redesign", time: "12m", unread: true },
  { who: "Rosa Lind", what: "mentioned you on", target: "Breadcrumb overflow", where: "Atlas redesign", time: "48m", unread: true },
  { who: "Theo Brandt", what: "asked for review on", target: "Tax rounding for EU", where: "Billing v2", time: "1h", unread: true },
  { who: "Ines Moreau", what: "replied on", target: "Swipe to archive", where: "Mobile beta", time: "3h", unread: true },
  { who: "Kai Tanaka", what: "closed", target: "Failover for eu-west", where: "Infra hardening", time: "Yesterday", unread: false },
];

const myIssues = [
  { id: "ATL-212", title: "Collapse sidebar to an icon rail", project: "atlas", state: "In progress" },
  { id: "ATL-219", title: "Keyboard map for navigation", project: "atlas", state: "Todo" },
  { id: "BIL-142", title: "Prorate seat changes mid-cycle", project: "billing", state: "In progress" },
  { id: "MOB-88", title: "Push for mentions only", project: "mobile", state: "Todo" },
  { id: "GRO-31", title: "Guided first project checklist", project: "growth", state: "In review" },
  { id: "INF-57", title: "Alert on p95 latency, not p50", project: "infra", state: "Todo" },
];

const docs = [
  { title: "Navigation principles", project: "atlas", edited: "Edited 2h ago by Rosa Lind" },
  { title: "Pricing FAQ for support", project: "billing", edited: "Edited yesterday by Theo Brandt" },
  { title: "Mobile beta test plan", project: "mobile", edited: "Edited Mon by Kai Tanaka" },
  { title: "On-call handbook", project: "infra", edited: "Edited Oct 12 by Ines Moreau" },
];

function NavPage({ id, label, icon: Icon, projects, onOpenProject }: { id: string; label: string; icon: LucideIcon; projects: ShellProject[]; onOpenProject: (p: ShellProject) => void }) {
  const projectBy = (pid: string) => projects.find((p) => p.id === pid);
  const rowCls = "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left outline-none transition-[background-color,scale] duration-150 ease-out hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]";
  const intro: Record<string, string> = {
    home: "Your projects at a glance.",
    inbox: "Mentions, assignments and reviews waiting on you.",
    issues: "Everything assigned to you, across projects.",
    projects: "Every project in this workspace.",
    docs: "Recently edited docs you can open.",
    reports: "Charts and weekly digests for this workspace.",
  };
  let body: ReactNode;
  if (id === "home" || id === "projects") {
    body = (
      <ul className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
        {projects.map((p) => {
          const d = details[p.id];
          return (
            <li key={p.id}>
              <button
                className="flex w-full cursor-pointer flex-col gap-3 rounded-2xl border bg-card p-4 text-left outline-none transition-[border-color,scale] duration-150 ease-out hover:border-foreground/16 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
                onClick={() => onOpenProject(p)}
                type="button"
              >
                <span className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", dot[p.tone])} />
                  <span className="font-medium">{p.name}</span>
                  {d && <Badge variant={badgeVariant(statusBadge[d.status].variant)} className={cn(badgeTone(statusBadge[d.status].variant), "ms-auto")}>{statusBadge[d.status].label}</Badge>}
                </span>
                {d && (
                  <>
                    <span className="h-1 overflow-hidden rounded-full bg-muted">
                      <span className={cn("block h-full origin-left rounded-full", dot[p.tone])} style={{ transform: `scaleX(${d.progress / 100})` }} />
                    </span>
                    <span className="flex justify-between text-muted-foreground text-xs tabular-nums">
                      <span>{d.progress}% · {p.open ?? d.open} open</span>
                      <span>Due {d.target}</span>
                    </span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    );
  } else if (id === "inbox") {
    body = (
      <ul className="-mx-3 flex flex-col">
        {inbox.map((n) => (
          <li key={n.target}>
            <button className={rowCls} type="button">
              <Avatar className="size-7">
                <AvatarFallback className={cn("text-[10px]", people[n.who]?.tone)}>{people[n.who]?.initials}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-muted-foreground">
                  <span className="font-medium text-foreground">{n.who}</span> {n.what} <span className="text-foreground">{n.target}</span>
                </span>
                <span className="block truncate text-muted-foreground text-xs">{n.where}</span>
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">{n.time}</span>
              <span className={cn("size-1.5 shrink-0 rounded-full", n.unread ? "bg-info" : "bg-transparent")} />
            </button>
          </li>
        ))}
      </ul>
    );
  } else if (id === "issues") {
    body = (
      <ul className="-mx-3 flex flex-col">
        {myIssues.map((i) => {
          const p = projectBy(i.project);
          return (
            <li key={i.id}>
              <button className={rowCls} type="button">
                <span className="w-16 shrink-0 font-mono text-muted-foreground text-xs">{i.id}</span>
                <span className="min-w-0 flex-1 truncate">{i.title}</span>
                {p && (
                  <span className="hidden items-center gap-1.5 text-muted-foreground text-xs @md:flex">
                    <span className={cn("size-1.5 rounded-full", dot[p.tone])} />
                    {p.name}
                  </span>
                )}
                <span className="w-20 text-right text-muted-foreground text-xs">{i.state}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  } else if (id === "docs") {
    body = (
      <ul className="-mx-3 flex flex-col">
        {docs.map((doc) => {
          const p = projectBy(doc.project);
          return (
            <li key={doc.title}>
              <button className={rowCls} type="button">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-card text-muted-foreground">
                  <FileTextIcon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{doc.title}</span>
                  <span className="block truncate text-muted-foreground text-xs">{doc.edited}</span>
                </span>
                {p && (
                  <span className="hidden items-center gap-1.5 text-muted-foreground text-xs @md:flex">
                    <span className={cn("size-1.5 rounded-full", dot[p.tone])} />
                    {p.name}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    );
  } else {
    body = (
      <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
        <span className="flex size-10 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-xs/5">
          <Icon className="size-5" />
        </span>
        <h2 className="mt-4 font-medium">No {label.toLowerCase()} yet</h2>
        <p className="mt-1 max-w-xs text-pretty text-muted-foreground text-xs">
          Start one from a project to track progress over time. It will show up here for the whole workspace.
        </p>
        <Button className="mt-4" size="sm" variant="outline">
          <PlusIcon />
          New report
        </Button>
      </div>
    );
  }
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-6 @3xl:px-8 @3xl:py-8">
      <div>
        <h1 className="text-balance font-heading font-semibold text-xl tracking-tight">{label}</h1>
        <p className="mt-1 text-muted-foreground">{intro[id] ?? ""}</p>
      </div>
      {body}
    </div>
  );
}

const projectColor: Record<ShellTone, string> = {
  orange: "var(--color-orange-500)",
  teal: "var(--color-teal-500)",
  cyan: "var(--color-cyan-500)",
  violet: "var(--color-violet-500)",
  rose: "var(--color-rose-500)",
  info: "var(--color-info)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
};

const sections: NavSection[] = [
  {
    id: "main",
    items: demoNav.map((n) => ({ id: n.id, label: n.label, href: `#${n.id}`, icon: <n.icon />, count: n.count, attention: n.id === "inbox" })),
  },
  {
    id: "projects",
    label: "Projects",
    addHref: "#new-project",
    items: defaultProjects.map((p) => ({ id: `project-${p.id}`, label: p.name, href: `#project-${p.id}`, color: projectColor[p.tone], count: p.open })),
  },
];

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

export function LayoutsInsetShellShowcasePage() {
  const ctx = fixtures.getShellContext;
  const [active, setActive] = useState("project-atlas");
  const [workspaceId, setWorkspaceId] = useState(ctx.workspace.id);
  const workspace = ctx.workspaces.find((w) => w.id === workspaceId) ?? ctx.workspace;
  const project = defaultProjects.find((p) => `project-${p.id}` === active);
  const nav = demoNav.find((n) => n.id === active);
  const go = (id: string) => (id === "new-project" ? undefined : setActive(id));

  return (
    <GoContext.Provider value={go}>
      <WirefrontProvider link={DemoLink}>
        <DevlFrame>
        <InsetShell
          accountLinks={[
            { label: "Profile", href: "#profile", icon: <UserRoundIcon /> },
            { label: "Preferences", href: "#preferences", icon: <SettingsIcon /> },
            { label: "Shortcuts", href: "#shortcuts", icon: <KeyboardIcon /> },
          ]}
          actions={
            <>
              <div className="me-1 hidden -space-x-1 @lg:flex">
                {[
                  ["KT", "bg-info/16 text-info-foreground"],
                  ["RL", "bg-orange-500/16 text-orange-800 dark:text-orange-400"],
                  ["TB", "bg-violet-500/20 text-violet-700 dark:text-violet-400"],
                ].map(([i, t]) => (
                  <Avatar className="size-6 bg-background ring-2 ring-background" key={i}>
                    <AvatarFallback className={cn("text-[10px]", t)}>{i}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <Button className="hidden @md:inline-flex" size="sm" variant="outline">
                <Share2Icon />
                Share
              </Button>
            </>
          }
          activeId={active}
          breadcrumbs={[
            { label: workspace.name, href: "#home" },
            ...(project ? [{ label: "Projects", href: "#projects" }] : []),
            { label: project?.name ?? nav?.label ?? "Home" },
          ]}
          createWorkspaceHref="#new-workspace"
          helpHref="#help"
          notificationsHref="#inbox"
          onSearch={() => {}}
          onSignOut={async () => {}}
          onSwitchWorkspace={setWorkspaceId}
          sections={sections}
          unread={ctx.unread}
          user={ctx.user}
          workspace={workspace}
          workspaceSettingsHref="#settings"
          workspaces={ctx.workspaces}
        >
          <motion.div animate={{ opacity: 1 }} initial={{ opacity: 0 }} key={active} transition={{ duration: 0.15, ease: "easeOut" }}>
            {project ? (
              <ProjectOverview project={project} />
            ) : nav ? (
              <NavPage icon={nav.icon} id={nav.id} label={nav.label} onOpenProject={(p) => setActive(`project-${p.id}`)} projects={defaultProjects} />
            ) : null}
          </motion.div>
        </InsetShell>
        </DevlFrame>
      </WirefrontProvider>
    </GoContext.Provider>
  );
}

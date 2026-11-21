// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `status-console`).
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@wirefront/ui/tooltip";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import {
  ActivityIcon,
  BellRingIcon,
  CheckIcon,
  CircleAlertIcon,
  GitCommitHorizontalIcon,
  LayoutGridIcon,
  type LucideIcon,
  PhoneIcon,
  RocketIcon,
  RotateCcwIcon,
  SendHorizontalIcon,
  SirenIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { ConsoleDeploy, ConsolePerson, IncidentState, PostUpdateInput, ServiceHealth, StatusOverview } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("statusConsole.<key>"). */
export const STATUS_CONSOLE_MESSAGES = {
  console: "Console",
  railServices: "Services",
  railIncident: "Incident",
  railDeploys: "Deploys",
  railOnCall: "On call",
  title: "Status",
  environment: "Environment",
  live: "Live · {ago}",
  allClear: "All clear",
  allOperational: "All systems operational",
  degradedCount: "{count} degraded",
  services: "Services",
  clearFilter: "Clear filter",
  escKey: "Esc",
  filterHint: "to filter",
  press: "Press",
  colService: "Service",
  colTrend: "p95 · recent",
  colP95: "p95",
  colErrors: "Errors",
  col30d: "30d",
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
  p95: "p95",
  errors: "errors",
  uptimeLabel: "uptime",
  uptimeTitle: "{name} uptime",
  platform: "Platform",
  uptimeDays: "{value} · {days} days",
  uptimeSummary: "{value} uptime over {days} days; {incidents} days with degraded service",
  daysAgo: "{days} days ago",
  today: "Today",
  dayDegraded: "{day} · {minutes} min degraded",
  dayClear: "{day} · no incidents",
  incident: "Incident",
  ongoing: "Ongoing",
  resolvedBadge: "Resolved",
  alert: "Alert",
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
  note: "Note",
  you: "You",
  noIncident: "No open incidents.",
  postUpdate: "Post an update",
  postPlaceholder: "Post an update…",
  post: "Post update",
  onCall: "On call",
  onCallUntil: "{team} · until {until}",
  primary: "Primary",
  secondary: "Secondary",
  local: "{role} · {time} {city}",
  page: "Page",
  paged: "Paged",
  pagedToast: "Paged {name}",
  deploys: "Recent deploys",
  noDeploys: "No recent deploys to this service.",
  rolledBack: "rolled back",
  rollingOut: "rolling out",
  rollBack: "Roll back",
  rollBackSha: "Roll back {sha}",
  rolledBackToast: "Rolled back {sha} on {service}",
  dismiss: "Dismiss",
  errorTitle: "Couldn’t load status",
  retry: "Try again",
};
type Messages = typeof STATUS_CONSOLE_MESSAGES;

export interface StatusConsoleProps {
  /** Status for `environment`. Leave it out while it loads. */
  data?: StatusOverview;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Environments to switch between, e.g. ["Production", "Staging"]. The switch shows when there are two or more. */
  environments?: string[];
  environment?: string;
  onEnvironmentChange?: (environment: string) => void;
  /** When `data` was fetched (ISO date-time); the header counts up from it. */
  updatedAt?: string;
  /** The signed-in person's id, so their own updates read "You". */
  currentUserId?: string;
  /** Page an on-call person (receives their id). Page buttons and the P shortcut show only with this. */
  onPage?: Action<string>;
  /** Add a note to the incident timeline. The box shows only with this and an incident. */
  onPostUpdate?: Action<PostUpdateInput>;
  /** Roll a deploy back (receives its id). Buttons show only with this. */
  onRollback?: Action<string>;
  className?: string;
}

const avatarTone: Record<number, string> = {
  1: "bg-category-1/14 text-category-1-foreground",
  2: "bg-category-2/16 text-category-2-foreground",
  3: "bg-category-3/18 text-category-3-foreground",
  4: "bg-category-4/14 text-category-4-foreground",
  5: "bg-category-5/16 text-category-5-foreground",
  6: "bg-category-6/16 text-category-6-foreground",
  7: "bg-category-7/14 text-category-7-foreground",
  8: "bg-category-8/14 text-category-8-foreground",
};
const healthDot: Record<ServiceHealth, string> = { operational: "bg-success", degraded: "bg-warning", down: "bg-destructive" };
const healthText: Record<ServiceHealth, string> = { operational: "text-success-foreground", degraded: "text-warning-foreground", down: "text-destructive-foreground" };
const healthStroke: Record<ServiceHealth, string> = { operational: "stroke-success", degraded: "stroke-warning", down: "stroke-destructive" };
const healthFill: Record<ServiceHealth, string> = { operational: "fill-transparent", degraded: "fill-warning/12", down: "fill-destructive/12" };
const stateTone: Record<IncidentState, { dot: string; text: string }> = {
  alert: { dot: "bg-destructive", text: "text-destructive-foreground" },
  investigating: { dot: "bg-warning", text: "text-warning-foreground" },
  identified: { dot: "bg-category-7", text: "text-category-7-foreground" },
  monitoring: { dot: "bg-info", text: "text-info-foreground" },
  resolved: { dot: "bg-success", text: "text-success-foreground" },
  note: { dot: "bg-muted-foreground", text: "text-muted-foreground" },
};
const PROGRESS: IncidentState[] = ["investigating", "identified", "monitoring", "resolved"];

type RailId = "overview" | "incidents" | "deploys" | "oncall";
const RAIL_ORDER: RailId[] = ["overview", "incidents", "deploys", "oncall"];
const RAIL: Record<RailId, { label: keyof Messages; icon: LucideIcon }> = {
  overview: { label: "railServices", icon: LayoutGridIcon },
  incidents: { label: "railIncident", icon: SirenIcon },
  deploys: { label: "railDeploys", icon: RocketIcon },
  oncall: { label: "railOnCall", icon: PhoneIcon },
};

const ease = [0.23, 1, 0.32, 1] as const;

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();

function fmtMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

function Sparkline({ values, health, max }: { values: number[]; health: ServiceHealth; max: number }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 24;
  const top = Math.max(max, ...values) * 1.2 || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - (v / top) * (h - 4) - 2] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const calm = health === "operational";
  return (
    <svg aria-hidden className="h-6 w-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${w} ${h}`}>
      <path className={cn("stroke-none transition-[fill] duration-500", calm ? "fill-transparent" : healthFill[health])} d={area} />
      <path
        className={cn("fill-none transition-[stroke] duration-500", calm ? "stroke-muted-foreground/60" : healthStroke[health])}
        d={line}
        strokeLinejoin="round"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function PersonAvatar({ person, size = "size-6" }: { person?: ConsolePerson; size?: string }) {
  if (!person) return null;
  return (
    <Avatar className={size}>
      <AvatarFallback className={cn("font-medium text-[10px]", avatarTone[person.category ?? 1])}>{person.bot ? <ActivityIcon className="size-3" /> : initials(person.name)}</AvatarFallback>
    </Avatar>
  );
}

function StatusConsoleScreen({
  data,
  status = "ready",
  error,
  onRetry,
  environments = [],
  environment,
  onEnvironmentChange,
  updatedAt,
  currentUserId,
  onPage,
  onPostUpdate,
  onRollback,
  className,
}: StatusConsoleProps) {
  const t = useMessages("statusConsole", STATUS_CONSOLE_MESSAGES);
  const format = useFormat();
  const { now } = useWirefront();
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const [paged, setPaged] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState<{ key: string; text: string } | null>(null);
  const [railOn, setRailOn] = useState<RailId>("overview");
  const [clock, setClock] = useState(() => now().getTime());
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLOListElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const services = data?.services ?? [];
  const people = data?.people ?? [];
  const incident = data?.incident ?? null;
  const updates = incident?.updates ?? [];
  const person = (id?: string) => people.find((p) => p.id === id);
  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? id;
  const incidentState = updates.filter((u) => u.state !== "note" && u.state !== "alert").at(-1)?.state ?? "investigating";
  const resolved = !incident || incidentState === "resolved";

  const page = useAction(onPage ?? (async () => {}), {
    onSuccess: (_, id) => {
      setPaged(id);
      setToast({ key: `page-${id}`, text: interpolate(t.pagedToast, { name: person(id)?.name.split(" ")[0] ?? id }) });
    },
  });
  const post = useAction(onPostUpdate ?? (async () => {}), { onSuccess: () => setNote("") });
  const rollback = useAction(onRollback ?? (async () => {}), {
    onSuccess: (_, id) => {
      const d = data?.deploys.find((x) => x.id === id);
      if (d) setToast({ key: `rollback-${id}`, text: interpolate(t.rolledBackToast, { sha: d.sha, service: serviceName(d.serviceId) }) });
    },
  });
  const failure = page.error ?? post.error ?? rollback.error;

  // The header's "Live · 4s ago" counts from `updatedAt` on the provider's clock.
  useEffect(() => {
    const id = window.setInterval(() => setClock(now().getTime()), 1000);
    return () => window.clearInterval(id);
  }, [now]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const updateCount = updates.length;
  useEffect(() => {
    const el = timelineRef.current;
    if (el && updateCount) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [updateCount, reduce]);

  // Keyboard: 1–9 filter by service, P pages the primary, Esc clears; arrows move between services.
  const latest = useRef({ services, onCall: data?.onCall, canPage: Boolean(onPage), page });
  latest.current = { services, onCall: data?.onCall, canPage: Boolean(onPage), page };
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const { services: list, onCall, canPage, page: pager } = latest.current;
      if (e.key === "Escape") setSelected(null);
      else if (e.key.toLowerCase() === "p" && canPage && onCall) void pager.run(onCall.primary.personId, onCall.primary.personId);
      else if (/^[1-9]$/.test(e.key)) {
        const i = Number(e.key) - 1;
        const s = list[i];
        if (s) {
          setSelected((cur) => (cur === s.id ? null : s.id));
          setFocusIdx(i);
          cardRefs.current[i]?.focus({ preventScroll: true });
        }
      }
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const onKey = (e: KeyboardEvent) => {
      const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, j: 1, k: -1 };
      const move = moves[e.key];
      if (move === undefined) return;
      e.preventDefault();
      setFocusIdx((cur) => {
        const next = Math.max(0, Math.min(latest.current.services.length - 1, cur + move));
        cardRefs.current[next]?.focus();
        return next;
      });
    };
    list.addEventListener("keydown", onKey);
    return () => list.removeEventListener("keydown", onKey);
  });

  const jump = (id: RailId) => {
    setRailOn(id);
    requestAnimationFrame(() => {
      const box = scrollRef.current;
      const el = box?.querySelector<HTMLElement>(`[data-rail="${id}"]`);
      if (!box || !el) return;
      const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 12;
      box.scrollTo({ top: id === "overview" ? 0 : top, behavior: reduce ? "auto" : "smooth" });
    });
  };

  const submitNote = () => {
    const text = note.trim();
    if (!text || !incident) return;
    void post.run({ text });
  };

  const degraded = services.filter((s) => s.health !== "operational");
  const overall: ServiceHealth = degraded.some((s) => s.health === "down") ? "down" : degraded.length ? "degraded" : "operational";
  const deploys = data?.deploys ?? [];
  const visibleDeploys = selected ? deploys.filter((d) => d.serviceId === selected) : deploys;
  const days = data?.uptime.days ?? [];
  const pct = (v: number) => format.number(v, { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ago = updatedAt ? Math.max(0, Math.round((clock - Date.parse(updatedAt)) / 1000)) : null;
  const ready = status === "ready" && data;

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={300}>
        <div className={cn("@container relative isolate flex h-[760px] w-full overflow-hidden bg-sidebar text-foreground text-sm outline-none", className)} ref={rootRef}>
          <nav aria-label={t.console} className="hidden w-14 shrink-0 flex-col items-center gap-1 py-3 @3xl:flex">
            <span aria-hidden className="mb-3 flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ActivityIcon className="size-4" />
            </span>
            {RAIL_ORDER.map((id) => {
              const r = RAIL[id];
              return (
                <Tooltip key={id}>
                  <TooltipTrigger
                    render={
                      <button
                        aria-current={id === railOn ? "location" : undefined}
                        aria-label={t[r.label]}
                        className={cn(
                          "relative flex size-9 cursor-pointer items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          id === railOn ? "bg-background text-foreground shadow-xs/5 ring-1 ring-border dark:bg-accent dark:ring-0" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                        onClick={() => jump(id)}
                        type="button"
                      />
                    }
                  >
                    <r.icon aria-hidden className="size-4" />
                    {id === "incidents" && !resolved && <span aria-hidden className="absolute top-1.5 end-1.5 size-1.5 rounded-full bg-destructive" />}
                  </TooltipTrigger>
                  <TooltipContent side="right">{t[r.label]}</TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <main
            aria-busy={status === "loading"}
            className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background @3xl:my-2 @3xl:me-2 @3xl:rounded-2xl @3xl:border @3xl:shadow-xs/5"
          >
            <header className="flex h-14 shrink-0 items-center gap-3 border-b px-3 @lg:px-4">
              <h1 className="truncate font-semibold">{t.title}</h1>
              {environments.length > 1 && environment ? (
                <RadioGroup aria-label={t.environment} className="flex rounded-lg bg-muted p-0.5" onValueChange={(v) => onEnvironmentChange?.(v as string)} value={environment}>
                  {environments.map((e) => (
                    <Radio.Root
                      className="relative h-6 cursor-pointer rounded-md px-2 font-medium text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-background data-checked:text-foreground data-checked:shadow-xs/5 dark:data-checked:bg-accent"
                      key={e}
                      value={e}
                    >
                      {e}
                    </Radio.Root>
                  ))}
                </RadioGroup>
              ) : null}
              <div className="ms-auto flex items-center gap-3">
                {ago !== null ? (
                  <span className="hidden items-center gap-1.5 text-muted-foreground text-xs tabular-nums @lg:flex">
                    <span aria-hidden className="relative flex size-2">
                      <span className="absolute inset-0 rounded-full bg-success opacity-60 motion-safe:animate-ping motion-reduce:hidden [animation-duration:2s]" />
                      <span className="relative size-2 rounded-full bg-success" />
                    </span>
                    {interpolate(t.live, { ago: `${ago}s` })}
                  </span>
                ) : null}
                {ready ? (
                  <span
                    className={cn(
                      "flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-medium text-xs transition-colors duration-500",
                      overall === "operational" ? "border-success/30 bg-success/8 text-success-foreground" : "border-warning/40 bg-warning/10 text-warning-foreground",
                    )}
                    role="status"
                  >
                    {overall === "operational" ? <CheckIcon aria-hidden className="size-3.5" /> : <CircleAlertIcon aria-hidden className="size-3.5" />}
                    {overall === "operational" ? (
                      <>
                        <span className="@lg:hidden">{t.allClear}</span>
                        <span className="hidden @lg:inline">{t.allOperational}</span>
                      </>
                    ) : (
                      interpolate(t.degradedCount, { count: degraded.length })
                    )}
                  </span>
                ) : null}
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]" ref={scrollRef}>
              {status === "error" ? (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <p className="font-medium">{t.errorTitle}</p>
                  {error ? <p className="mt-1 max-w-xs text-pretty text-muted-foreground text-xs">{error}</p> : null}
                  {onRetry ? (
                    <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                      {t.retry}
                    </Button>
                  ) : null}
                </div>
              ) : !ready ? (
                <div className="grid gap-4 p-3 @lg:p-4 @5xl:grid-cols-[minmax(0,1fr)_340px]">
                  <Skeleton className="h-96 w-full rounded-xl motion-reduce:animate-none" />
                  <Skeleton className="h-96 w-full rounded-xl motion-reduce:animate-none" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 p-3 @lg:p-4 @5xl:grid-cols-[minmax(0,1fr)_340px] @5xl:grid-rows-[auto_1fr]">
                  <div className="flex min-w-0 flex-col gap-4 self-start @5xl:col-start-1 @5xl:row-span-2 @5xl:row-start-1">
                    <section aria-labelledby="console-services" className="overflow-hidden rounded-xl border bg-card" data-rail="overview">
                      <div className="flex h-11 items-center justify-between gap-3 border-b px-3">
                        <h2 className="font-medium" id="console-services">
                          {t.services}
                        </h2>
                        <span className="truncate text-muted-foreground text-xs">
                          {selected ? (
                            <button className="cursor-pointer rounded outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setSelected(null)} type="button">
                              {t.clearFilter} <Kbd className="ms-1">{t.escKey}</Kbd>
                            </button>
                          ) : (
                            <span aria-hidden>
                              <span className="hidden @lg:inline">{t.press} </span>
                              <Kbd>1</Kbd>–<Kbd>9</Kbd> {t.filterHint}
                            </span>
                          )}
                        </span>
                      </div>
                      <div aria-hidden className="hidden h-8 items-center gap-4 border-b bg-muted/40 px-3 text-[11px] text-muted-foreground @xl:flex">
                        <span className="min-w-0 flex-1">{t.colService}</span>
                        <span className="w-32 @4xl:w-40">{t.colTrend}</span>
                        <span className="w-14 text-end">{t.colP95}</span>
                        <span className="w-14 text-end">{t.colErrors}</span>
                        <span className="w-16 text-end">{t.col30d}</span>
                      </div>
                      <ul className="flex flex-col divide-y" ref={listRef}>
                        {services.map((s, i) => {
                          const on = selected === s.id;
                          const calm = s.health === "operational";
                          return (
                            <li
                              className={cn(
                                "group/row relative flex h-11 min-w-0 items-center gap-4 px-3 transition-[background-color,opacity] duration-150 ease-out focus-within:bg-accent/60",
                                on ? "bg-accent/70" : "hover:bg-accent/40",
                                selected && !on && "opacity-50",
                              )}
                              key={s.id}
                            >
                              {on && <motion.span className="absolute inset-y-0 start-0 w-0.5 bg-foreground" layoutId="service-rail" transition={{ type: "spring", stiffness: 520, damping: 42 }} />}
                              {/* The filter toggle covers the whole row (before:inset-0); its name is the service, health and region. */}
                              <button
                                aria-pressed={on}
                                className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-start outline-none before:absolute before:inset-0"
                                onClick={() => setSelected((cur) => (cur === s.id ? null : s.id))}
                                onFocus={() => setFocusIdx(i)}
                                ref={(el) => {
                                  cardRefs.current[i] = el;
                                }}
                                tabIndex={i === focusIdx ? 0 : -1}
                                type="button"
                              >
                                <span aria-hidden className="relative flex size-2 shrink-0">
                                  {!calm && <span className={cn("absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping motion-reduce:hidden", healthDot[s.health])} />}
                                  <span className={cn("relative size-2 rounded-full transition-colors duration-500", healthDot[s.health])} />
                                </span>
                                <span className="truncate font-medium">{s.name}</span>{" "}
                                {calm ? <span className="sr-only">{t[s.health]}</span> : <span className={cn("shrink-0 text-xs transition-colors duration-500", healthText[s.health])}>{t[s.health]}</span>}{" "}
                                {s.region ? <span className="ms-auto hidden shrink-0 font-mono text-[11px] text-muted-foreground @md:inline @xl:hidden @3xl:inline">{s.region}</span> : null}
                              </button>
                              <span className="pointer-events-none hidden w-32 shrink-0 @xl:block @4xl:w-40">
                                <Sparkline health={s.health} max={s.p95Ms} values={s.p95Trend} />
                              </span>
                              <span className={cn("pointer-events-none w-14 shrink-0 text-end font-medium tabular-nums transition-colors duration-500", calm ? "text-foreground" : healthText[s.health])}>
                                <span className="sr-only">{t.p95}</span> {fmtMs(s.p95Ms)}
                              </span>
                              <span className="pointer-events-none hidden w-14 shrink-0 text-end text-muted-foreground tabular-nums @md:block">
                                {pct(s.errorRate)} <span className="sr-only">{t.errors}</span>
                              </span>
                              <span className="pointer-events-none hidden w-16 shrink-0 text-end text-muted-foreground tabular-nums @xl:block">
                                {pct(s.uptime)} <span className="sr-only">{t.uptimeLabel}</span>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </section>

                    <section aria-labelledby="console-uptime" className="rounded-xl border bg-card px-3 pt-3 pb-2.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <h2 className="truncate font-medium" id="console-uptime">
                          {interpolate(t.uptimeTitle, { name: selected ? serviceName(selected) : t.platform })}
                        </h2>
                        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">{interpolate(t.uptimeDays, { value: pct(data.uptime.value), days: days.length })}</span>
                      </div>
                      <div
                        aria-label={interpolate(t.uptimeSummary, { value: pct(data.uptime.value), days: days.length, incidents: days.filter((d) => d.degradedMinutes > 0).length })}
                        className="mt-3 flex h-6 gap-[3px]"
                        role="img"
                      >
                        {days.map((d, i) => {
                          const last = i === days.length - 1;
                          const label = last ? t.today : interpolate(t.daysAgo, { days: days.length - 1 - i });
                          return (
                            <Tooltip key={d.date}>
                              <TooltipTrigger
                                render={
                                  <span
                                    className={cn(
                                      "h-full min-w-0 flex-1 rounded-[calc(var(--radius)*0.2)] transition-[background-color,opacity] duration-500 hover:opacity-70",
                                      d.degradedMinutes === 0 ? "bg-success/60" : last && !resolved ? "bg-destructive" : "bg-warning",
                                    )}
                                  />
                                }
                              />
                              <TooltipContent>{d.degradedMinutes ? interpolate(t.dayDegraded, { day: label, minutes: d.degradedMinutes }) : interpolate(t.dayClear, { day: label })}</TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                      <div aria-hidden className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                        <span>{interpolate(t.daysAgo, { days: days.length })}</span>
                        <span>{t.today}</span>
                      </div>
                    </section>
                  </div>

                  <div className="order-first flex min-w-0 flex-col gap-4 @5xl:order-none @5xl:col-start-2 @5xl:row-start-1">
                    <section aria-labelledby="console-incident" className="flex flex-col overflow-hidden rounded-xl border bg-card" data-rail="incidents">
                      {incident ? (
                        <>
                          <div className="flex flex-col gap-1.5 px-3 pt-3">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs">
                              <span
                                className={cn(
                                  "flex h-5 items-center gap-1 rounded-full px-1.5 font-medium transition-colors duration-500",
                                  resolved ? "bg-success/10 text-success-foreground" : "bg-warning/12 text-warning-foreground",
                                )}
                              >
                                {resolved ? <CheckIcon aria-hidden className="size-3" /> : <SirenIcon aria-hidden className="size-3" />}
                                {resolved ? t.resolvedBadge : t.ongoing}
                              </span>
                              <span className="font-mono text-[11px]">{incident.ref}</span>
                              <span aria-hidden>·</span>
                              <span>{incident.severity}</span>
                              <time className="ms-auto tabular-nums" dateTime={incident.startedAt}>
                                {format.time(incident.startedAt)}
                              </time>
                            </div>
                            <h2 className="text-pretty font-medium leading-snug" id="console-incident">
                              {incident.title}
                            </h2>
                          </div>
                          <ol aria-label={t.incident} className="mt-3 flex gap-1 px-3">
                            {PROGRESS.map((st) => {
                              const done = PROGRESS.indexOf(st) <= PROGRESS.indexOf(incidentState);
                              return (
                                <li aria-current={st === incidentState ? "step" : undefined} className="flex min-w-0 flex-1 flex-col gap-1" key={st}>
                                  <span aria-hidden className="h-1 overflow-hidden rounded-full bg-muted">
                                    <motion.span
                                      animate={{ scaleX: done ? 1 : 0 }}
                                      className={cn("block h-full origin-left rounded-full", stateTone[st].dot)}
                                      initial={false}
                                      transition={{ duration: 0.4, ease }}
                                    />
                                  </span>
                                  <span className={cn("truncate text-[11px] transition-colors", done ? "text-foreground" : "text-muted-foreground")}>{t[st]}</span>
                                </li>
                              );
                            })}
                          </ol>
                          <ol
                            aria-live="polite"
                            className="relative mt-1 flex max-h-72 flex-col gap-3 overflow-y-auto px-3 pt-2 pb-3 [mask-image:linear-gradient(to_bottom,transparent,black_12px)] [scrollbar-width:thin]"
                            ref={timelineRef}
                          >
                            <AnimatePresence initial={false}>
                              {updates.map((u, i) => {
                                const p = person(u.by);
                                const tone = stateTone[u.state];
                                return (
                                  <motion.li animate={{ opacity: 1, y: 0 }} className="relative flex gap-2.5" initial={{ opacity: 0, y: 8 }} key={u.id} transition={{ duration: 0.3, ease }}>
                                    {i < updates.length - 1 && <span aria-hidden className="absolute top-6 bottom-[-12px] start-[11px] w-px bg-border" />}
                                    <span className="relative">
                                      <PersonAvatar person={p} />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <span aria-hidden className={cn("size-1.5 rounded-full", tone.dot)} />
                                        <span className={cn("font-medium", tone.text)}>{t[u.state]}</span>
                                        {p ? <span className="text-muted-foreground">· {u.by === currentUserId ? t.you : p.name.split(" ")[0]}</span> : null}
                                        <time className="ms-auto text-muted-foreground tabular-nums" dateTime={u.at}>
                                          {format.time(u.at)}
                                        </time>
                                      </div>
                                      <p className="mt-0.5 text-pretty text-[13px] text-foreground/90 leading-5">{u.text}</p>
                                    </div>
                                  </motion.li>
                                );
                              })}
                            </AnimatePresence>
                          </ol>
                          {onPostUpdate ? (
                            <div className="border-t p-2">
                              <div className="flex items-center gap-1.5 rounded-lg border bg-background ps-2.5 pe-1 transition-shadow focus-within:border-ring/60 focus-within:ring-3 focus-within:ring-ring/16 dark:bg-input/32">
                                <input
                                  aria-label={t.postUpdate}
                                  className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                                  onChange={(e) => setNote(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") submitNote();
                                    if (e.key === "Escape") e.currentTarget.blur();
                                  }}
                                  placeholder={t.postPlaceholder}
                                  value={note}
                                />
                                <Button
                                  aria-busy={post.isPending()}
                                  aria-label={t.post}
                                  disabled={!note.trim() || post.isPending()}
                                  onClick={submitNote}
                                  size="icon-xs"
                                  variant={note.trim() ? "default" : "ghost"}
                                >
                                  <SendHorizontalIcon />
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 p-3 text-muted-foreground text-sm">
                          <CheckIcon aria-hidden className="size-4 text-success-foreground" />
                          <h2 id="console-incident">{t.noIncident}</h2>
                        </div>
                      )}
                    </section>

                    <section aria-labelledby="console-oncall" className="rounded-xl border bg-card p-3" data-rail="oncall">
                      <div className="flex items-center justify-between">
                        <h2 className="font-medium" id="console-oncall">
                          {t.onCall}
                        </h2>
                        <span className="text-muted-foreground text-xs">
                          {interpolate(t.onCallUntil, { team: data.onCall.team, until: format.date(data.onCall.until, { weekday: "short", hour: "2-digit", minute: "2-digit" }) })}
                        </span>
                      </div>
                      <ul className="mt-3 flex flex-col gap-2.5">
                        {[
                          { slot: data.onCall.primary, role: t.primary, primary: true },
                          { slot: data.onCall.secondary, role: t.secondary, primary: false },
                        ].map(({ slot, role, primary }) => {
                          const p = person(slot.personId);
                          const wasPaged = paged === slot.personId;
                          return (
                            <li className="flex items-center gap-2.5" key={slot.personId}>
                              <span className="relative">
                                <PersonAvatar person={p} size="size-8" />
                                <span aria-hidden className="absolute -end-0.5 -bottom-0.5 size-2.5 rounded-full bg-success ring-2 ring-card" />
                              </span>
                              <div className="min-w-0 flex-1 leading-tight">
                                <div className="truncate font-medium">{p?.name ?? slot.personId}</div>
                                <div className="truncate text-muted-foreground text-xs">
                                  {interpolate(t.local, { role, time: format.time(clock, { timeStyle: "short", timeZone: slot.timeZone }), city: slot.city })}
                                </div>
                              </div>
                              {onPage ? (
                                <Button
                                  aria-busy={page.isPending(slot.personId)}
                                  className="transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.97]"
                                  disabled={wasPaged || page.isPending(slot.personId)}
                                  onClick={() => void page.run(slot.personId, slot.personId)}
                                  size="xs"
                                  variant={primary ? "outline" : "ghost"}
                                >
                                  {wasPaged ? <CheckIcon /> : <BellRingIcon />}
                                  {wasPaged ? t.paged : t.page}
                                  {primary && !wasPaged && (
                                    <Kbd aria-hidden className="ms-0.5 h-4 min-w-4 text-[10px]">
                                      P
                                    </Kbd>
                                  )}
                                </Button>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  </div>

                  <section
                    aria-labelledby="console-deploys"
                    className="min-w-0 scroll-mt-3 self-start overflow-hidden rounded-xl border bg-card @5xl:col-start-2 @5xl:row-start-2"
                    data-rail="deploys"
                  >
                    <div className="flex h-11 items-center justify-between gap-3 border-b px-3">
                      <h2 className="font-medium" id="console-deploys">
                        {t.deploys}
                      </h2>
                      {selected && <span className="truncate text-muted-foreground text-xs">{serviceName(selected)}</span>}
                    </div>
                    {visibleDeploys.length === 0 ? (
                      <p className="px-3 py-6 text-center text-muted-foreground text-xs">{t.noDeploys}</p>
                    ) : (
                      <ul className="flex flex-col">
                        <AnimatePresence initial={false}>
                          {visibleDeploys.map((d: ConsoleDeploy) => (
                            <motion.li
                              animate={{ opacity: 1, height: "auto" }}
                              className="group/li overflow-hidden"
                              exit={{ opacity: 0, height: 0 }}
                              initial={{ opacity: 0, height: 0 }}
                              key={d.id}
                              transition={{ duration: 0.25, ease }}
                            >
                              <div className="group/dep flex items-center gap-3 border-b px-3 py-2.5 transition-colors group-last/li:border-b-0 hover:bg-accent/40">
                                <span
                                  aria-hidden
                                  className={cn(
                                    "flex size-6 shrink-0 items-center justify-center rounded-full border",
                                    d.status === "succeeded" && "border-success/30 text-success-foreground",
                                    d.status === "rolling" && "border-info/40 text-info-foreground",
                                    d.status === "failed" && "border-destructive/40 text-destructive-foreground",
                                    d.status === "rolled-back" && "text-muted-foreground",
                                  )}
                                >
                                  {d.status === "rolled-back" ? <RotateCcwIcon className="size-3" /> : <GitCommitHorizontalIcon className="size-3.5" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className={cn("block truncate", d.status === "rolled-back" && "text-muted-foreground line-through decoration-muted-foreground/40")}>{d.message}</span>
                                  <span className="mt-0.5 flex items-center gap-1.5 text-muted-foreground text-xs">
                                    <span className="font-mono text-[11px]">{d.sha}</span>
                                    <span aria-hidden>·</span>
                                    <span className="truncate">{serviceName(d.serviceId)}</span>
                                    {d.status === "rolled-back" && <span className="shrink-0">· {t.rolledBack}</span>}
                                    {d.status === "rolling" && <span className="shrink-0 text-info-foreground">· {t.rollingOut}</span>}
                                  </span>
                                  {d.status === "rolling" && (
                                    <span aria-hidden className="mt-1.5 block h-1 overflow-hidden rounded-full bg-muted">
                                      <motion.span
                                        animate={{ scaleX: (d.progress ?? 0) / 100 }}
                                        className="block h-full origin-left rounded-full bg-info"
                                        initial={{ scaleX: 0 }}
                                        transition={{ duration: 0.45, ease: "easeOut" }}
                                      />
                                    </span>
                                  )}
                                </span>
                                <span className="shrink-0 whitespace-nowrap text-end text-muted-foreground text-xs tabular-nums">
                                  {d.status === "rolling" ? format.number((d.progress ?? 0) / 100, { style: "percent" }) : format.relative(d.at)}
                                </span>
                                {onRollback && d.status === "succeeded" ? (
                                  <Tooltip>
                                    <TooltipTrigger
                                      render={
                                        <Button
                                          aria-label={interpolate(t.rollBackSha, { sha: d.sha })}
                                          className="text-muted-foreground hover:text-foreground"
                                          disabled={rollback.isPending(d.id)}
                                          onClick={() => void rollback.run(d.id, d.id)}
                                          size="icon-xs"
                                          variant="ghost"
                                        />
                                      }
                                    >
                                      <RotateCcwIcon />
                                    </TooltipTrigger>
                                    <TooltipContent>{t.rollBack}</TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span aria-hidden className="size-7 shrink-0 sm:size-6" />
                                )}
                              </div>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    )}
                  </section>
                </div>
              )}
            </div>

            <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-4">
              <AnimatePresence mode="popLayout">
                {failure ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    className="pointer-events-auto flex h-9 items-center rounded-full border border-destructive/30 bg-popover px-4 text-destructive-foreground text-sm shadow-lg/10"
                    initial={{ opacity: 0, y: 8 }}
                    key="failure"
                    role="alert"
                  >
                    {failure}
                  </motion.div>
                ) : toast ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="pointer-events-auto flex h-9 items-center gap-2 rounded-full border bg-popover ps-4 pe-1.5 text-sm shadow-lg/10"
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    key={toast.key}
                    transition={{ duration: 0.2, ease }}
                  >
                    {toast.text}
                    <Button aria-label={t.dismiss} className="rounded-full" onClick={() => setToast(null)} size="icon-xs" variant="ghost">
                      <XIcon />
                    </Button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </TooltipProvider>
    </MotionConfig>
  );
}

export function StatusConsole(props: StatusConsoleProps) {
  return (
    <ScreenBoundary name="StatusConsole">
      <StatusConsoleScreen {...props} />
    </ScreenBoundary>
  );
}

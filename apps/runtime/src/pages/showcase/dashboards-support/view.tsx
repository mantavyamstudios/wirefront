// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  useWirefront,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { AlertTriangleIcon, CircleDotIcon, ClockIcon } from "lucide-react";
import type { QueueOverview, TicketPriority } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("supportQueue.<key>"). */
export const SUPPORT_QUEUE_MESSAGES = {
  eyebrow: "Support · {scope}",
  title: "Queue overview",
  active: "Active tickets",
  ofTotal: "of {total} total",
  open: "Open",
  inProgress: "In progress",
  waiting: "Waiting",
  resolved: "Resolved",
  donutLabel: "Tickets by state: {summary}",
  breaching: "SLA breaching",
  viewAll: "View all",
  breachCaption: "Tickets breaching SLA",
  priority: "Pri",
  ticket: "Ticket",
  customer: "Customer",
  sla: "SLA",
  overdue: "Overdue",
  firstResponseTarget: "{priority} first response",
  resolutionTarget: "{priority} resolution",
  overBy: "{time} over",
  noBreaches: "Nothing is breaching SLA.",
  firstResponse: "Avg first response · last 24h",
  vsWeek: "{change} vs week",
  hourlyLabel: "Average first response per hour over the last 24 hours",
  leaderboard: "Agent leaderboard · today",
  resolvedCount: "{count} resolved",
  avg: "avg {time}",
  csat: "csat",
  load: "{load} load",
  tags: "Tag mix",
  none: "Nothing here yet.",
  errorTitle: "Couldn’t load the queue",
  retry: "Try again",
};

export interface SupportQueueProps {
  /** Today's overview. Leave it out while it loads. */
  data?: QueueOverview;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Shown above the title, e.g. "acme/help". */
  scope?: string;
  /** Where "View all" breaches goes. Hidden when not given. */
  breachesHref?: string;
  className?: string;
}

type StateKey = keyof QueueOverview["counts"];
const STATES: StateKey[] = ["open", "inProgress", "waiting", "resolved"];
const STATE_COLOUR: Record<StateKey, { dot: string; stroke: string }> = {
  open: { dot: "bg-category-3", stroke: "text-category-3" },
  inProgress: { dot: "bg-category-1", stroke: "text-category-1" },
  waiting: { dot: "bg-category-5", stroke: "text-category-5" },
  resolved: { dot: "bg-category-2", stroke: "text-category-2" },
};
const PRIORITY_TONE: Record<TicketPriority, string> = {
  p0: "bg-category-4/15 text-category-4-foreground",
  p1: "bg-category-3/15 text-category-3-foreground",
  p2: "bg-category-1/15 text-category-1-foreground",
};
/** Tag bar colours by rank. */
const TAG_COLOURS = [
  "bg-category-3",
  "bg-category-5",
  "bg-category-1",
  "bg-category-2",
  "bg-category-4",
  "bg-category-6",
];
const HIGH_LOAD = 0.75;
const SKELETON_ROWS = ["r1", "r2", "r3", "r4"];
const eyebrow =
  "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]";

/** "1h 05m", "14m" or "42s". */
function duration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m) return `${m}m`;
  return `${s}s`;
}

function initials(name: string) {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Bars 8 wide on a 10-unit pitch, 48 tall, as one path; `only` draws just that bar. */
function bars(values: number[], max: number, only?: number) {
  return values
    .map((v, i) => {
      if (only !== undefined && i !== only) return "";
      const h = Math.max(1, (v / max) * 48);
      return `M${i * 10 + 1} 48v${-h}h8v${h}z`;
    })
    .join("");
}

function SupportQueueScreen({
  data,
  status = "ready",
  error,
  onRetry,
  scope,
  breachesHref,
  className,
}: SupportQueueProps) {
  const t = useMessages("supportQueue", SUPPORT_QUEUE_MESSAGES);
  const format = useFormat();
  const { now } = useWirefront();
  const ready = status === "ready" && data ? data : undefined;

  const counts = ready?.counts;
  const active = counts ? counts.open + counts.inProgress + counts.waiting : 0;
  const total = counts ? active + counts.resolved : 0;
  const nowMs = now().getTime();
  const overdue = (dueAt: string) => (nowMs - Date.parse(dueAt)) / 1000;
  const hourly = ready?.firstResponse.hourly ?? [];
  const hourlyMax = Math.max(1, ...hourly);
  const tagMax = Math.max(1, ...(ready?.tags.map((tag) => tag.count) ?? [1]));

  // Donut segments, as stroke dash lengths around the circle.
  const r = 56;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = counts
    ? STATES.map((key) => {
        const length = total ? (counts[key] / total) * circumference : 0;
        const segment = { key, length, offset };
        offset += length;
        return segment;
      })
    : [];

  return (
    <div
      className={cn(
        "min-h-svh bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8 lg:px-10 lg:py-10",
        className
      )}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          {scope ? (
            <div className={eyebrow}>{interpolate(t.eyebrow, { scope })}</div>
          ) : null}
          <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
        </div>

        {status === "error" ? (
          <div className="rounded-2xl border border-border/60 p-10 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? (
              <p className="mt-1 text-muted-foreground text-sm">{error}</p>
            ) : null}
            {onRetry ? (
              <Button
                className="mt-4"
                onClick={onRetry}
                size="sm"
                variant="outline"
              >
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : (
          <div aria-busy={status === "loading"} className="space-y-6">
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 lg:grid-cols-[320px_1fr]">
              <section className="bg-background p-4 sm:p-6">
                <h2 className={eyebrow}>{t.active}</h2>
                {counts ? (
                  <>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-heading text-5xl tabular-nums">
                        {format.number(active)}
                      </span>
                      <span className="font-mono text-muted-foreground text-xs">
                        {interpolate(t.ofTotal, {
                          total: format.number(total),
                        })}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center justify-center">
                      <svg
                        aria-label={interpolate(t.donutLabel, {
                          summary: STATES.map(
                            (key) => `${t[key]} ${format.number(counts[key])}`
                          ).join(", "),
                        })}
                        className="size-36 -rotate-90"
                        role="img"
                        viewBox="-72 -72 144 144"
                      >
                        <circle
                          className="text-foreground/10"
                          fill="none"
                          r={r}
                          stroke="currentColor"
                          strokeWidth="14"
                        />
                        {segments.map((s) => (
                          <circle
                            className={STATE_COLOUR[s.key].stroke}
                            fill="none"
                            key={s.key}
                            r={r}
                            stroke="currentColor"
                            strokeDasharray={`${s.length} ${circumference - s.length}`}
                            strokeDashoffset={-s.offset}
                            strokeWidth="14"
                          />
                        ))}
                      </svg>
                    </div>
                    <dl className="mt-5 space-y-1.5 font-mono text-[11px]">
                      {STATES.map((key) => (
                        <div
                          className="flex items-center justify-between"
                          key={key}
                        >
                          <dt className="flex items-center gap-2">
                            <span
                              aria-hidden
                              className={cn(
                                "size-2 rounded-full",
                                STATE_COLOUR[key].dot
                              )}
                            />
                            <span className="text-muted-foreground uppercase tracking-[0.2em]">
                              {t[key]}
                            </span>
                          </dt>
                          <dd className="tabular-nums">
                            {format.number(counts[key])}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </>
                ) : (
                  <Skeleton className="mt-2 h-64 w-full motion-reduce:animate-none" />
                )}
              </section>

              <section className="min-w-0 bg-background p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2">
                    <AlertTriangleIcon
                      aria-hidden
                      className="size-4 text-category-4-foreground"
                    />
                    <span className="font-mono text-[10px] text-category-4-foreground uppercase tracking-[0.3em]">
                      {t.breaching}
                    </span>
                    {ready ? (
                      <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                        · {ready.breaches.length}
                      </span>
                    ) : null}
                  </h2>
                  {breachesHref ? (
                    <WirefrontLink
                      className="inline-flex min-h-8 items-center gap-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] hover:text-foreground pointer-coarse:min-h-10"
                      href={breachesHref}
                    >
                      {t.viewAll}
                      <span aria-hidden className="rtl:-scale-x-100">
                        →
                      </span>
                    </WirefrontLink>
                  ) : null}
                </div>
                {ready ? (
                  ready.breaches.length ? (
                    // A real table: fixed columns and uniform two-line rows at every width.
                    // Phones: priority · ticket (subject + id/customer) · overdue. sm adds the SLA
                    // target column, md moves the customer into its own column.
                    <table className="mt-3 w-full table-fixed border-collapse text-start">
                      <caption className="sr-only">{t.breachCaption}</caption>
                      <thead>
                        <tr className="border-border/60 border-b font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                          <th
                            className="w-14 py-2 pe-2 text-start font-normal"
                            scope="col"
                          >
                            {t.priority}
                          </th>
                          <th
                            className="py-2 pe-3 text-start font-normal"
                            scope="col"
                          >
                            {t.ticket}
                          </th>
                          <th
                            className="w-32 py-2 pe-3 text-start font-normal max-md:hidden"
                            scope="col"
                          >
                            {t.customer}
                          </th>
                          <th
                            className="w-36 py-2 pe-3 text-start font-normal max-sm:hidden"
                            scope="col"
                          >
                            {t.sla}
                          </th>
                          <th
                            className="w-24 py-2 text-end font-normal"
                            scope="col"
                          >
                            {t.overdue}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {ready.breaches.map((b) => (
                          <tr className="h-14 align-middle" key={b.id}>
                            <td className="pe-2">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]",
                                  PRIORITY_TONE[b.priority]
                                )}
                              >
                                <CircleDotIcon
                                  aria-hidden
                                  className="size-2.5"
                                />
                                {b.priority}
                              </span>
                            </td>
                            <td className="min-w-0 pe-3">
                              <div className="truncate text-sm">
                                {b.subject}
                              </div>
                              <div className="truncate font-mono text-[11px] text-muted-foreground">
                                {b.id}
                                <span className="md:hidden">
                                  {" "}
                                  · {b.customer}
                                </span>
                              </div>
                            </td>
                            <td className="pe-3 max-md:hidden">
                              <div className="flex min-w-0 items-center gap-2">
                                <Avatar className="size-6 shrink-0">
                                  <AvatarFallback className="text-[10px]">
                                    {initials(b.customer)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate text-sm">
                                  {b.customer}
                                </span>
                              </div>
                            </td>
                            <td className="truncate pe-3 font-mono text-[11px] text-muted-foreground uppercase tracking-widest max-sm:hidden">
                              {interpolate(
                                b.target === "first-response"
                                  ? t.firstResponseTarget
                                  : t.resolutionTarget,
                                { priority: b.priority }
                              )}
                            </td>
                            <td className="text-end">
                              <span className="inline-flex items-center gap-1 rounded-md bg-category-4/10 px-2 py-1 font-mono text-[11px] text-category-4-foreground tabular-nums">
                                <ClockIcon aria-hidden className="size-3" />
                                {interpolate(t.overBy, {
                                  time: duration(overdue(b.dueAt)),
                                })}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="mt-3 rounded-lg border border-border/60 border-dashed p-6 text-center text-muted-foreground text-sm">
                      {t.noBreaches}
                    </p>
                  )
                ) : (
                  <Skeleton className="mt-3 h-40 w-full motion-reduce:animate-none" />
                )}

                <div className="mt-5">
                  <h3 className={eyebrow}>{t.firstResponse}</h3>
                  {ready ? (
                    <>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-heading text-2xl tabular-nums">
                          {duration(ready.firstResponse.avgSeconds)}
                        </span>
                        {ready.firstResponse.change ? (
                          <span
                            className={cn(
                              "font-mono text-xs",
                              ready.firstResponse.change < 0
                                ? "text-category-2-foreground"
                                : "text-category-4-foreground"
                            )}
                          >
                            <span aria-hidden>
                              {ready.firstResponse.change < 0 ? "↓ " : "↑ "}
                            </span>
                            {interpolate(t.vsWeek, {
                              change: format.number(
                                ready.firstResponse.change,
                                { style: "percent", signDisplay: "exceptZero" }
                              ),
                            })}
                          </span>
                        ) : null}
                      </div>
                      {hourly.length ? (
                        // One path for the earlier hours and one for the latest, so no per-bar keys are needed.
                        <svg
                          aria-label={t.hourlyLabel}
                          className="mt-3 h-12 w-full"
                          preserveAspectRatio="none"
                          role="img"
                          viewBox={`0 0 ${hourly.length * 10} 48`}
                        >
                          <path
                            className="text-foreground/15"
                            d={bars(hourly.slice(0, -1), hourlyMax)}
                            fill="currentColor"
                          />
                          <path
                            className="text-category-2"
                            d={bars(hourly, hourlyMax, hourly.length - 1)}
                            fill="currentColor"
                          />
                        </svg>
                      ) : null}
                    </>
                  ) : (
                    <Skeleton className="mt-2 h-20 w-full motion-reduce:animate-none" />
                  )}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 lg:grid-cols-[1fr_280px]">
              <section className="bg-background p-4 sm:p-6">
                <h2 className={eyebrow}>{t.leaderboard}</h2>
                <ol className="mt-3 divide-y divide-border/40">
                  {ready ? (
                    ready.agents.length ? (
                      ready.agents.map((a, i) => {
                        const load = format.number(a.load, {
                          style: "percent",
                        });
                        return (
                          <li
                            // Below sm: rank, avatar, name + load bar (+ resolved), CSAT.
                            className="grid grid-cols-[1.5rem_auto_minmax(0,1fr)_auto] items-center gap-3 py-2.5 sm:grid-cols-[2rem_auto_minmax(0,1fr)_auto_auto_auto] sm:gap-4"
                            key={a.id}
                          >
                            <span
                              aria-hidden
                              className="font-mono text-[11px] text-muted-foreground tabular-nums"
                            >
                              #{i + 1}
                            </span>
                            <Avatar className="size-7">
                              <AvatarFallback className="text-[10px]">
                                {initials(a.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate text-sm">{a.name}</div>
                              <div
                                aria-hidden
                                className="mt-1 h-1 overflow-hidden rounded-full bg-foreground/4"
                              >
                                <div
                                  className={cn(
                                    "h-full",
                                    a.load > HIGH_LOAD
                                      ? "bg-category-3"
                                      : "bg-category-2/60"
                                  )}
                                  style={{ width: `${a.load * 100}%` }}
                                />
                              </div>
                              <div className="mt-1 font-mono text-[10px] text-muted-foreground sm:hidden">
                                {interpolate(t.resolvedCount, {
                                  count: a.resolved,
                                })}{" "}
                                · {interpolate(t.load, { load })}
                              </div>
                            </div>
                            <div className="text-end font-mono text-[11px] tabular-nums max-sm:hidden">
                              <div>
                                {interpolate(t.resolvedCount, {
                                  count: a.resolved,
                                })}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {interpolate(t.avg, {
                                  time: duration(a.avgFirstResponseSeconds),
                                })}
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="font-mono text-category-3-foreground text-sm tabular-nums">
                                <span aria-hidden>★ </span>
                                {format.number(a.csat, {
                                  minimumFractionDigits: 1,
                                  maximumFractionDigits: 1,
                                })}
                              </div>
                              <div className="font-mono text-[10px] text-muted-foreground">
                                {t.csat}
                              </div>
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] tabular-nums max-sm:hidden">
                              {interpolate(t.load, { load })}
                            </div>
                          </li>
                        );
                      })
                    ) : (
                      <li className="py-6 text-center text-muted-foreground text-sm">
                        {t.none}
                      </li>
                    )
                  ) : (
                    SKELETON_ROWS.map((key) => (
                      <li className="py-2.5" key={key}>
                        <Skeleton className="h-8 w-full motion-reduce:animate-none" />
                      </li>
                    ))
                  )}
                </ol>
              </section>

              <section className="bg-background p-4 sm:p-6">
                <h2 className={eyebrow}>{t.tags}</h2>
                <ul className="mt-3 space-y-2">
                  {ready ? (
                    ready.tags.length ? (
                      ready.tags.map((tag, i) => (
                        <li key={tag.name}>
                          <div className="flex items-baseline justify-between text-sm">
                            <span>{tag.name}</span>
                            <span className="font-mono text-muted-foreground text-xs tabular-nums">
                              {format.number(tag.count)}
                            </span>
                          </div>
                          <div
                            aria-hidden
                            className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/4"
                          >
                            <div
                              className={cn(
                                "h-full",
                                TAG_COLOURS[i % TAG_COLOURS.length]
                              )}
                              style={{
                                width: `${(tag.count / tagMax) * 100}%`,
                              }}
                            />
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground text-sm">
                        {t.none}
                      </li>
                    )
                  ) : (
                    SKELETON_ROWS.map((key) => (
                      <li key={key}>
                        <Skeleton className="h-6 w-full motion-reduce:animate-none" />
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SupportQueue(props: SupportQueueProps) {
  return (
    <ScreenBoundary name="SupportQueue">
      <SupportQueueScreen {...props} />
    </ScreenBoundary>
  );
}

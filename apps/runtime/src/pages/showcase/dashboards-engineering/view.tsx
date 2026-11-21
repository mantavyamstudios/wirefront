// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import type { DoraMetric, DoraRating, PrWeek, Velocity, VelocityRange } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("engineeringVelocity.<key>"). */
export const ENGINEERING_VELOCITY_MESSAGES = {
  eyebrow7d: "Engineering · last 7 days",
  eyebrow30d: "Engineering · last 30 days",
  eyebrow90d: "Engineering · last 90 days",
  title: "Velocity",
  range: "Range",
  deployFrequency: "Deploy frequency",
  leadTime: "Lead time",
  changeFailureRate: "Change failure rate",
  timeToRestore: "MTTR",
  perDay: "{count} / day",
  elite: "Elite",
  high: "High",
  medium: "Medium",
  low: "Low",
  trendLabel: "{metric} over the period",
  throughput: "PR throughput · last {count} weeks",
  mergedClosed: "merged · {closed} closed",
  merged: "merged",
  open: "open",
  closed: "closed",
  chartLabel: "Pull requests per week",
  week: "Week of {date}: {merged} merged, {open} open, {closed} closed",
  ci: "CI health",
  passRate: "Pass rate",
  flakeRate: "Flake rate",
  avgDuration: "Avg duration",
  totalRuns: "Total runs",
  slowest: "Slowest jobs",
  contributors: "Top contributors",
  rankedBy: "Ranked by merged PRs",
  mergedCount: "{count} merged",
  reviewedCount: "{count} reviewed",
  leadTimeLabel: "Lead time",
  none: "Nothing in this period yet.",
  errorTitle: "Couldn’t load engineering metrics",
  retry: "Try again",
};

export interface EngineeringVelocityProps {
  /** The figures for `range`. Leave it out while they load. */
  data?: Velocity;
  range: VelocityRange;
  onRangeChange: (range: VelocityRange) => void;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

type DoraKey = keyof Velocity["dora"];
const DORA_KEYS: DoraKey[] = ["deployFrequency", "leadTime", "changeFailureRate", "timeToRestore"];
/** Only deploy frequency is better when it goes up. */
const HIGHER_IS_BETTER: Record<DoraKey, boolean> = { deployFrequency: true, leadTime: false, changeFailureRate: false, timeToRestore: false };
const RATING_TONE: Record<DoraRating, string> = {
  elite: "text-category-2-foreground",
  high: "text-category-1-foreground",
  medium: "text-category-3-foreground",
  low: "text-category-4-foreground",
};
const RANGES: VelocityRange[] = ["7d", "30d", "90d"];
const SKELETON_ROWS = ["r1", "r2", "r3", "r4"];
const eyebrow = "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]";

/** "2h 18m", "9m 14s" or "42s". */
function duration(seconds: number) {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${s}s`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function MiniSpark({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return <span className="h-4 flex-1" />;
  const w = 80;
  const h = 18;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(0.000_001, max - min);
  const stepX = w / (values.length - 1);
  const points = values.map((v, i) => `${i * stepX},${h - ((v - min) / range) * (h - 2) - 1}`).join(" L ");
  return (
    <svg aria-label={label} className="h-4 flex-1 text-muted-foreground" preserveAspectRatio="none" role="img" viewBox={`0 0 ${w} ${h}`}>
      <path d={`M ${points}`} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function EngineeringVelocityScreen({ data, range, onRangeChange, status = "ready", error, onRetry, className }: EngineeringVelocityProps) {
  const t = useMessages("engineeringVelocity", ENGINEERING_VELOCITY_MESSAGES);
  const format = useFormat();
  const ready = status === "ready" && data ? data : undefined;
  const pct = (v: number, digits = 1) => format.number(v, { style: "percent", maximumFractionDigits: digits });
  const day = (date: string) => format.date(date, { month: "short", day: "numeric", timeZone: "UTC" });

  const doraValue = (key: DoraKey, m: DoraMetric) =>
    key === "deployFrequency" ? interpolate(t.perDay, { count: format.number(m.value, { maximumFractionDigits: 1 }) }) : key === "changeFailureRate" ? pct(m.value) : duration(m.value);

  const weeks = ready?.prWeeks ?? [];
  const merged = weeks.reduce((sum, w) => sum + w.merged, 0);
  const closed = weeks.reduce((sum, w) => sum + w.closed, 0);
  const weekMax = Math.max(1, ...weeks.map((w) => w.merged + w.open + w.closed));
  const topMerged = Math.max(1, ...(ready?.contributors.map((c) => c.merged) ?? [1]));
  const weekLabel = (w: PrWeek) => interpolate(t.week, { date: day(w.weekStart), merged: w.merged, open: w.open, closed: w.closed });

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className={eyebrow}>{t[`eyebrow${range}`]}</div>
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
          </div>
          <RadioGroup aria-label={t.range} className="flex items-center gap-1" onValueChange={(v) => onRangeChange(v as VelocityRange)} value={range}>
            {RANGES.map((r) => (
              <Radio.Root
                className="cursor-pointer rounded-md border border-transparent px-2.5 py-1.5 font-mono text-muted-foreground text-xs outline-none hover:bg-foreground/4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:border-border data-checked:bg-background data-checked:text-foreground pointer-coarse:min-h-10"
                key={r}
                value={r}
              >
                {r}
              </Radio.Root>
            ))}
          </RadioGroup>
        </div>

        {status === "error" ? (
          <div className="rounded-2xl border border-border/60 p-10 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : (
          <div aria-busy={status === "loading"} className="space-y-6">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {DORA_KEYS.map((key) => {
                const m = ready?.dora[key];
                const good = m ? (m.change >= 0) === HIGHER_IS_BETTER[key] : true;
                return (
                  <div className="rounded-xl border border-border/60 bg-background/40 p-4" key={key}>
                    <dt className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t[key]}</dt>
                    {m ? (
                      <>
                        <dd className="mt-1 flex items-baseline justify-between">
                          <span className="font-heading text-2xl tabular-nums">{doraValue(key, m)}</span>
                          {m.change ? (
                            <span className={cn("inline-flex items-baseline gap-0.5 font-mono text-[11px] tabular-nums", good ? "text-category-2-foreground" : "text-category-4-foreground")}>
                              {m.change > 0 ? <ArrowUpRightIcon aria-hidden className="size-3" /> : <ArrowDownRightIcon aria-hidden className="size-3" />}
                              {pct(Math.abs(m.change), 0)}
                            </span>
                          ) : null}
                        </dd>
                        <dd className="mt-2 flex items-center gap-2">
                          <span className={cn("font-mono text-[10px] uppercase tracking-[0.25em]", RATING_TONE[m.rating])}>{t[m.rating]}</span>
                          <MiniSpark label={interpolate(t.trendLabel, { metric: t[key] })} values={m.trend} />
                        </dd>
                      </>
                    ) : (
                      <dd>
                        <Skeleton className="mt-2 h-12 w-full motion-reduce:animate-none" />
                      </dd>
                    )}
                  </div>
                );
              })}
            </dl>

            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 lg:grid-cols-[1fr_320px]">
              <section className="bg-background p-4 sm:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <h2 className={eyebrow}>{interpolate(t.throughput, { count: weeks.length })}</h2>
                    {ready ? (
                      <div className="mt-2 flex items-baseline gap-3">
                        <span className="font-heading text-3xl tabular-nums">{format.number(merged)}</span>
                        <span className="font-mono text-muted-foreground text-xs">{interpolate(t.mergedClosed, { closed: format.number(closed) })}</span>
                      </div>
                    ) : (
                      <Skeleton className="mt-2 h-9 w-32 motion-reduce:animate-none" />
                    )}
                  </div>
                  <div aria-hidden className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-category-2" />
                      {t.merged}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-category-1/60" />
                      {t.open}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-sm bg-category-4/60" />
                      {t.closed}
                    </span>
                  </div>
                </div>
                <div className="mt-5">
                  {ready && weeks.length ? (
                    <ul aria-label={t.chartLabel} className="flex h-40 items-end gap-1.5 sm:h-48 sm:gap-3">
                      {weeks.map((w) => {
                        const total = w.merged + w.open + w.closed || 1;
                        return (
                          // h-full + justify-end so the bar's percentage height has a reference.
                          <li aria-label={weekLabel(w)} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5" key={w.weekStart}>
                            <div aria-hidden className="relative flex w-full flex-col overflow-hidden rounded-md" style={{ height: `${((w.merged + w.open + w.closed) / weekMax) * 100}%` }}>
                              <div className="bg-category-4/60" style={{ height: `${(w.closed / total) * 100}%` }} />
                              <div className="bg-category-1/60" style={{ height: `${(w.open / total) * 100}%` }} />
                              <div className="bg-category-2" style={{ height: `${(w.merged / total) * 100}%` }} />
                            </div>
                            <span aria-hidden className="whitespace-nowrap font-mono text-[10px] text-muted-foreground uppercase tracking-wider max-sm:hidden sm:tracking-widest">
                              {day(w.weekStart)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : ready ? (
                    <p className="flex h-40 items-center justify-center rounded-lg border border-border/60 border-dashed text-muted-foreground text-sm sm:h-48">{t.none}</p>
                  ) : (
                    <Skeleton className="h-40 w-full motion-reduce:animate-none sm:h-48" />
                  )}
                </div>
              </section>

              <section className="bg-background p-4 sm:p-6">
                <h2 className={eyebrow}>{t.ci}</h2>
                {ready ? (
                  <>
                    <dl className="mt-3 space-y-3 text-sm">
                      {[
                        { key: "pass", label: t.passRate, value: pct(ready.ci.passRate), tone: "text-category-2-foreground" },
                        { key: "flake", label: t.flakeRate, value: pct(ready.ci.flakeRate), tone: "text-category-3-foreground" },
                        { key: "avg", label: t.avgDuration, value: duration(ready.ci.avgDurationSeconds), tone: "text-foreground" },
                        { key: "runs", label: t.totalRuns, value: format.number(ready.ci.totalRuns), tone: "text-foreground" },
                      ].map((row) => (
                        <div className="flex items-baseline justify-between" key={row.key}>
                          <dt className="text-muted-foreground">{row.label}</dt>
                          <dd className={cn("font-mono tabular-nums", row.tone)}>{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                    {ready.ci.slowestJobs.length ? (
                      <div className="mt-5">
                        <h3 className={eyebrow}>{t.slowest}</h3>
                        <ul className="mt-2 space-y-1.5 font-mono text-[11px]">
                          {ready.ci.slowestJobs.map((job) => (
                            <li className="flex items-center justify-between gap-3" key={job.name}>
                              <span className="truncate">{job.name}</span>
                              <span className="text-muted-foreground tabular-nums">{duration(job.durationSeconds)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="mt-3 space-y-3">
                    {SKELETON_ROWS.map((key) => (
                      <Skeleton className="h-5 w-full motion-reduce:animate-none" key={key} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="overflow-hidden rounded-2xl border border-border/60 bg-background">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-border/40 border-b px-4 py-3 sm:px-5">
                <h2 className={eyebrow}>{t.contributors}</h2>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t.rankedBy}</span>
              </div>
              <ol className="divide-y divide-border/40">
                {ready ? (
                  ready.contributors.length ? (
                    ready.contributors.map((c, i) => (
                      <li
                        // Lead time drops below sm so the name + bar column keeps its room.
                        className="grid grid-cols-[1.5rem_auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 sm:grid-cols-[2rem_auto_minmax(0,1fr)_auto_auto] sm:gap-4 sm:px-5"
                        key={c.id}
                      >
                        <span aria-hidden className="font-mono text-[11px] text-muted-foreground tabular-nums">
                          #{i + 1}
                        </span>
                        <Avatar className="size-7">
                          <AvatarFallback className="text-[10px]">{initials(c.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate text-sm">{c.name}</div>
                          <div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-foreground/4">
                            <div className="h-full bg-category-2/70" style={{ width: `${(c.merged / topMerged) * 100}%` }} />
                          </div>
                        </div>
                        <div className="text-end font-mono text-[11px] tabular-nums">
                          <div>{interpolate(t.mergedCount, { count: format.number(c.merged) })}</div>
                          <div className="text-[10px] text-muted-foreground">{interpolate(t.reviewedCount, { count: format.number(c.reviewed) })}</div>
                        </div>
                        <div className="text-end font-mono text-[11px] text-muted-foreground tabular-nums max-sm:hidden">
                          <span className="sr-only">{t.leadTimeLabel}</span> {duration(c.leadTimeSeconds)}
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="px-5 py-6 text-center text-muted-foreground text-sm">{t.none}</li>
                  )
                ) : (
                  SKELETON_ROWS.map((key) => (
                    <li className="px-5 py-2.5" key={key}>
                      <Skeleton className="h-8 w-full motion-reduce:animate-none" />
                    </li>
                  ))
                )}
              </ol>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export function EngineeringVelocity(props: EngineeringVelocityProps) {
  return (
    <ScreenBoundary name="EngineeringVelocity">
      <EngineeringVelocityScreen {...props} />
    </ScreenBoundary>
  );
}

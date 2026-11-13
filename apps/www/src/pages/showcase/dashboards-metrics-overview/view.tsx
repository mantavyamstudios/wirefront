// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { ArrowDownRightIcon, ArrowUpRightIcon, PlusIcon } from "lucide-react";
import { useId } from "react";

import type { Activity, Metric, Overview, Range, SeriesPoint } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("metricsOverview.<key>"). */
export const METRICS_OVERVIEW_MESSAGES = {
  eyebrow: "Workspace · {workspace}",
  title: "Overview",
  newReport: "New report",
  range: "Range",
  range7d: "7d",
  range30d: "30d",
  range90d: "90d",
  versus: "vs. previous {range}",
  daily: "{metric} · daily",
  chartLabel: "{metric} over {count} days, latest {value}",
  noChartData: "No data for this period yet.",
  activity: "Recent activity",
  seeAll: "See all",
  noActivity: "Nothing has happened here yet.",
  errorTitle: "Couldn’t load the overview",
  retry: "Try again",
};

export interface MetricsOverviewProps {
  /** The overview for `range`. Leave it out while it loads. */
  data?: Overview;
  /** The period shown; the range control reports changes through `onRangeChange`. */
  range: Range;
  onRangeChange: (range: Range) => void;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Shown above the title. */
  workspace?: string;
  /** The "New report" button only shows when this is given. */
  onNewReport?: () => void;
  /** Where "See all" activity goes. Hidden when not given. */
  activityHref?: string;
  className?: string;
}

const RANGES: Range[] = ["7d", "30d", "90d"];
const SKELETON_CARDS = ["c1", "c2", "c3", "c4"];
const eyebrow = "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]";
const card = "rounded-xl border border-border/60 bg-background/40";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function MetricsOverviewScreen({
  data,
  range,
  onRangeChange,
  status = "ready",
  error,
  onRetry,
  workspace,
  onNewReport,
  activityHref,
  className,
}: MetricsOverviewProps) {
  const t = useMessages("metricsOverview", METRICS_OVERVIEW_MESSAGES);
  const format = useFormat();
  const rangeLabel = (r: Range) => t[`range${r}`];

  const value = (m: Pick<Metric, "value" | "unit">) => {
    switch (m.unit) {
      case "currency":
        return format.money(m.value, undefined, { notation: "compact", maximumFractionDigits: 1 });
      case "percent":
        return format.number(m.value, { style: "percent", maximumFractionDigits: 1 });
      case "duration": {
        const minutes = Math.floor(m.value / 60);
        const seconds = Math.round(m.value % 60);
        return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
      }
      default:
        return format.number(m.value);
    }
  };
  const change = (m: Metric) => format.number(m.change, { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });
  const good = (m: Metric) => (m.goodWhen === "up" ? m.change >= 0 : m.change <= 0);

  const ready = status === "ready" && data;
  const chartMetric = data?.metrics.find((m) => m.id === data.chart.metricId);

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="border-border/60 border-b px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {workspace ? (
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
                {interpolate(t.eyebrow, { workspace })}
              </div>
            ) : null}
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ready ? (
              <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-border/70 bg-background/40 px-3 py-1.5 font-mono text-muted-foreground text-xs">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {format.date(data.period.start, { month: "short", day: "numeric" })} – {format.date(data.period.end, { month: "short", day: "numeric" })}
              </span>
            ) : null}
            {onNewReport ? (
              <Button onClick={onNewReport} size="sm" type="button">
                <PlusIcon />
                {t.newReport}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <main aria-busy={status === "loading"} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        {status === "error" ? (
          <div className={cn(card, "p-10 text-center")}>
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
              {ready
                ? data.metrics.map((m) => (
                    <div className={cn(card, "p-4")} key={m.id}>
                      <div className={eyebrow}>{m.label}</div>
                      <div className="mt-2 font-heading text-3xl tracking-tight">{value(m)}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px]",
                            good(m)
                              ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                              : "bg-rose-500/12 text-rose-700 dark:text-rose-400",
                          )}
                        >
                          {m.change >= 0 ? <ArrowUpRightIcon className="size-3" /> : <ArrowDownRightIcon className="size-3" />}
                          {change(m)}
                        </span>
                        <span className="text-muted-foreground">{interpolate(t.versus, { range: rangeLabel(range) })}</span>
                      </div>
                    </div>
                  ))
                : SKELETON_CARDS.map((key) => (
                    <div className={cn(card, "flex flex-col gap-3 p-4")} key={key}>
                      <Skeleton className="h-3 w-24 motion-reduce:animate-none" />
                      <Skeleton className="h-8 w-28 motion-reduce:animate-none" />
                      <Skeleton className="h-3 w-32 motion-reduce:animate-none" />
                    </div>
                  ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className={cn(card, "p-5 lg:col-span-2")}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className={eyebrow}>
                      {chartMetric ? interpolate(t.daily, { metric: chartMetric.label }) : <Skeleton className="h-3 w-32 motion-reduce:animate-none" />}
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      {chartMetric ? (
                        <>
                          <span className="font-heading text-2xl">{value(chartMetric)}</span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px]",
                              good(chartMetric)
                                ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                                : "bg-rose-500/12 text-rose-700 dark:text-rose-400",
                            )}
                          >
                            {change(chartMetric)}
                          </span>
                        </>
                      ) : (
                        <Skeleton className="h-7 w-24 motion-reduce:animate-none" />
                      )}
                    </div>
                  </div>
                  <fieldset
                    aria-label={t.range}
                    className="flex min-w-0 items-center gap-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]"
                  >
                    {RANGES.map((r) => (
                      <button
                        aria-pressed={r === range}
                        className={cn(
                          "min-h-7 rounded px-2.5 py-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10",
                          r === range ? "bg-foreground/[0.08] text-foreground" : "hover:bg-foreground/[0.05]",
                        )}
                        key={r}
                        onClick={() => r !== range && onRangeChange(r)}
                        type="button"
                      >
                        {rangeLabel(r)}
                      </button>
                    ))}
                  </fieldset>
                </div>

                <div className="mt-6 h-36 w-full sm:h-44">
                  {ready && chartMetric && data.chart.points.length > 1 ? (
                    <Sparkline
                      label={interpolate(t.chartLabel, {
                        metric: chartMetric.label,
                        count: data.chart.points.length,
                        value: format.number(data.chart.points[data.chart.points.length - 1]?.value ?? 0),
                      })}
                      points={data.chart.points}
                    />
                  ) : ready ? (
                    <div className="flex h-full items-center justify-center rounded-lg border border-border/60 border-dashed text-muted-foreground text-sm">
                      {t.noChartData}
                    </div>
                  ) : (
                    <Skeleton className="h-full w-full motion-reduce:animate-none" />
                  )}
                </div>
              </div>

              <div className={cn(card, "p-5")}>
                <div className="flex items-center justify-between">
                  <div className={eyebrow}>{t.activity}</div>
                  {activityHref ? (
                    <WirefrontLink
                      className="flex min-h-8 items-center font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] transition-colors hover:text-foreground pointer-coarse:min-h-10"
                      href={activityHref}
                    >
                      {t.seeAll}
                    </WirefrontLink>
                  ) : null}
                </div>
                {ready ? (
                  data.activity.length ? (
                    <ul className="mt-4 flex flex-col gap-3.5">
                      {data.activity.map((a) => (
                        <ActivityItem a={a} key={a.id} when={format.relative(a.at)} />
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-muted-foreground text-sm">{t.noActivity}</p>
                  )
                ) : (
                  <div className="mt-4 flex flex-col gap-4">
                    {SKELETON_CARDS.map((key) => (
                      <Skeleton className="h-8 w-full motion-reduce:animate-none" key={key} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ActivityItem({ a, when }: { a: Activity; when: string }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className="mt-1 flex size-6 items-center justify-center rounded-full bg-foreground/[0.06] font-medium text-[10px]">
        {initials(a.actor)}
      </span>
      <div className="min-w-0 flex-1 leading-snug">
        <span className="font-medium">{a.actor}</span> <span className="text-muted-foreground">{a.action}</span>{" "}
        <span className="text-foreground/85">{a.target}</span>
        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{when}</div>
      </div>
    </li>
  );
}

function Sparkline({ points, label }: { points: SeriesPoint[]; label: string }) {
  const gradientId = useId();
  const data = points.map((p) => p.value);
  const W = 600;
  const H = 160;
  const PAD = 8;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = (W - PAD * 2) / (data.length - 1);
  const coords = data.map((v, i) => [PAD + i * stepX, PAD + (1 - (v - min) / span) * (H - PAD * 2)] as const);
  const line = coords.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `M ${PAD} ${H - PAD} L ${coords.map(([x, y]) => `${x} ${y}`).join(" L ")} L ${W - PAD} ${H - PAD} Z`;
  const [lastX, lastY] = coords[coords.length - 1] ?? [0, 0];
  // The SVG stretches to the card width (preserveAspectRatio="none"), so the
  // stroke opts out of scaling and the end marker is HTML, not an SVG circle
  // that would turn into an ellipse.
  return (
    <div className="relative h-full w-full">
      <svg aria-label={label} className="h-full w-full" preserveAspectRatio="none" role="img" viewBox={`0 0 ${W} ${H}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="text-primary" d={area} fill={`url(#${gradientId})`} />
        <polyline
          className="text-primary"
          fill="none"
          points={line}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        aria-hidden
        className="-translate-x-1/2 -translate-y-1/2 absolute flex size-3 items-center justify-center rounded-full bg-primary/25"
        style={{ left: `${(lastX / W) * 100}%`, top: `${(lastY / H) * 100}%` }}
      >
        <span className="size-1.5 rounded-full bg-primary" />
      </span>
    </div>
  );
}

export function MetricsOverview(props: MetricsOverviewProps) {
  return (
    <ScreenBoundary name="MetricsOverview">
      <MetricsOverviewScreen {...props} />
    </ScreenBoundary>
  );
}

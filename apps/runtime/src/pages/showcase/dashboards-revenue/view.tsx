// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ArrowDownRightIcon, ArrowUpRightIcon, DownloadIcon } from "lucide-react";
import { useId } from "react";
import type { MonthlyMrr, RevenueRange, RevenueSummary } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("revenueDashboard.<key>"). */
export const REVENUE_DASHBOARD_MESSAGES = {
  eyebrow: "Revenue · last {months} months",
  title: "Recurring revenue",
  range: "Range",
  export: "Export",
  mrr: "MRR",
  arr: "{arr} ARR · {accounts} paying accounts",
  chartLabel: "Monthly recurring revenue over {count} months, from {first} to {last}",
  noTrend: "No revenue in this range yet.",
  netNew: "Net new this month",
  new: "New MRR",
  expansion: "Expansion",
  contraction: "Contraction",
  churn: "Churn",
  nrr: "Net revenue retention",
  nrrMeter: "Net revenue retention",
  byPlan: "By plan",
  planAccounts: "{accounts} acc",
  topAccounts: "Top accounts",
  viewAll: "View all",
  none: "Nothing here yet.",
  errorTitle: "Couldn’t load revenue",
  retry: "Try again",
};

export interface RevenueDashboardProps {
  /** The summary for `range`. Leave it out while it loads. */
  data?: RevenueSummary;
  range: RevenueRange;
  onRangeChange: (range: RevenueRange) => void;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Download the range as CSV. The button only shows when this is given. */
  onExport?: Action<RevenueRange>;
  /** Where "View all" accounts goes. Hidden when not given. */
  accountsHref?: string;
  className?: string;
}

const RANGES: RevenueRange[] = ["24m", "12m", "3m"];
const MONTHS: Record<RevenueRange, number> = { "3m": 3, "12m": 12, "24m": 24 };
/** Plan bar colours by rank. */
const PLAN_COLOURS = ["bg-category-5", "bg-category-1", "bg-category-2", "bg-category-3", "bg-category-6", "bg-category-7"];
/** The retention meter's scale tops out here (120%). */
const NRR_MAX = 1.2;
const SKELETON_ROWS = ["r1", "r2", "r3", "r4"];
const eyebrow = "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]";

function initials(name: string) {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || name.slice(0, 2).toUpperCase();
}

function Delta({ value, label, small }: { value: number; label: string; small?: boolean }) {
  const up = value >= 0;
  return (
    <span className={cn("inline-flex items-baseline gap-0.5", up ? "text-category-2-foreground" : "text-category-4-foreground")}>
      {up ? <ArrowUpRightIcon aria-hidden className={small ? "size-2.5" : "size-3.5"} /> : <ArrowDownRightIcon aria-hidden className={small ? "size-2.5" : "size-3.5"} />}
      <span className={cn("tabular-nums", small ? "text-[10px]" : "text-sm")}>{label}</span>
    </span>
  );
}

function AreaChart({ trend, label }: { trend: MonthlyMrr[]; label: string }) {
  const gradientId = useId();
  const values = trend.map((p) => p.mrr);
  const w = 600;
  const h = 160;
  const max = Math.max(...values);
  const min = Math.min(...values) * 0.95;
  const span = max - min || 1;
  const stepX = w / (values.length - 1);
  const points = values.map((v, i) => `${i * stepX},${h - ((v - min) / span) * h}`);
  return (
    // Stretches to the card width; the stroke opts out of scaling so it stays 2px.
    <svg aria-label={label} className="h-32 w-full text-category-2-foreground sm:h-40" preserveAspectRatio="none" role="img" viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M 0,${h} L ${points.join(" L ")} L ${w},${h} Z`} fill={`url(#${gradientId})`} />
      <path d={`M ${points.join(" L ")}`} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function RevenueDashboardScreen({ data, range, onRangeChange, status = "ready", error, onRetry, onExport, accountsHref, className }: RevenueDashboardProps) {
  const t = useMessages("revenueDashboard", REVENUE_DASHBOARD_MESSAGES);
  const format = useFormat();
  const exporter = useAction(onExport ?? (async () => {}));
  const ready = status === "ready" && data ? data : undefined;

  const compact = (amount: number) => format.money(amount, undefined, { notation: "compact", maximumFractionDigits: 1 });
  const signed = (amount: number) => format.money(amount, undefined, { notation: "compact", maximumFractionDigits: 1, signDisplay: "always" });
  const pct = (value: number, digits = 1) => format.number(Math.abs(value), { style: "percent", maximumFractionDigits: digits });
  const monthLabel = (m: string) => format.date(`${m}-01`, { month: "short", year: "numeric", timeZone: "UTC" });

  const trend = ready?.trend ?? [];
  const current = trend[trend.length - 1]?.mrr ?? 0;
  const previous = trend[trend.length - 2]?.mrr;
  const growth = previous ? (current - previous) / previous : undefined;
  const planTotal = ready?.plans.reduce((sum, p) => sum + p.mrr, 0) || 1;
  const nrr = ready?.netRetention;

  const movements = ready
    ? [
        { key: "new", label: t.new, amount: ready.movements.new, good: true },
        { key: "expansion", label: t.expansion, amount: ready.movements.expansion, good: true },
        { key: "contraction", label: t.contraction, amount: -ready.movements.contraction, good: false },
        { key: "churn", label: t.churn, amount: -ready.movements.churn, good: false },
      ]
    : [];

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className={eyebrow}>{interpolate(t.eyebrow, { months: MONTHS[range] })}</div>
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RadioGroup aria-label={t.range} className="flex items-center gap-1" onValueChange={(v) => onRangeChange(v as RevenueRange)} value={range}>
              {RANGES.map((r) => (
                <Radio.Root
                  className="cursor-pointer rounded-md px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] outline-none hover:bg-foreground/[0.04] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground data-checked:text-background pointer-coarse:min-h-10"
                  key={r}
                  value={r}
                >
                  {r}
                </Radio.Root>
              ))}
            </RadioGroup>
            {onExport ? (
              <Button aria-busy={exporter.isPending()} className="gap-1.5" disabled={exporter.isPending()} onClick={() => void exporter.run(range)} size="sm" variant="outline">
                {exporter.isPending() ? <Spinner data-icon="inline-start" /> : <DownloadIcon className="size-3.5" />}
                {t.export}
              </Button>
            ) : null}
          </div>
        </div>
        {exporter.error ? (
          <p className="text-destructive-foreground text-xs" role="alert">
            {exporter.error}
          </p>
        ) : null}

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
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 lg:grid-cols-[1.4fr_1fr]">
              <section className="bg-background p-4 sm:p-6">
                <h2 className={eyebrow}>{t.mrr}</h2>
                {ready ? (
                  <>
                    <div className="mt-2 flex items-baseline gap-3">
                      <span className="font-heading text-4xl tabular-nums sm:text-5xl">{compact(current)}</span>
                      {growth !== undefined ? <Delta label={pct(growth)} value={growth} /> : null}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {interpolate(t.arr, { arr: compact(current * 12), accounts: format.number(ready.payingAccounts) })}
                    </div>
                    <div className="mt-5">
                      {trend.length > 1 ? (
                        <AreaChart
                          label={interpolate(t.chartLabel, {
                            count: trend.length,
                            first: compact(trend[0]?.mrr ?? 0),
                            last: compact(current),
                          })}
                          trend={trend}
                        />
                      ) : (
                        <p className="flex h-32 items-center justify-center rounded-lg border border-border/60 border-dashed text-muted-foreground text-sm sm:h-40">{t.noTrend}</p>
                      )}
                    </div>
                    {trend.length > 1 ? (
                      <div aria-hidden className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
                        <span>{monthLabel(trend[0]?.month ?? "")}</span>
                        <span>{monthLabel(trend[trend.length - 1]?.month ?? "")}</span>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Skeleton className="mt-2 h-12 w-40 motion-reduce:animate-none" />
                    <Skeleton className="mt-5 h-32 w-full sm:h-40 motion-reduce:animate-none" />
                  </>
                )}
              </section>

              <section className="bg-background p-4 sm:p-6">
                <h2 className={eyebrow}>{t.netNew}</h2>
                <dl className="mt-2 grid grid-cols-2 gap-4">
                  {ready
                    ? movements.map((m) => (
                        <div key={m.key}>
                          <dt className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{m.label}</dt>
                          <dd className={cn("mt-1 font-heading text-xl tabular-nums", m.good ? "text-category-2-foreground" : "text-category-3-foreground")}>{signed(m.amount)}</dd>
                        </div>
                      ))
                    : SKELETON_ROWS.map((key) => <Skeleton className="h-12 w-full motion-reduce:animate-none" key={key} />)}
                </dl>
                <div className="mt-5">
                  <h3 className={eyebrow}>{t.nrr}</h3>
                  {nrr ? (
                    <>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-heading text-3xl tabular-nums">{pct(nrr.value, 0)}</span>
                        {nrr.change ? <Delta label={pct(nrr.change)} value={nrr.change} /> : null}
                      </div>
                      <meter aria-label={t.nrrMeter} aria-valuetext={pct(nrr.value, 0)} className="sr-only" max={NRR_MAX} min={0} value={nrr.value} />
                      <div aria-hidden className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/[0.06]">
                        <div className="h-full bg-category-2" style={{ width: `${Math.min(1, nrr.value / NRR_MAX) * 100}%` }} />
                      </div>
                      <div aria-hidden className="mt-1.5 flex justify-between font-mono text-[10px] text-muted-foreground tabular-nums">
                        <span>{pct(0, 0)}</span>
                        <span>{pct(1, 0)}</span>
                        <span>{pct(NRR_MAX, 0)}</span>
                      </div>
                    </>
                  ) : (
                    <Skeleton className="mt-2 h-16 w-full motion-reduce:animate-none" />
                  )}
                </div>
              </section>
            </div>

            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 lg:grid-cols-2">
              <section className="bg-background p-4 sm:p-6">
                <h2 className={eyebrow}>{t.byPlan}</h2>
                <ul className="mt-4 space-y-3">
                  {ready ? (
                    ready.plans.length ? (
                      ready.plans.map((p, i) => (
                        <li key={p.id}>
                          <div className="flex items-baseline justify-between text-sm">
                            <span>{p.name}</span>
                            <span className="font-mono text-[11px] tabular-nums">
                              {compact(p.mrr)} · <span className="text-muted-foreground">{interpolate(t.planAccounts, { accounts: format.number(p.accounts) })}</span>
                            </span>
                          </div>
                          <div aria-hidden className="mt-1.5 h-2 overflow-hidden rounded-full bg-foreground/[0.04]">
                            <div className={cn("h-full", PLAN_COLOURS[i % PLAN_COLOURS.length])} style={{ width: `${(p.mrr / planTotal) * 100}%` }} />
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground text-sm">{t.none}</li>
                    )
                  ) : (
                    SKELETON_ROWS.map((key) => (
                      <li key={key}>
                        <Skeleton className="h-8 w-full motion-reduce:animate-none" />
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section className="bg-background p-4 sm:p-6">
                <div className="flex items-baseline justify-between">
                  <h2 className={eyebrow}>{t.topAccounts}</h2>
                  {accountsHref ? (
                    <WirefrontLink
                      className="inline-flex min-h-8 items-center gap-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] hover:text-foreground pointer-coarse:min-h-10"
                      href={accountsHref}
                    >
                      {t.viewAll}
                      <span aria-hidden className="rtl:-scale-x-100">
                        →
                      </span>
                    </WirefrontLink>
                  ) : null}
                </div>
                <ul className="mt-3 divide-y divide-border/40">
                  {ready ? (
                    ready.topAccounts.length ? (
                      ready.topAccounts.map((a) => (
                        <li className="flex items-center gap-3 py-2.5" key={a.id}>
                          <Avatar className="size-7">
                            <AvatarFallback className="text-[10px]">{initials(a.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm">{a.name}</div>
                            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{a.plan}</div>
                          </div>
                          <div className="text-end">
                            <div className="font-mono text-sm tabular-nums">{format.money(a.mrr, undefined, { maximumFractionDigits: 0 })}</div>
                            <div className="font-mono text-[10px] tabular-nums">
                              <Delta label={pct(a.change)} small value={a.change} />
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="py-2.5 text-muted-foreground text-sm">{t.none}</li>
                    )
                  ) : (
                    SKELETON_ROWS.map((key) => (
                      <li className="py-2.5" key={key}>
                        <Skeleton className="h-8 w-full motion-reduce:animate-none" />
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

export function RevenueDashboard(props: RevenueDashboardProps) {
  return (
    <ScreenBoundary name="RevenueDashboard">
      <RevenueDashboardScreen {...props} />
    </ScreenBoundary>
  );
}

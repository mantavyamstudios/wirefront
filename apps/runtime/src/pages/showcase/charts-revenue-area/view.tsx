// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { useId } from "react";
import { Area, AreaChart } from "recharts";
import { ChartAxis, ChartContainer, ChartGrid, ChartTooltip, chartColor } from "@/components/chart";
import type { RevenueBreakdown } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("revenueBreakdownChart.<key>"). */
export const REVENUE_BREAKDOWN_CHART_MESSAGES = {
  eyebrow: "Revenue · last 12 months",
  title: "Net revenue",
  subscriptions: "Subscriptions",
  addons: "Add-ons",
  services: "Services",
  change: "{change} vs prev. 12mo",
  chartLabel: "Stacked area chart of monthly revenue by stream, {from} to {to}. Total {total}.",
  empty: "No revenue recorded yet.",
  errorTitle: "Couldn’t load revenue",
  retry: "Try again",
};

export interface RevenueBreakdownChartProps {
  /** Monthly revenue by stream. Leave it out while it loads. */
  data?: RevenueBreakdown;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

const SERIES = ["subscriptions", "addons", "services"] as const;
const COLORS = { subscriptions: chartColor(0), addons: chartColor(1), services: chartColor(2) };

function RevenueBreakdownChartScreen({ data, status = "ready", error, onRetry, className }: RevenueBreakdownChartProps) {
  const t = useMessages("revenueBreakdownChart", REVENUE_BREAKDOWN_CHART_MESSAGES);
  const fmt = useFormat();
  // SVG gradient ids can't contain the punctuation useId produces.
  const gid = useId().replace(/[^\w-]/g, "");
  const months = data?.months ?? [];
  const total = months.reduce((sum, m) => sum + m.subscriptions + m.addons + m.services, 0);
  const change = data?.previousTotal ? (total - data.previousTotal) / data.previousTotal : undefined;
  const monthLabel = (month: string) => fmt.date(`${month}-01T00:00:00Z`, { month: "short", timeZone: "UTC" });
  const compact = (v: number) => fmt.money(v, undefined, { notation: "compact", maximumFractionDigits: 1 });

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>

        <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-6">
          {status === "error" ? (
            <div className="py-12 text-center">
              <p className="font-medium">{t.errorTitle}</p>
              {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
              {onRetry ? (
                <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                  {t.retry}
                </Button>
              ) : null}
            </div>
          ) : !data || status === "loading" ? (
            <div aria-busy="true" className="flex flex-col gap-4">
              <Skeleton className="h-10 w-40 motion-reduce:animate-none" />
              <Skeleton className="h-56 w-full motion-reduce:animate-none sm:h-72" />
            </div>
          ) : months.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="font-heading text-3xl tracking-tight">{compact(total)}</div>
                  {change !== undefined ? (
                    <div
                      className={cn(
                        "mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px]",
                        change >= 0 ? "bg-category-2/12 text-category-2-foreground" : "bg-category-4/12 text-category-4-foreground",
                      )}
                    >
                      {change >= 0 ? <TrendingUpIcon aria-hidden className="size-3" /> : <TrendingDownIcon aria-hidden className="size-3" />}
                      {interpolate(t.change, { change: fmt.number(change, { style: "percent", maximumFractionDigits: 1, signDisplay: "always" }) })}
                    </div>
                  ) : null}
                </div>
                <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {SERIES.map((key) => (
                    <li className="flex items-center gap-1.5 text-muted-foreground text-xs" key={key}>
                      <span aria-hidden className="size-2 rounded-sm" style={{ backgroundColor: COLORS[key] }} />
                      {t[key]}
                    </li>
                  ))}
                </ul>
              </div>

              <ChartContainer
                className="mt-4 h-56 sm:h-72"
                label={interpolate(t.chartLabel, { from: monthLabel(months[0]?.month ?? ""), to: monthLabel(months[months.length - 1]?.month ?? ""), total: compact(total) })}
              >
                <AreaChart data={months.map((m) => ({ ...m, label: monthLabel(m.month) }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    {SERIES.map((key) => (
                      <linearGradient id={`${gid}-${key}`} key={key} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={COLORS[key]} stopOpacity={0.7} />
                        <stop offset="100%" stopColor={COLORS[key]} stopOpacity={0.1} />
                      </linearGradient>
                    ))}
                  </defs>
                  <ChartGrid />
                  <ChartAxis dataKey="label" />
                  <ChartAxis axis="y" tickFormatter={(v) => compact(Number(v))} />
                  <ChartTooltip valueFormatter={(v) => fmt.money(v, undefined, { maximumFractionDigits: 0 })} />
                  {SERIES.map((key) => (
                    <Area dataKey={key} fill={`url(#${gid}-${key})`} key={key} name={t[key]} stackId="1" stroke={COLORS[key]} strokeWidth={1.5} type="monotone" />
                  ))}
                </AreaChart>
              </ChartContainer>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function RevenueBreakdownChart(props: RevenueBreakdownChartProps) {
  return (
    <ScreenBoundary name="RevenueBreakdownChart">
      <RevenueBreakdownChartScreen {...props} />
    </ScreenBoundary>
  );
}

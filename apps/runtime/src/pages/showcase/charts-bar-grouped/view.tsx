// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
} from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { Bar, BarChart, type BarShapeProps, Rectangle } from "recharts";
import {
  ChartAxis,
  ChartContainer,
  ChartGrid,
  ChartTooltip,
  chartColor,
} from "@/components/chart";
import type { PeriodComparison } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("quarterlyComparisonChart.<key>"). */
export const QUARTERLY_COMPARISON_CHART_MESSAGES = {
  eyebrow: "Quarterly bookings · ARR",
  title: "Year-over-year",
  change: "vs prev year · {change}",
  chartLabel:
    "Grouped bar chart of bookings per quarter for {series}. {latest} is {change} on {previous} for the same quarters.",
  empty: "No bookings recorded yet.",
  errorTitle: "Couldn’t load bookings",
  retry: "Try again",
};

export interface QuarterlyComparisonChartProps {
  /** The series and periods to compare. Leave it out while it loads. */
  data?: PeriodComparison;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

/** The oldest series is muted; the rest take chart colours in order. */
const colorFor = (index: number) =>
  index === 0 ? "var(--muted-foreground)" : chartColor(index - 1);

function QuarterlyComparisonChartScreen({
  data,
  status = "ready",
  error,
  onRetry,
  className,
}: QuarterlyComparisonChartProps) {
  const t = useMessages(
    "quarterlyComparisonChart",
    QUARTERLY_COMPARISON_CHART_MESSAGES
  );
  const fmt = useFormat();
  const series = data?.series ?? [];
  const rows = data?.rows ?? [];
  const latest = series[series.length - 1];
  const previous = series[series.length - 2];
  // Compare the newest series with the one before over the periods the newest has reached.
  let change: number | undefined;
  if (latest && previous) {
    const reached = rows.filter(
      (r) => r.values[latest.id] != null && r.values[previous.id] != null
    );
    const now = reached.reduce((sum, r) => sum + (r.values[latest.id] ?? 0), 0);
    const before = reached.reduce(
      (sum, r) => sum + (r.values[previous.id] ?? 0),
      0
    );
    if (before) change = (now - before) / before;
  }
  const changeText =
    change === undefined
      ? ""
      : fmt.number(change, {
          style: "percent",
          maximumFractionDigits: 0,
          signDisplay: "always",
        });
  const compact = (v: number) =>
    fmt.money(v, undefined, { notation: "compact", maximumFractionDigits: 0 });
  const chartRows = rows.map((r) => ({ label: r.label, ...r.values }));

  return (
    <div
      className={cn(
        "min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10",
        className
      )}
    >
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          {t.eyebrow}
        </div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>

        <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-6">
          {status === "error" ? (
            <div className="py-12 text-center">
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
          ) : !data || status === "loading" ? (
            <Skeleton
              aria-busy="true"
              className="h-64 w-full motion-reduce:animate-none sm:h-80"
            />
          ) : rows.length === 0 || series.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">
              {t.empty}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {series.map((s, i) => (
                    <li
                      className="flex items-center gap-1.5 text-muted-foreground text-xs"
                      key={s.id}
                    >
                      <span
                        aria-hidden
                        className="size-2.5 rounded-sm"
                        style={{ backgroundColor: colorFor(i) }}
                      />
                      {s.label}
                    </li>
                  ))}
                </ul>
                {change !== undefined ? (
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                    {interpolate(t.change, { change: changeText })}
                  </span>
                ) : null}
              </div>

              <ChartContainer
                className="mt-4 h-56 sm:h-72"
                label={interpolate(t.chartLabel, {
                  series: series.map((s) => s.label).join(", "),
                  latest: latest?.label ?? "",
                  previous: previous?.label ?? "",
                  change: changeText,
                })}
              >
                <BarChart
                  data={chartRows}
                  margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
                >
                  <ChartGrid />
                  <ChartAxis dataKey="label" />
                  <ChartAxis
                    axis="y"
                    tickFormatter={(v) => compact(Number(v))}
                  />
                  <ChartTooltip
                    valueFormatter={(v) =>
                      fmt.money(v, undefined, { maximumFractionDigits: 0 })
                    }
                  />
                  {series.map((s, i) => (
                    <Bar
                      dataKey={s.id}
                      fill={colorFor(i)}
                      key={s.id}
                      name={s.label}
                      radius={[3, 3, 0, 0]}
                      shape={(props: BarShapeProps) => {
                        // A period this series hasn't reached yet: a dashed outline, no fill.
                        const missing =
                          rows[props.originalDataIndex]?.values[s.id] == null;
                        return (
                          <Rectangle
                            {...props}
                            fillOpacity={missing ? 0 : 1}
                            stroke={missing ? colorFor(i) : undefined}
                            strokeDasharray={missing ? "3 3" : undefined}
                            strokeOpacity={missing ? 0.5 : 0}
                          />
                        );
                      }}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function QuarterlyComparisonChart(props: QuarterlyComparisonChartProps) {
  return (
    <ScreenBoundary name="QuarterlyComparisonChart">
      <QuarterlyComparisonChartScreen {...props} />
    </ScreenBoundary>
  );
}

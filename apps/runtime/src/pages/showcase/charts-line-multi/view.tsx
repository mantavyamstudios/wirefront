// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { useState } from "react";
import { Line, LineChart } from "recharts";
import { ChartAxis, ChartContainer, ChartGrid, ChartTooltip, chartColor } from "@/components/chart";
import type { SeriesOverTime } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("platformUsageChart.<key>"). */
export const PLATFORM_USAGE_CHART_MESSAGES = {
  eyebrow: "Daily active users",
  title: "DAU by platform",
  range: "Range",
  chartLabel: "Line chart of daily active users from {from} to {to}: {latest}.",
  latest: "{name} {value}",
  empty: "No activity recorded in this range.",
  errorTitle: "Couldn’t load usage",
  retry: "Try again",
};

export interface PlatformUsageChartProps {
  /** One value per series per day. Leave it out while it loads. */
  data?: SeriesOverTime;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Ranges to offer, e.g. [{ id: "7d", label: "7d" }]. The picker is hidden without `onRangeChange`. */
  ranges?: { id: string; label: string }[];
  /** The selected range's id. */
  range?: string;
  /** Load another range; pass the new data (or a loading status) back in. */
  onRangeChange?: (range: string) => void;
  className?: string;
}

function PlatformUsageChartScreen({ data, status = "ready", error, onRetry, ranges = [], range, onRangeChange, className }: PlatformUsageChartProps) {
  const t = useMessages("platformUsageChart", PLATFORM_USAGE_CHART_MESSAGES);
  const fmt = useFormat();
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const series = (data?.series ?? []).map((s, i) => ({ ...s, color: chartColor(i) }));
  const points = data?.points ?? [];
  const last = points[points.length - 1];
  const day = (date: string) => fmt.date(`${date}T00:00:00Z`, { month: "short", day: "numeric", timeZone: "UTC" });
  const visible = series.filter((s) => !hidden.has(s.id));
  const toggle = (id: string) =>
    setHidden((h) => {
      const next = new Set(h);
      if (next.has(id)) next.delete(id);
      // Keep at least one line on the chart.
      else if (series.length - next.size > 1) next.add(id);
      return next;
    });

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
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {series.map((s) => (
                    <button
                      aria-pressed={!hidden.has(s.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-2 py-1 text-xs outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10",
                        hidden.has(s.id) && "opacity-50",
                      )}
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      type="button"
                    >
                      <span aria-hidden className="size-2 rounded-sm" style={{ backgroundColor: s.color }} />
                      {s.label}
                      {last?.values[s.id] !== undefined ? <span className="font-mono text-[10px] text-muted-foreground">{fmt.number(last.values[s.id] ?? 0)}</span> : null}
                    </button>
                  ))}
                </div>
                {onRangeChange && ranges.length ? (
                  <RadioGroup
                    aria-label={t.range}
                    className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] max-sm:w-full sm:ms-auto"
                    onValueChange={(v) => onRangeChange(v as string)}
                    value={range ?? ranges[0]?.id}
                  >
                    {ranges.map((r) => (
                      <Radio.Root
                        className="inline-flex min-h-7 cursor-pointer items-center rounded px-2.5 py-1 normal-case outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground/8 data-checked:text-foreground pointer-coarse:min-h-10"
                        key={r.id}
                        value={r.id}
                      >
                        {r.label}
                      </Radio.Root>
                    ))}
                  </RadioGroup>
                ) : null}
              </div>

              {!data || status === "loading" ? (
                <Skeleton aria-busy="true" className="mt-4 h-56 w-full motion-reduce:animate-none sm:h-72" />
              ) : points.length === 0 ? (
                <p className="mt-4 py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
              ) : (
                <ChartContainer
                  className="mt-4 h-56 sm:h-72"
                  label={interpolate(t.chartLabel, {
                    from: day(points[0]?.date ?? ""),
                    to: day(last?.date ?? ""),
                    latest: visible.map((s) => interpolate(t.latest, { name: s.label, value: fmt.number(last?.values[s.id] ?? 0) })).join(", "),
                  })}
                >
                  <LineChart data={points.map((p) => ({ label: day(p.date), ...p.values }))} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <ChartGrid />
                    <ChartAxis dataKey="label" />
                    <ChartAxis axis="y" tickFormatter={(v) => fmt.number(Number(v), { notation: "compact" })} />
                    <ChartTooltip valueFormatter={(v) => fmt.number(v)} />
                    {visible.map((s) => (
                      <Line activeDot={{ r: 4, strokeWidth: 0 }} dataKey={s.id} dot={false} key={s.id} name={s.label} stroke={s.color} strokeWidth={2} type="monotone" />
                    ))}
                  </LineChart>
                </ChartContainer>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlatformUsageChart(props: PlatformUsageChartProps) {
  return (
    <ScreenBoundary name="PlatformUsageChart">
      <PlatformUsageChartScreen {...props} />
    </ScreenBoundary>
  );
}

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { useMediaQuery } from "@wirefront/ui/hooks/use-media-query";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { Bar, BarChart, Cell, LabelList } from "recharts";
import { ChartAxis, ChartContainer, ChartGrid, ChartTooltip } from "@/components/chart";
import type { Movement } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("arrWaterfall.<key>"). */
export const ARR_WATERFALL_MESSAGES = {
  eyebrow: "ARR movement · quarter over quarter",
  title: "ARR waterfall",
  total: "start / end",
  addition: "addition",
  loss: "loss",
  growth: "Net growth {change}",
  amount: "Amount",
  chartLabel: "Waterfall chart from {start} {startValue} to {end} {endValue}: {steps}.",
  step: "{label} {value}",
  errorTitle: "Couldn’t load ARR movement",
  retry: "Try again",
};

export interface ArrWaterfallProps {
  /** The start, the steps and the end label. Leave it out while it loads. */
  data?: Movement;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

const COLORS = { total: "rgb(82 82 91)", up: "rgb(16 185 129)", down: "rgb(244 63 94)" };

function ArrWaterfallScreen({ data, status = "ready", error, onRetry, className }: ArrWaterfallProps) {
  const t = useMessages("arrWaterfall", ARR_WATERFALL_MESSAGES);
  const fmt = useFormat();
  const isPhone = useMediaQuery("max-sm");
  const compact = (v: number, sign = false) => fmt.money(v, undefined, { notation: "compact", maximumFractionDigits: 2, signDisplay: sign ? "always" : "auto" });

  let bars: { key: string; label: string; base: number; delta: number; value: number; display: string; color: string }[] = [];
  let end = 0;
  if (data) {
    let running = data.start.value;
    bars = [{ key: "start", label: data.start.label, base: 0, delta: data.start.value, value: data.start.value, display: compact(data.start.value), color: COLORS.total }];
    for (const s of data.steps) {
      const before = running;
      running += s.value;
      bars.push({ key: s.id, label: s.label, base: Math.min(before, running), delta: Math.abs(s.value), value: s.value, display: compact(s.value, true), color: s.value >= 0 ? COLORS.up : COLORS.down });
    }
    end = running;
    bars.push({ key: "end", label: data.endLabel, base: 0, delta: end, value: end, display: compact(end), color: COLORS.total });
  }
  const growth = data?.start.value ? (end - data.start.value) / data.start.value : undefined;

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
            <Skeleton aria-busy="true" className="h-72 w-full motion-reduce:animate-none sm:h-80" />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em] sm:tracking-[0.25em]">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="size-2.5 rounded-sm bg-foreground/70" />
                  {t.total}
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="size-2.5 rounded-sm bg-category-2" />
                  {t.addition}
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="size-2.5 rounded-sm bg-category-4" />
                  {t.loss}
                </span>
                {growth !== undefined ? (
                  <span className="text-foreground sm:ms-auto">{interpolate(t.growth, { change: fmt.number(growth, { style: "percent", maximumFractionDigits: 1, signDisplay: "always" }) })}</span>
                ) : null}
              </div>

              {/* Phones: every category label, angled; value labels hidden (tooltips carry them). */}
              <ChartContainer
                className="h-72 sm:h-80 max-sm:[&_.recharts-label-list]:hidden"
                label={interpolate(t.chartLabel, {
                  start: data.start.label,
                  startValue: compact(data.start.value),
                  end: data.endLabel,
                  endValue: compact(end),
                  steps: data.steps.map((s) => interpolate(t.step, { label: s.label, value: compact(s.value, true) })).join(", "),
                })}
              >
                <BarChart data={bars} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                  <ChartGrid />
                  <ChartAxis angle={isPhone ? -40 : undefined} dataKey="label" height={isPhone ? 64 : undefined} interval={isPhone ? 0 : undefined} />
                  <ChartAxis axis="y" tickFormatter={(v) => compact(Number(v))} />
                  <ChartTooltip valueFormatter={(v) => fmt.money(v, undefined, { maximumFractionDigits: 0 })} />
                  <Bar dataKey="base" fill="transparent" stackId="w" tooltipType="none" />
                  <Bar dataKey="delta" name={t.amount} radius={[3, 3, 0, 0]} stackId="w">
                    {bars.map((b) => (
                      <Cell fill={b.color} key={b.key} />
                    ))}
                    <LabelList className="font-mono" dataKey="display" fill="currentColor" fontSize={10} position="top" />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ArrWaterfall(props: ArrWaterfallProps) {
  return (
    <ScreenBoundary name="ArrWaterfall">
      <ArrWaterfallScreen {...props} />
    </ScreenBoundary>
  );
}

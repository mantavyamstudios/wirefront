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
import { Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, chartColor } from "@/components/chart";
import type { RevenueMix } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("revenueMixDonut.<key>"). */
export const REVENUE_MIX_DONUT_MESSAGES = {
  eyebrow: "Revenue mix · this quarter",
  title: "Where revenue comes from",
  total: "Total",
  change: "{change} vs last quarter",
  chartLabel: "Donut chart of revenue by source, total {total}: {slices}.",
  sliceLabel: "{name} {share}",
  empty: "No revenue recorded yet.",
  errorTitle: "Couldn’t load the revenue mix",
  retry: "Try again",
};

export interface RevenueMixDonutProps {
  /** Revenue by source. Leave it out while it loads. */
  data?: RevenueMix;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

function RevenueMixDonutScreen({
  data,
  status = "ready",
  error,
  onRetry,
  className,
}: RevenueMixDonutProps) {
  const t = useMessages("revenueMixDonut", REVENUE_MIX_DONUT_MESSAGES);
  const fmt = useFormat();
  const slices = (data?.slices ?? []).map((s, i) => ({
    ...s,
    color: chartColor(i),
  }));
  const total = slices.reduce((sum, s) => sum + s.amount, 0);
  const share = (amount: number) => (total ? amount / total : 0);
  const pct = (v: number) =>
    fmt.number(v, {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  const change = data?.previousTotal
    ? (total - data.previousTotal) / data.previousTotal
    : undefined;
  const compact = (v: number) =>
    fmt.money(v, undefined, { notation: "compact", maximumFractionDigits: 2 });

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
            <div
              aria-busy="true"
              className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]"
            >
              <Skeleton className="mx-auto size-56 rounded-full motion-reduce:animate-none" />
              <Skeleton className="h-56 w-full motion-reduce:animate-none" />
            </div>
          ) : slices.length === 0 || total === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">
              {t.empty}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
              <div className="relative grid place-items-center">
                <ChartContainer
                  className="h-56 w-56"
                  label={interpolate(t.chartLabel, {
                    total: compact(total),
                    slices: slices
                      .map((s) =>
                        interpolate(t.sliceLabel, {
                          name: s.name,
                          share: pct(share(s.amount)),
                        })
                      )
                      .join(", "),
                  })}
                >
                  <PieChart>
                    <ChartTooltip
                      valueFormatter={(v) =>
                        fmt.money(v, undefined, { maximumFractionDigits: 0 })
                      }
                    />
                    {/* Each sector takes the fill of its data entry. */}
                    <Pie
                      data={slices.map((s) => ({ ...s, fill: s.color }))}
                      dataKey="amount"
                      endAngle={-270}
                      innerRadius={60}
                      nameKey="name"
                      outerRadius={96}
                      paddingAngle={1}
                      startAngle={90}
                      strokeWidth={0}
                    />
                  </PieChart>
                </ChartContainer>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 grid place-items-center"
                >
                  <div className="text-center">
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                      {t.total}
                    </div>
                    <div className="mt-0.5 font-heading text-3xl tracking-tight">
                      {compact(total)}
                    </div>
                    {change !== undefined ? (
                      <div
                        className={cn(
                          "mt-1 font-mono text-[10px] uppercase tracking-[0.2em]",
                          change >= 0
                            ? "text-category-2-foreground"
                            : "text-category-4-foreground"
                        )}
                      >
                        {interpolate(t.change, {
                          change: fmt.number(change, {
                            style: "percent",
                            maximumFractionDigits: 1,
                            signDisplay: "always",
                          }),
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <ul className="flex flex-col justify-center gap-3">
                {slices.map((s) => (
                  <li className="flex items-center gap-3" key={s.id}>
                    <span
                      aria-hidden
                      className="size-3 shrink-0 rounded"
                      style={{ backgroundColor: s.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm">{s.name}</span>
                        <span className="font-mono text-muted-foreground text-xs tabular-nums">
                          {pct(share(s.amount))}
                        </span>
                      </div>
                      <div
                        aria-hidden
                        className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted"
                      >
                        <div
                          className="h-full"
                          style={{
                            backgroundColor: s.color,
                            width: `${share(s.amount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 text-end font-mono text-foreground text-xs tabular-nums sm:w-20">
                      {fmt.money(s.amount, undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RevenueMixDonut(props: RevenueMixDonutProps) {
  return (
    <ScreenBoundary name="RevenueMixDonut">
      <RevenueMixDonutScreen {...props} />
    </ScreenBoundary>
  );
}

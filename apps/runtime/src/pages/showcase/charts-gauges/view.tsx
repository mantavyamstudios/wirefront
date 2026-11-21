// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { ChartContainer } from "@/components/chart";
import type { Objective } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("sloGauges.<key>"). */
export const SLO_GAUGES_MESSAGES = {
  eyebrow: "Service-level objectives · this quarter",
  title: "SLO health",
  value: "{value}{unit}",
  target: "target {target}",
  ofTarget: "{percent} of target",
  onTrack: "on track",
  breached: "breached",
  gaugeLabel: "{name}: {value}, target {target}, {state}.",
  empty: "No objectives set up yet.",
  errorTitle: "Couldn’t load objectives",
  retry: "Try again",
};

export interface SloGaugesProps {
  /** The objectives to show. Leave it out while they load. */
  objectives?: Objective[];
  /** "loading" shows placeholders; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

function GaugeCard({ g, t }: { g: Objective; t: typeof SLO_GAUGES_MESSAGES }) {
  const fmt = useFormat();
  const max = g.max ?? 100;
  const fill = Math.max(0, Math.min(1, g.value / max));
  const breached = g.direction === "higher" ? g.value < g.target : g.value > g.target;
  // Within 5% of the scale from the target is a warning even before it's breached.
  const close = !breached && Math.abs(g.value - g.target) / max < 0.05;
  const ringColor = breached ? "rgb(244 63 94)" : close ? "rgb(245 158 11)" : "rgb(20 184 166)";
  const num = (v: number) => fmt.number(v, { maximumFractionDigits: 2 });
  const value = interpolate(t.value, { value: num(g.value), unit: g.unit });
  const target = interpolate(t.value, { value: num(g.target), unit: g.unit });
  const state = breached ? t.breached : t.onTrack;

  return (
    <li className="rounded-xl border border-border/60 bg-background/40 p-5">
      <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{g.name}</h2>
      <div className="relative mt-3 grid place-items-center">
        <ChartContainer className="h-44 w-44" label={interpolate(t.gaugeLabel, { name: g.name, value, target, state })}>
          <RadialBarChart data={[{ name: g.name, value: fill * 100, fill: ringColor }]} endAngle={-36} innerRadius="78%" outerRadius="100%" startAngle={216}>
            <PolarAngleAxis axisLine={false} domain={[0, 100]} tick={false} type="number" />
            <RadialBar background={{ fill: "currentColor", fillOpacity: 0.08 }} cornerRadius={8} dataKey="value" />
          </RadialBarChart>
        </ChartContainer>
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="font-heading text-3xl tracking-tight">
              {num(g.value)}
              <span className="ms-0.5 text-muted-foreground text-sm">{g.unit}</span>
            </div>
            <div className={cn("font-mono text-[10px] uppercase tracking-[0.2em]", breached ? "text-category-4-foreground" : "text-category-2-foreground")}>{state}</div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
        <span className="text-muted-foreground">{interpolate(t.target, { target })}</span>
        <span className="text-foreground/80">{interpolate(t.ofTarget, { percent: fmt.number(g.target ? g.value / g.target : 0, { style: "percent", maximumFractionDigits: 0 }) })}</span>
      </div>
      {g.detail ? <p className="mt-2 text-muted-foreground text-xs">{g.detail}</p> : null}
    </li>
  );
}

function SloGaugesScreen({ objectives, status = "ready", error, onRetry, className }: SloGaugesProps) {
  const t = useMessages("sloGauges", SLO_GAUGES_MESSAGES);
  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>

        {status === "error" ? (
          <div className="mt-6 rounded-xl border border-border/60 py-12 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !objectives || status === "loading" ? (
          <div aria-busy="true" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {["a", "b", "c"].map((k) => (
              <Skeleton className="h-72 w-full rounded-xl motion-reduce:animate-none" key={k} />
            ))}
          </div>
        ) : objectives.length === 0 ? (
          <p className="mt-6 rounded-xl border border-border/60 py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {objectives.map((g) => (
              <GaugeCard g={g} key={g.id} t={t} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function SloGauges(props: SloGaugesProps) {
  return (
    <ScreenBoundary name="SloGauges">
      <SloGaugesScreen {...props} />
    </ScreenBoundary>
  );
}

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ArrowDownRightIcon } from "lucide-react";
import type { Funnel } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("conversionFunnel.<key>"). */
export const CONVERSION_FUNNEL_MESSAGES = {
  eyebrow: "Onboarding funnel · last 30 days",
  title: "Activation",
  overall: "End-to-end conversion: {rate} of visitors reach the last stage.",
  ofFirst: "{share} of the first stage",
  carry: "{rate} carry",
  baseline: "baseline",
  drop: "{rate} drop ({count})",
  highlight: "{from} → {to}",
  good: "good",
  watch: "watch",
  low: "low",
  empty: "No one has entered the funnel yet.",
  errorTitle: "Couldn’t load the funnel",
  retry: "Try again",
};

export interface ConversionFunnelProps {
  /** Stages in order, with how many reached each. Leave it out while it loads. */
  data?: Funnel;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

const TONES = {
  good: "bg-category-2/10 text-category-2-foreground",
  watch: "bg-category-3/10 text-category-3-foreground",
  low: "bg-category-4/10 text-category-4-foreground",
};

function ConversionFunnelScreen({ data, status = "ready", error, onRetry, className }: ConversionFunnelProps) {
  const t = useMessages("conversionFunnel", CONVERSION_FUNNEL_MESSAGES);
  const fmt = useFormat();
  const stages = data?.stages ?? [];
  const first = stages[0]?.count ?? 0;
  const pct = (v: number) => fmt.number(v, { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const rate = (a: number, b: number) => (a ? b / a : 0);
  const byId = new Map(stages.map((s) => [s.id, s]));
  const highlights = (data?.highlights ?? []).flatMap((h) => {
    const from = byId.get(h.from);
    const to = byId.get(h.to);
    if (!from || !to) return [];
    const value = rate(from.count, to.count);
    const tone: keyof typeof TONES = h.target === undefined || value >= h.target ? "good" : value >= h.target * 0.75 ? "watch" : "low";
    return [{ key: `${h.from}-${h.to}`, label: interpolate(t.highlight, { from: from.short ?? from.name, to: to.short ?? to.name }), value, tone }];
  });

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-3xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>

        {status === "error" ? (
          <div className="mt-8 rounded-xl border border-border/60 py-12 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !data || status === "loading" ? (
          <div aria-busy="true" className="mt-8 flex flex-col gap-4">
            {["a", "b", "c", "d"].map((k) => (
              <Skeleton className="h-12 w-full motion-reduce:animate-none" key={k} />
            ))}
          </div>
        ) : stages.length === 0 || first === 0 ? (
          <p className="mt-8 rounded-xl border border-border/60 py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
        ) : (
          <>
            <p className="mt-1 text-muted-foreground text-sm">{interpolate(t.overall, { rate: fmt.number(rate(first, stages[stages.length - 1]?.count ?? 0), { style: "percent", maximumFractionDigits: 2 }) })}</p>

            <ol className="mt-8 flex flex-col">
              {stages.map((s, i) => {
                const share = rate(first, s.count);
                const prev = stages[i - 1];
                const lost = prev ? prev.count - s.count : 0;
                return (
                  <li className="relative" key={s.id}>
                    {/* Phones: label + count on one row, bar full-width below. sm+: three columns. */}
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)_110px] md:grid-cols-[200px_minmax(0,1fr)_120px]">
                      <div className="min-w-0">
                        {s.kind ? <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{s.kind}</div> : null}
                        <div className="text-sm">{s.name}</div>
                      </div>
                      <div className="relative col-span-2 row-start-2 h-10 sm:col-span-1 sm:row-start-auto sm:h-12">
                        <div className="absolute inset-0 rounded-md bg-background" />
                        <div
                          aria-hidden
                          className="absolute inset-y-0 start-0 rounded-md transition-all"
                          style={{
                            width: `${share * 100}%`,
                            background: "linear-gradient(90deg, color-mix(in srgb, var(--chart-1) 95%, transparent), color-mix(in srgb, var(--chart-1) 55%, transparent))",
                          }}
                        />
                        <div className="absolute inset-y-0 end-3 flex items-center">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            <span className="sr-only">{interpolate(t.ofFirst, { share: pct(share) })}</span>
                            <span aria-hidden>{pct(share)}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-end max-sm:col-start-2 max-sm:row-start-1">
                        <div className="font-heading text-lg tabular-nums">{fmt.number(s.count)}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{prev ? interpolate(t.carry, { rate: pct(rate(prev.count, s.count)) }) : t.baseline}</div>
                      </div>
                    </div>
                    {prev ? (
                      <div className="absolute -top-3 end-0 inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 font-mono text-[10px] text-category-4-foreground ring-1 ring-category-4/20 sm:end-auto sm:start-[196px] md:start-[216px]">
                        <ArrowDownRightIcon aria-hidden className="size-3" />
                        {interpolate(t.drop, { rate: pct(-rate(prev.count, lost)), count: fmt.number(lost) })}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>

            {highlights.length ? (
              <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {highlights.map((h) => (
                  <li className="rounded-xl border border-border/60 bg-background/40 p-4" key={h.key}>
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{h.label}</div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-heading text-2xl tracking-tight">{pct(h.value)}</span>
                      <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px]", TONES[h.tone])}>{t[h.tone]}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function ConversionFunnel(props: ConversionFunnelProps) {
  return (
    <ScreenBoundary name="ConversionFunnel">
      <ConversionFunnelScreen {...props} />
    </ScreenBoundary>
  );
}

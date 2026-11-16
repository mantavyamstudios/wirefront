// SPDX-License-Identifier: AGPL-3.0-only
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
import type { HealthWindow, ServiceHealthState, ServiceStatus } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("serviceHealth.<key>"). */
export const SERVICE_HEALTH_MESSAGES = {
  scopeOne: "{scope} · 1 service",
  scopeMany: "{scope} · {count} services",
  title: "Service health",
  window: "Window",
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
  deploying: "Deploying",
  totalRps: "Total RPS",
  owner: "Owner",
  rps: "rps",
  p99: "p99",
  errors: "errors",
  errorTrend: "Error rate · last {window}",
  errorTrendLabel: "{service} error rate over the last {window}, now {rate}",
  slo: "SLO budget",
  uptime: "30d uptime",
  none: "No services reporting yet.",
  errorTitle: "Couldn’t load service health",
  retry: "Try again",
};

export interface ServiceHealthProps {
  /** The services for `window`. Leave it out while they load. */
  services?: ServiceStatus[];
  window: HealthWindow;
  onWindowChange: (window: HealthWindow) => void;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Shown above the title, e.g. "acme/platform". */
  scope?: string;
  className?: string;
}

const WINDOWS: HealthWindow[] = ["1h", "6h", "24h"];
const HEALTH_TONE: Record<ServiceHealthState, { dot: string; label: string }> = {
  healthy: { dot: "bg-success", label: "text-success-foreground" },
  degraded: { dot: "bg-warning", label: "text-warning-foreground" },
  down: { dot: "bg-destructive", label: "text-destructive-foreground" },
  deploying: { dot: "bg-info animate-pulse motion-reduce:animate-none", label: "text-info-foreground" },
};
/** Error rates above these fractions read as a warning or a failure. */
const ERROR_WARN = 0.002;
const ERROR_FAIL = 0.01;
const LATENCY_WARN_MS = 500;
const SKELETON_CARDS = ["s1", "s2", "s3"];
const eyebrow = "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]";

type Tone = "ok" | "warn" | "fail";
function errorTone(rate: number): Tone {
  return rate > ERROR_FAIL ? "fail" : rate > ERROR_WARN ? "warn" : "ok";
}
const TONE_TEXT: Record<Tone, string> = { ok: "text-foreground", warn: "text-category-3-foreground", fail: "text-category-4-foreground" };
const TONE_SPARK: Record<Tone, string> = { ok: "text-success", warn: "text-warning", fail: "text-destructive" };

function Spark({ values, label, className }: { values: number[]; label: string; className: string }) {
  const w = 200;
  const h = 40;
  const max = Math.max(...values, 0.0001);
  const min = Math.min(...values);
  const range = Math.max(0.00001, max - min);
  const stepX = w / Math.max(1, values.length - 1);
  const points = values.map((v, i) => `${i * stepX},${h - ((v - min) / range) * (h - 4) - 2}`).join(" L ");
  return (
    <svg aria-label={label} className={cn("h-full w-full", className)} preserveAspectRatio="none" role="img" viewBox={`0 0 ${w} ${h}`}>
      <path d={`M 0,${h} L ${points} L ${w},${h} Z`} fill="currentColor" fillOpacity="0.12" />
      <path d={`M ${points}`} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function ServiceHealthScreen({ services, window, onWindowChange, status = "ready", error, onRetry, scope, className }: ServiceHealthProps) {
  const t = useMessages("serviceHealth", SERVICE_HEALTH_MESSAGES);
  const format = useFormat();
  const ready = status === "ready" && services ? services : undefined;
  const count = (h: ServiceHealthState) => ready?.filter((s) => s.health === h).length ?? 0;
  const totalRps = ready?.reduce((sum, s) => sum + (s.rps ?? 0), 0) ?? 0;
  const compact = (n: number) => format.number(n, { notation: "compact", maximumFractionDigits: 1 });
  const rate = (r: number) => format.number(r, { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const tiles = [
    { key: "healthy", label: t.healthy, dot: "bg-success", value: ready ? `${count("healthy")}/${ready.length}` : "" },
    { key: "degraded", label: t.degraded, dot: "bg-warning", value: String(count("degraded")) },
    { key: "down", label: t.down, dot: "bg-destructive", value: String(count("down")) },
    { key: "rps", label: t.totalRps, dot: "bg-category-1", value: compact(totalRps) },
  ];

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {scope && ready ? (
              <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
                {interpolate(ready.length === 1 ? t.scopeOne : t.scopeMany, { scope, count: ready.length })}
              </div>
            ) : null}
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
          </div>
          <RadioGroup aria-label={t.window} className="flex items-center gap-1" onValueChange={(v) => onWindowChange(v as HealthWindow)} value={window}>
            {WINDOWS.map((w) => (
              <Radio.Root
                className="cursor-pointer rounded-md border border-transparent px-2.5 py-1.5 font-mono text-muted-foreground text-xs outline-none hover:bg-foreground/[0.04] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:border-border data-checked:bg-background data-checked:text-foreground pointer-coarse:min-h-10"
                key={w}
                value={w}
              >
                {w}
              </Radio.Root>
            ))}
          </RadioGroup>
        </div>

        {status === "error" ? (
          <div className="rounded-xl border border-border/60 p-10 text-center">
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
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {tiles.map((tile) => (
                <div className="rounded-xl border border-border/60 bg-background/40 p-4" key={tile.key}>
                  <dt className={cn(eyebrow, "flex items-center gap-2")}>
                    <span aria-hidden className={cn("size-1.5 rounded-full", tile.dot)} />
                    {tile.label}
                  </dt>
                  <dd className="mt-1 font-mono text-2xl tabular-nums">{ready ? tile.value : <Skeleton className="h-8 w-16 motion-reduce:animate-none" />}</dd>
                </div>
              ))}
            </dl>

            {ready && ready.length === 0 ? (
              <p className="rounded-xl border border-border/60 border-dashed p-10 text-center text-muted-foreground text-sm">{t.none}</p>
            ) : (
              <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {ready
                  ? ready.map((s) => {
                      const tone = HEALTH_TONE[s.health];
                      const errTone = errorTone(s.errorRate);
                      const metrics = [
                        { key: "rps", label: t.rps, value: s.rps === null ? "—" : compact(s.rps), tone: "ok" as Tone },
                        { key: "p99", label: t.p99, value: s.p99Ms === null ? "—" : `${format.number(Math.round(s.p99Ms))}ms`, tone: s.p99Ms !== null && s.p99Ms > LATENCY_WARN_MS ? ("warn" as Tone) : ("ok" as Tone) },
                        { key: "errors", label: t.errors, value: rate(s.errorRate), tone: errTone },
                      ];
                      return (
                        <li className="overflow-hidden rounded-xl border border-border/60 bg-background/40" key={s.id}>
                          <div className="flex items-start justify-between gap-3 px-4 pt-4">
                            <div>
                              <h2 className="flex items-center gap-2">
                                <span aria-hidden className={cn("size-2 rounded-full", tone.dot)} />
                                <span className="font-mono text-sm">{s.name}</span>
                                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{s.region}</span>
                              </h2>
                              <div className={cn("mt-0.5 font-mono text-[10px] uppercase tracking-[0.25em]", tone.label)}>{t[s.health]}</div>
                            </div>
                            <div className="text-end font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                              {t.owner}
                              <div className="mt-0.5 text-foreground">{s.owner}</div>
                            </div>
                          </div>

                          <dl className="grid grid-cols-3 gap-2 px-4 pt-4 sm:gap-3">
                            {metrics.map((m) => (
                              <div className="rounded-md bg-foreground/[0.03] px-2 py-1.5" key={m.key}>
                                <dt className="truncate font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em] sm:tracking-[0.25em]">{m.label}</dt>
                                <dd className={cn("mt-0.5 font-mono text-sm tabular-nums", TONE_TEXT[m.tone])}>{m.value}</dd>
                              </div>
                            ))}
                          </dl>

                          <div className="mt-3 px-4">
                            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{interpolate(t.errorTrend, { window })}</div>
                            <div className="mt-1 h-10">
                              {s.errorTrend.length > 1 ? (
                                <Spark className={TONE_SPARK[errTone]} label={interpolate(t.errorTrendLabel, { service: s.name, window, rate: rate(s.errorRate) })} values={s.errorTrend} />
                              ) : null}
                            </div>
                          </div>

                          <div className="mt-3 border-border/40 border-t px-4 py-3">
                            <div className="flex items-baseline justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                              <span>{t.slo}</span>
                              <span className="text-foreground tabular-nums">{format.number(s.sloBudget, { style: "percent" })}</span>
                            </div>
                            <div aria-hidden className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-foreground/[0.06]">
                              <div
                                className={cn("h-full", s.sloBudget > 0.5 ? "bg-category-2" : s.sloBudget > 0.2 ? "bg-category-3" : "bg-category-4")}
                                style={{ width: `${s.sloBudget * 100}%` }}
                              />
                            </div>
                            <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                              <span>{t.uptime}</span>
                              <span className="text-foreground tabular-nums">{rate(s.uptime30d)}</span>
                            </div>
                          </div>
                        </li>
                      );
                    })
                  : SKELETON_CARDS.map((key) => (
                      <li key={key}>
                        <Skeleton className="h-64 w-full rounded-xl motion-reduce:animate-none" />
                      </li>
                    ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ServiceHealth(props: ServiceHealthProps) {
  return (
    <ScreenBoundary name="ServiceHealth">
      <ServiceHealthScreen {...props} />
    </ScreenBoundary>
  );
}

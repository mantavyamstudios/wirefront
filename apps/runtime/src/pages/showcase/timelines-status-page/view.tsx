// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CheckCircle2Icon } from "lucide-react";
import type { Incident, StatusComponent, StatusSummary } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("statusPage.<key>"). */
export const STATUS_PAGE_MESSAGES = {
  eyebrow: "{product} Status · {host}",
  bannerOne: "One service is experiencing issues",
  bannerMany: "{count} services are experiencing issues",
  allOperational: "All systems operational",
  othersOperational: "All other systems operational",
  uptimeShort: "{days}-day uptime",
  operational: "operational",
  degraded: "degraded",
  outage: "outage",
  daysLabel: "{name}: {bad} of the last {days} days with issues",
  incidents: "Incidents",
  noIncidents: "No incidents reported recently.",
  resolved: "Resolved",
  minor: "minor",
  major: "major",
  critical: "critical",
  affecting: "Affecting {affected}",
  lasted: "duration {duration}",
  ongoing: "ongoing for {duration}",
  hours: "{h}h {m}m",
  minutes: "{m}m",
  investigating: "investigating",
  identified: "identified",
  monitoring: "monitoring",
  errorTitle: "Couldn’t load the status",
  retry: "Try again",
};

export interface StatusPageProps {
  /** Components and incidents. Leave it out while it loads. */
  data?: StatusSummary;
  /** Your product's name and the page's host, for the header. */
  product: string;
  host?: string;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

const SEV_TONE: Record<Incident["severity"], string> = {
  minor: "bg-category-3/15 text-category-3-foreground ring-category-3/20",
  major: "bg-category-4/15 text-category-4-foreground ring-category-4/20",
  critical: "bg-destructive/15 text-destructive-foreground ring-destructive/20",
};
const STATE_DOT = { investigating: "bg-category-4", identified: "bg-category-3", monitoring: "bg-category-1", resolved: "bg-success" };
const HEALTH_DOT: Record<StatusComponent["status"], string> = { operational: "bg-success", degraded: "bg-category-3", outage: "bg-destructive" };
const DAY_BAR: Record<StatusComponent["status"], string> = { operational: "bg-category-2/80", degraded: "bg-category-3", outage: "bg-destructive" };
// Phones show the most recent 30 days.
const PHONE_DAYS = 30;

function StatusPageScreen({ data, product, host, status = "ready", error, onRetry, className }: StatusPageProps) {
  const t = useMessages("statusPage", STATUS_PAGE_MESSAGES);
  const fmt = useFormat();
  const { now } = useWirefront();
  const duration = (ms: number) => {
    const mins = Math.max(0, Math.round(ms / 60_000));
    return mins >= 60 ? interpolate(t.hours, { h: Math.floor(mins / 60), m: mins % 60 }) : interpolate(t.minutes, { m: mins });
  };
  const components = data?.components ?? [];
  const affected = components.filter((c) => c.status !== "operational").length;
  const shownDays = Math.max(0, ...components.map((c) => c.days.length));

  return (
    <div className={cn("min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12", className)}>
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{host ? interpolate(t.eyebrow, { product, host }) : product}</div>
          {data && status === "ready" ? (
            <>
              {affected ? (
                <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-category-3/15 px-4 py-1.5 text-start font-mono text-[12px] text-category-3-foreground" role="status">
                  <span aria-hidden className="size-2 shrink-0 rounded-full bg-category-3 motion-safe:animate-pulse" />
                  {affected === 1 ? t.bannerOne : interpolate(t.bannerMany, { count: affected })}
                </div>
              ) : null}
              <h1 className="mt-4 font-heading text-3xl tracking-tight">{affected ? t.othersOperational : t.allOperational}</h1>
            </>
          ) : null}
        </header>

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
            <Skeleton className="h-56 w-full rounded-xl motion-reduce:animate-none" />
            <Skeleton className="h-40 w-full rounded-xl motion-reduce:animate-none" />
          </div>
        ) : (
          <>
            {components.length ? (
              <div className="mt-8 rounded-xl border border-border/60 bg-background/40 px-4 py-4 sm:px-5">
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                  <span className="sm:hidden">{interpolate(t.uptimeShort, { days: Math.min(PHONE_DAYS, shownDays) })}</span>
                  <span className="max-sm:hidden">{interpolate(t.uptimeShort, { days: shownDays })}</span>
                </div>
                <ul className="mt-3 divide-y divide-border/40">
                  {components.map((c) => {
                    const bad = c.days.filter((d) => d.status !== "operational").length;
                    return (
                      // Phones: name + % on one line, a full-width strip of recent days below.
                      <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 sm:flex-nowrap" key={c.id}>
                        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", HEALTH_DOT[c.status])} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm">{c.name}</div>
                          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t[c.status]}</div>
                        </div>
                        <div aria-label={interpolate(t.daysLabel, { name: c.name, bad, days: c.days.length })} className="flex w-full basis-full gap-0.5 sm:w-auto sm:basis-auto" role="img">
                          {c.days.map((d, i) => (
                            <span
                              className={cn("h-6 min-w-0 flex-1 rounded-sm sm:h-7 sm:w-0.75 sm:flex-none", i < c.days.length - PHONE_DAYS && "max-sm:hidden", DAY_BAR[d.status])}
                              key={d.date}
                            />
                          ))}
                        </div>
                        <span className="shrink-0 text-end font-mono text-[11px] text-muted-foreground sm:order-last sm:w-20">{fmt.number(c.uptime, { style: "percent", minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            <h2 className="mt-10 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t.incidents}</h2>
            {data.incidents.length === 0 ? (
              <p className="mt-3 rounded-xl border border-border/60 py-8 text-center text-muted-foreground text-sm">{t.noIncidents}</p>
            ) : (
              <div className="mt-3 flex flex-col gap-4">
                {data.incidents.map((inc) => {
                  const resolved = Boolean(inc.resolvedAt);
                  const span = (inc.resolvedAt ? new Date(inc.resolvedAt).getTime() : now().getTime()) - new Date(inc.startedAt).getTime();
                  return (
                    <article aria-labelledby={`incident-${inc.id}`} className="rounded-xl border border-border/60 bg-background/40 p-5" key={inc.id}>
                      <div className="flex items-start gap-3">
                        <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] ring-1", SEV_TONE[inc.severity])}>{resolved ? t.resolved : t[inc.severity]}</span>
                        <div className="flex-1">
                          <h3 className="font-heading text-lg" id={`incident-${inc.id}`}>
                            {inc.title}
                          </h3>
                          <div className="mt-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                            {interpolate(t.affecting, { affected: inc.affected.join(", ") })} · {interpolate(resolved ? t.lasted : t.ongoing, { duration: duration(span) })}
                          </div>
                        </div>
                        {resolved ? <CheckCircle2Icon aria-hidden className="size-5 text-category-2-foreground" /> : null}
                      </div>

                      <ol className="relative mt-5">
                        <span aria-hidden className="absolute inset-s-1.25 top-1 bottom-1 w-px bg-border/50" />
                        {inc.updates.map((u) => (
                          <li className="relative grid grid-cols-[24px_1fr] gap-3 py-2" key={u.id}>
                            <span aria-hidden className="z-10 mt-1.5 grid size-3 place-items-center rounded-full ring-2 ring-background">
                              <span className={cn("size-2 rounded-full", STATE_DOT[u.state])} />
                            </span>
                            <div>
                              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em]">
                                <span className="text-foreground">{u.state === "resolved" ? t.resolved : t[u.state]}</span>
                                <time className="text-muted-foreground" dateTime={u.at}>
                                  {fmt.date(u.at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </time>
                              </div>
                              <div className="mt-1 text-foreground/85 text-sm">{u.text}</div>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function StatusPage(props: StatusPageProps) {
  return (
    <ScreenBoundary name="StatusPage">
      <StatusPageScreen {...props} />
    </ScreenBoundary>
  );
}

// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@wirefront/ui/card";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
} from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";

import type { Kpi } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("kpiOverview.<key>"). */
export const KPI_OVERVIEW_MESSAGES = {
  title: "Overview",
  description: "Last 30 days vs the previous period.",
  vsPrevious: "vs prev",
  change: "{change} vs the previous period, {direction}",
  better: "better",
  worse: "worse",
  errorTitle: "Couldn’t load the overview.",
};

export interface KpiOverviewProps {
  kpis: Kpi[];
  /** A tag for the period shown, e.g. "Apr 2026". */
  periodLabel?: string;
  /** "loading" shows skeleton tiles; "error" shows `error`. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  className?: string;
}

const SKELETONS = ["s1", "s2", "s3", "s4"];

function Sparkline({ values, good }: { values: number[]; good: boolean }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = 100 / (values.length - 1);
  const points = values
    .map(
      (v, i) =>
        `${(i * step).toFixed(2)},${(32 - ((v - min) / range) * 32).toFixed(2)}`
    )
    .join(" ");
  return (
    <svg
      aria-hidden
      className={cn("h-9 w-full", good ? "text-success" : "text-destructive")}
      preserveAspectRatio="none"
      viewBox="0 0 100 32"
    >
      <polyline
        fill="none"
        points={points}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function KpiOverviewScreen({
  kpis,
  periodLabel,
  status = "ready",
  error,
  className,
}: KpiOverviewProps) {
  const t = useMessages("kpiOverview", KPI_OVERVIEW_MESSAGES);
  const format = useFormat();
  const value = (k: Kpi) =>
    k.kind === "money"
      ? format.money(k.value, k.currency, {
          notation: "compact",
          maximumFractionDigits: 1,
        })
      : k.kind === "percent"
        ? format.number(k.value / 100, {
            style: "percent",
            maximumFractionDigits: 1,
          })
        : format.number(k.value);

  return (
    <div
      className={cn(
        "min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-12",
        className
      )}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl">{t.title}</h1>
            <p className="text-muted-foreground text-sm">{t.description}</p>
          </div>
          {periodLabel ? (
            <Badge className="font-mono text-[10px]" variant="outline">
              {periodLabel}
            </Badge>
          ) : null}
        </div>

        {status === "error" ? (
          <div
            className="rounded-xl border bg-card p-8 text-center"
            role="alert"
          >
            <p className="font-medium text-sm">{t.errorTitle}</p>
            {error ? (
              <p className="mt-1 text-muted-foreground text-xs">{error}</p>
            ) : null}
          </div>
        ) : (
          <ul
            aria-busy={status === "loading"}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {status === "loading"
              ? SKELETONS.map((key) => (
                  <li key={key}>
                    <Card>
                      <CardHeader>
                        <Skeleton className="h-3 w-16 motion-reduce:animate-none" />
                        <Skeleton className="mt-2 h-7 w-24 motion-reduce:animate-none" />
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Skeleton className="h-9 w-full motion-reduce:animate-none" />
                      </CardContent>
                    </Card>
                  </li>
                ))
              : kpis.map((k) => {
                  const up = k.deltaPct >= 0;
                  const good = up === (k.higherIsBetter ?? true);
                  const change = format.number(k.deltaPct / 100, {
                    style: "percent",
                    maximumFractionDigits: 1,
                    signDisplay: "exceptZero",
                  });
                  return (
                    <li key={k.id}>
                      <Card>
                        <CardHeader>
                          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                            {k.label}
                          </div>
                          <CardTitle className="mt-1 font-heading text-2xl tracking-tight">
                            {value(k)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Sparkline good={good} values={k.series} />
                          <div
                            className={cn(
                              "mt-3 inline-flex items-center gap-1 font-mono text-xs",
                              good
                                ? "text-success-foreground"
                                : "text-destructive-foreground"
                            )}
                          >
                            {up ? (
                              <ArrowUpRightIcon
                                aria-hidden
                                className="size-3"
                              />
                            ) : (
                              <ArrowDownRightIcon
                                aria-hidden
                                className="size-3"
                              />
                            )}
                            <span aria-hidden>{change}</span>
                            <span aria-hidden className="text-muted-foreground">
                              {t.vsPrevious}
                            </span>
                            <span className="sr-only">
                              {interpolate(t.change, {
                                change,
                                direction: good ? t.better : t.worse,
                              })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function KpiOverview(props: KpiOverviewProps) {
  return (
    <ScreenBoundary name="KpiOverview">
      <KpiOverviewScreen {...props} />
    </ScreenBoundary>
  );
}

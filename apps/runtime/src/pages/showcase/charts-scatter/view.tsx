// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { LabelList, ReferenceArea, ReferenceLine, Scatter, ScatterChart, type ScatterShapeProps, Symbols, ZAxis } from "recharts";
import { ChartAxis, ChartContainer, ChartGrid, ChartTooltip, chartColor } from "@/components/chart";
import type { AccountHealth } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("accountHealthScatter.<key>"). */
export const ACCOUNT_HEALTH_SCATTER_MESSAGES = {
  eyebrow: "Account health · top {count} customers",
  title: "Satisfaction × retention",
  subtitle: "Bubble size = MRR. Bottom-left quadrant flags churn risk.",
  satisfaction: "Satisfaction",
  retention: "Retention",
  mrr: "MRR",
  axis: "← satisfaction (NPS proxy) →",
  atRisk: "{count} at risk",
  chartLabel: "Scatter chart of {count} accounts by satisfaction and retention. At risk: {names}.",
  noneAtRisk: "none",
  empty: "No accounts to show yet.",
  errorTitle: "Couldn’t load account health",
  retry: "Try again",
};

export interface AccountHealthScatterProps {
  /** The accounts to plot. Leave it out while they load. */
  accounts?: AccountHealth[];
  /** Below this satisfaction and `riskRetention`, an account is at risk. Defaults to 5.5. */
  riskSatisfaction?: number;
  /** Below this retention and `riskSatisfaction`, an account is at risk. Defaults to 50. */
  riskRetention?: number;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

const RISK = "rgb(244 63 94)";

function AccountHealthScatterScreen({ accounts, riskSatisfaction = 5.5, riskRetention = 50, status = "ready", error, onRetry, className }: AccountHealthScatterProps) {
  const t = useMessages("accountHealthScatter", ACCOUNT_HEALTH_SCATTER_MESSAGES);
  const fmt = useFormat();
  const list = accounts ?? [];
  const isRisk = (a: AccountHealth) => a.satisfaction < riskSatisfaction && a.retention < riskRetention;
  const atRisk = list.filter(isRisk);
  const labelled = new Set(list.filter((a) => a.highlight).map((a) => a.name));

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.eyebrow, { count: list.length })}</div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
        <p className="mt-1 text-muted-foreground text-sm">{t.subtitle}</p>

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
          ) : !accounts || status === "loading" ? (
            <Skeleton aria-busy="true" className="h-72 w-full motion-reduce:animate-none sm:h-96" />
          ) : list.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
          ) : (
            <>
              {/* Point labels collide with bubbles on narrow charts; tooltips carry them there. */}
              <ChartContainer
                className="h-72 sm:h-96 max-sm:[&_.recharts-label-list]:hidden"
                label={interpolate(t.chartLabel, { count: list.length, names: atRisk.length ? atRisk.map((a) => a.name).join(", ") : t.noneAtRisk })}
              >
                <ScatterChart margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                  <ChartGrid vertical />
                  <ChartAxis axis="x" dataKey="satisfaction" domain={[1, 10]} ticks={[1, 3, 5, 7, 9, 10]} type="number" />
                  <ChartAxis axis="y" dataKey="retention" domain={[0, 100]} tickFormatter={(v) => fmt.number(Number(v) / 100, { style: "percent" })} ticks={[0, 25, 50, 75, 100]} type="number" />
                  <ZAxis dataKey="mrr" name={t.mrr} range={[80, 720]} />
                  <ChartTooltip cursor={{ strokeDasharray: "2 4" }} />
                  <ReferenceArea fill={RISK} fillOpacity={0.06} stroke="none" x1={1} x2={riskSatisfaction} y1={0} y2={riskRetention} />
                  <ReferenceLine stroke="currentColor" strokeDasharray="4 4" strokeOpacity={0.3} x={riskSatisfaction} />
                  <ReferenceLine stroke="currentColor" strokeDasharray="4 4" strokeOpacity={0.3} y={riskRetention} />
                  <Scatter
                    data={list}
                    fillOpacity={0.2}
                    shape={(props: ScatterShapeProps) => {
                      const account = list[props.index];
                      const color = account && isRisk(account) ? RISK : chartColor(0);
                      return <Symbols {...props} fill={color} stroke={color} strokeWidth={1.5} type="circle" />;
                    }}
                  >
                    <LabelList
                      className="font-mono"
                      dataKey="name"
                      fill="currentColor"
                      fontSize={10}
                      formatter={(value) => (labelled.has(String(value)) ? String(value) : "")}
                      offset={10}
                      position="right"
                    />
                  </Scatter>
                </ScatterChart>
              </ChartContainer>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em] sm:tracking-[0.25em]">
                <span>{t.axis}</span>
                <span>{interpolate(t.atRisk, { count: atRisk.length })}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AccountHealthScatter(props: AccountHealthScatterProps) {
  return (
    <ScreenBoundary name="AccountHealthScatter">
      <AccountHealthScatterScreen {...props} />
    </ScreenBoundary>
  );
}

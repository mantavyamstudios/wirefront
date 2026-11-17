// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import type { Cohort } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("cohortRetention.<key>"). */
export const COHORT_RETENTION_MESSAGES = {
  eyebrow: "Retention · weekly product use",
  title: "Cohort retention",
  subtitle: "Percent of users from each signup month who returned in subsequent months.",
  grid: "Retention by cohort",
  cohort: "Cohort",
  size: "Size",
  month: "M{n}",
  cell: "{cohort}, month {n}: {value} retained",
  less: "Less",
  more: "More",
  average: "Average M{n}: {value}",
  empty: "No cohorts yet.",
  errorTitle: "Couldn’t load retention",
  retry: "Try again",
};

export interface CohortRetentionProps {
  /** Cohorts, oldest first. Leave it out while they load. */
  cohorts?: Cohort[];
  /** Which month's average to call out under the grid. Defaults to 3. */
  averageMonth?: number;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

/** Relative luminance of an sRGB colour (WCAG 2). */
function luminance([r, g, b]: number[]) {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r ?? 0) + 0.7152 * lin(g ?? 0) + 0.0722 * lin(b ?? 0);
}

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const INDIGO = [99, 102, 241];
// Near-black: with white, every background luminance has an ink at 4.5:1 or more (indigo-950 leaves a gap mid-ramp).
const INK = [2, 2, 12];
const LEGEND = [10, 30, 50, 70, 90];
const alphaFor = (value: number) => 0.12 + (value / 100) * 0.78;

/** The cell text colour with the most contrast against the indigo blended over white at this alpha. */
function inkFor(alpha: number) {
  const bg = luminance(INDIGO.map((c) => 255 - alpha * (255 - c)));
  return contrast(1, bg) >= contrast(luminance(INK), bg) ? "white" : `rgb(${INK.join(" ")})`;
}

function CohortRetentionScreen({ cohorts, averageMonth = 3, status = "ready", error, onRetry, className }: CohortRetentionProps) {
  const t = useMessages("cohortRetention", COHORT_RETENTION_MESSAGES);
  const fmt = useFormat();
  const list = cohorts ?? [];
  const columns = Array.from({ length: Math.max(0, ...list.map((c) => c.retention.length)) }, (_, n) => n);
  const label = (month: string) => fmt.date(`${month}-01T00:00:00Z`, { month: "short", year: "numeric", timeZone: "UTC" });
  const pct = (v: number) => fmt.number(v / 100, { style: "percent", maximumFractionDigits: 1 });
  const reached = list.flatMap((c) => (c.retention[averageMonth] === undefined ? [] : [c.retention[averageMonth] ?? 0]));
  const average = reached.length ? reached.reduce((a, b) => a + b, 0) / reached.length : undefined;

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
        <p className="mt-1 max-w-prose text-muted-foreground text-sm">{t.subtitle}</p>

        <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-3 sm:p-5">
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
          ) : !cohorts || status === "loading" ? (
            <Skeleton aria-busy="true" className="h-96 w-full motion-reduce:animate-none" />
          ) : list.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
          ) : (
            <>
              {/* Only the grid scrolls; the cohort column stays pinned while it does. */}
              <ScrollRegion aria-label={t.grid} orientation="horizontal">
                <table className="w-full border-separate border-spacing-1 text-xs">
                  <thead>
                    <tr>
                      <th className="sticky start-0 z-10 bg-background px-2 py-1 text-start font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t.cohort}</th>
                      <th className="px-2 py-1 text-end font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t.size}</th>
                      {columns.map((n) => (
                        <th className="w-12 min-w-10 px-1 py-1 text-center font-mono text-[10px] text-muted-foreground" key={n}>
                          {interpolate(t.month, { n })}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((c) => (
                      <tr key={c.month}>
                        <th className="sticky start-0 z-10 whitespace-nowrap bg-background px-2 py-1 text-start font-normal text-muted-foreground" scope="row">
                          {label(c.month)}
                        </th>
                        <td className="px-2 py-1 text-end font-mono text-muted-foreground">{fmt.number(c.size)}</td>
                        {columns.map((n) => {
                          const value = c.retention[n];
                          if (value === undefined)
                            return (
                              <td className="p-0.5" key={n}>
                                <div className="h-7 w-full rounded bg-background" />
                              </td>
                            );
                          const alpha = alphaFor(value);
                          const name = interpolate(t.cell, { cohort: label(c.month), n, value: pct(value) });
                          return (
                            <td className="p-0.5" key={n}>
                              <div
                                aria-label={name}
                                className={cn("grid h-7 place-items-center rounded font-mono text-[10px] transition-transform hover:scale-[1.04]", n === 0 && "ring-1 ring-foreground/20")}
                                role="img"
                                style={{ backgroundColor: `rgba(99, 102, 241, ${alpha})`, color: inkFor(alpha) }}
                                title={name}
                              >
                                {fmt.number(value, { maximumFractionDigits: 0 })}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollRegion>

              <div className="mt-5 flex items-center gap-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                <span>{t.less}</span>
                <div aria-hidden className="flex h-3 overflow-hidden rounded">
                  {LEGEND.map((v) => (
                    <span className="h-3 w-6" key={v} style={{ backgroundColor: `rgba(99, 102, 241, ${alphaFor(v)})` }} />
                  ))}
                </div>
                <span>{t.more}</span>
                {average !== undefined ? <span className="ms-auto text-foreground">{interpolate(t.average, { n: averageMonth, value: pct(average) })}</span> : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function CohortRetention(props: CohortRetentionProps) {
  return (
    <ScreenBoundary name="CohortRetention">
      <CohortRetentionScreen {...props} />
    </ScreenBoundary>
  );
}

// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  useWirefront,
} from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { PageviewStats, Range } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("pageviewAnalytics.<key>"). */
export const PAGEVIEW_ANALYTICS_MESSAGES = {
  eyebrow: "Analytics · Pageviews",
  title7d: "Last 7 days",
  title30d: "Last 30 days",
  title90d: "Last 90 days",
  range: "Range",
  export: "Export CSV",
  pageviews: "Pageviews",
  chartLabel: "Daily pageviews for the last {count} days",
  chartPartial: "; the last {partial} days are still being counted",
  sources: "Top sources",
  pages: "Top pages",
  countries: "Top countries",
  none: "No views in this period yet.",
  errorTitle: "Couldn’t load analytics",
  retry: "Try again",
};

export interface PageviewAnalyticsProps {
  /** The stats for `range`. Leave it out while they load. */
  data?: PageviewStats;
  range: Range;
  onRangeChange: (range: Range) => void;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Download the period as CSV. The button only shows when this is given. */
  onExport?: Action<Range>;
  className?: string;
}

const RANGES: Range[] = ["7d", "30d", "90d"];
/** Bar shades by rank, darkest first. */
const SOURCE_SHADES = [
  "bg-foreground/85",
  "bg-foreground/65",
  "bg-foreground/45",
  "bg-foreground/30",
  "bg-foreground/20",
  "bg-foreground/12",
];
const SKELETON_ROWS = ["r1", "r2", "r3", "r4", "r5"];
const eyebrow =
  "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]";

/** A flag emoji from an ISO 3166-1 alpha-2 code. */
function flag(code: string) {
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0))
  );
}

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 bg-background/40 p-5",
        className
      )}
    >
      <h2 className={eyebrow}>{title}</h2>
      {children}
    </section>
  );
}

function PageviewAnalyticsScreen({
  data,
  range,
  onRangeChange,
  status = "ready",
  error,
  onRetry,
  onExport,
  className,
}: PageviewAnalyticsProps) {
  const t = useMessages("pageviewAnalytics", PAGEVIEW_ANALYTICS_MESSAGES);
  const format = useFormat();
  const { locale } = useWirefront();
  const exporter = useAction(onExport ?? (async () => {}));
  const ready = status === "ready" && data ? data : undefined;
  const percent = (value: number, sign = false) =>
    format.number(value, {
      style: "percent",
      maximumFractionDigits: 0,
      ...(sign ? { signDisplay: "exceptZero" as const } : {}),
    });
  // Days are calendar dates, so they're shown as-is rather than shifted into a time zone.
  const day = (date: string) =>
    format.date(date, { month: "short", day: "numeric", timeZone: "UTC" });
  const countryName = (code: string) => {
    try {
      return (
        new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code
      );
    } catch {
      return code;
    }
  };

  const daily = ready?.daily ?? [];
  const peak = Math.max(1, ...daily.map((d) => d.views));
  const partial = daily.filter((d) => d.partial).length;
  // Six evenly spaced date labels; phones show every other one.
  const ticks =
    daily.length > 1
      ? [
          ...new Set(
            Array.from(
              { length: 6 },
              (_, i) =>
                daily[Math.round((i / 5) * (daily.length - 1))]?.date ?? ""
            )
          ),
        ]
      : [];
  // Shares are of all listed sources; bars are scaled to the largest one.
  const sourceSum = ready?.sources.reduce((sum, s) => sum + s.views, 0) || 1;
  const sourceTotal = Math.max(
    1,
    ...(ready?.sources.map((s) => s.views) ?? [1])
  );
  const empty = ready && ready.total === 0;

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="border-border/60 border-b px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              {t.eyebrow}
            </div>
            <h1 className="mt-1 font-heading text-2xl">{t[`title${range}`]}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RadioGroup
              aria-label={t.range}
              className="inline-flex items-center rounded-md border border-border/70 bg-background/40 font-mono text-muted-foreground text-xs"
              onValueChange={(v) => onRangeChange(v as Range)}
              value={range}
            >
              {RANGES.map((r) => (
                <Radio.Root
                  className="cursor-pointer whitespace-nowrap px-2.5 py-1.5 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground data-checked:text-background pointer-coarse:min-h-10"
                  key={r}
                  value={r}
                >
                  {r}
                </Radio.Root>
              ))}
            </RadioGroup>
            {onExport ? (
              <Button
                aria-busy={exporter.isPending()}
                disabled={exporter.isPending()}
                onClick={() => void exporter.run(range)}
                size="sm"
                type="button"
                variant="outline"
              >
                {exporter.isPending() ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                {t.export}
              </Button>
            ) : null}
          </div>
        </div>
        {exporter.error ? (
          <p
            className="mx-auto mt-2 max-w-6xl text-destructive-foreground text-xs"
            role="alert"
          >
            {exporter.error}
          </p>
        ) : null}
      </div>

      <main
        aria-busy={status === "loading"}
        className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10"
      >
        {status === "error" ? (
          <div className="rounded-xl border border-border/60 bg-background/40 p-10 text-center">
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
        ) : (
          <>
            <section className="rounded-xl border border-border/60 bg-background/40 p-4 sm:p-6">
              <h2 className={eyebrow}>{t.pageviews}</h2>
              <div className="mt-1 flex items-baseline gap-2">
                {ready ? (
                  <>
                    <span className="font-heading text-3xl">
                      {format.number(ready.total)}
                    </span>
                    {ready.total ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px]",
                          ready.change >= 0
                            ? "bg-category-2/12 text-category-2-foreground"
                            : "bg-category-4/12 text-category-4-foreground"
                        )}
                      >
                        {ready.change >= 0 ? (
                          <ArrowUpRightIcon aria-hidden className="size-3" />
                        ) : (
                          <ArrowDownRightIcon aria-hidden className="size-3" />
                        )}
                        {percent(ready.change, true)}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <Skeleton className="h-9 w-36 motion-reduce:animate-none" />
                )}
              </div>

              {ready && daily.length && !empty ? (
                <>
                  <div
                    aria-label={
                      interpolate(t.chartLabel, { count: daily.length }) +
                      (partial ? interpolate(t.chartPartial, { partial }) : "")
                    }
                    className="mt-6 flex h-32 items-end gap-0.5 sm:h-40 sm:gap-1.5"
                    role="img"
                  >
                    {daily.map((d) => (
                      <div className="h-full flex-1 content-end" key={d.date}>
                        <div
                          className="w-full rounded-sm bg-foreground/75"
                          style={{
                            height: `${(d.views / peak) * 100}%`,
                            opacity: d.partial ? 0.45 : 0.85,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div
                    aria-hidden
                    className="mt-3 flex justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-[0.12em] sm:tracking-[0.2em]"
                  >
                    {ticks.map((date, i) => (
                      <span
                        className={cn(
                          i % 2 === 1 &&
                            i !== ticks.length - 1 &&
                            "max-sm:hidden"
                        )}
                        key={`tick-${date}`}
                      >
                        {day(date)}
                      </span>
                    ))}
                  </div>
                </>
              ) : ready ? (
                <p className="mt-6 flex h-32 items-center justify-center rounded-lg border border-border/60 border-dashed text-muted-foreground text-sm sm:h-40">
                  {t.none}
                </p>
              ) : (
                <Skeleton className="mt-6 h-32 w-full sm:h-40 motion-reduce:animate-none" />
              )}
            </section>

            <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <Card title={t.sources}>
                <ul className="mt-4 flex flex-col gap-3">
                  {ready
                    ? ready.sources.map((s, i) => (
                        <li className="text-sm" key={s.id}>
                          <div className="flex items-baseline justify-between">
                            <span>{s.label}</span>
                            <span className="font-mono text-xs">
                              <span className="text-foreground">
                                {format.number(s.views)}
                              </span>
                              <span className="ms-1.5 text-muted-foreground">
                                {percent(s.views / sourceSum)}
                              </span>
                            </span>
                          </div>
                          <div
                            aria-hidden
                            className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/6"
                          >
                            <div
                              className={cn(
                                "h-full",
                                SOURCE_SHADES[
                                  Math.min(i, SOURCE_SHADES.length - 1)
                                ]
                              )}
                              style={{
                                width: `${(s.views / sourceTotal) * 100}%`,
                              }}
                            />
                          </div>
                        </li>
                      ))
                    : SKELETON_ROWS.map((key) => (
                        <Skeleton
                          className="h-6 w-full motion-reduce:animate-none"
                          key={key}
                        />
                      ))}
                </ul>
              </Card>

              <Card title={t.pages}>
                <ul className="mt-4 flex flex-col gap-1">
                  {ready
                    ? ready.pages.map((p) => (
                        <li
                          className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm"
                          key={p.path}
                        >
                          <span className="min-w-0 truncate font-mono text-[12px]">
                            {p.path}
                          </span>
                          <span className="flex shrink-0 items-center gap-3">
                            <span className="font-mono text-xs">
                              {format.number(p.views)}
                            </span>
                            <span
                              className={cn(
                                "w-12 text-end font-mono text-[10px]",
                                p.change >= 0
                                  ? "text-category-2-foreground"
                                  : "text-category-4-foreground"
                              )}
                            >
                              {percent(p.change, true)}
                            </span>
                          </span>
                        </li>
                      ))
                    : SKELETON_ROWS.map((key) => (
                        <Skeleton
                          className="h-8 w-full motion-reduce:animate-none"
                          key={key}
                        />
                      ))}
                </ul>
              </Card>
            </div>

            <Card className="mt-3" title={t.countries}>
              <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {ready
                  ? ready.countries.map((c) => (
                      <li
                        className="flex items-center gap-2.5 rounded-md border border-border/40 bg-background/40 px-3 py-2 text-sm"
                        key={c.country}
                      >
                        <span aria-hidden className="text-base">
                          {flag(c.country)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs">
                            {countryName(c.country)}
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                            {percent(c.share)}
                          </div>
                        </div>
                      </li>
                    ))
                  : SKELETON_ROWS.map((key) => (
                      <Skeleton
                        className="h-11 w-full motion-reduce:animate-none"
                        key={key}
                      />
                    ))}
              </ul>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

export function PageviewAnalytics(props: PageviewAnalyticsProps) {
  return (
    <ScreenBoundary name="PageviewAnalytics">
      <PageviewAnalyticsScreen {...props} />
    </ScreenBoundary>
  );
}

// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ArrowDownRightIcon, ArrowUpRightIcon, PlusIcon } from "lucide-react";
import { useId } from "react";
import type { ChartRange, MarketOverview } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("marketsDashboard.<key>"). */
export const MARKETS_DASHBOARD_MESSAGES = {
  eyebrow: "Portfolio · {name}",
  title: "Markets",
  addTicker: "Add ticker",
  chartRange: "Chart range",
  todayVolume: "{change} today · vol {volume}",
  chartLabel: "{symbol} price over {range}, from {first} to {last}",
  portfolioValue: "Portfolio value",
  allocation: "Allocation",
  watchlist: "Watchlist",
  tickers: "{count} tickers · last 24h",
  symbol: "Symbol",
  price: "Price",
  change: "Change",
  trend: "24h",
  volume: "Vol",
  showTicker: "Show {symbol}",
  sparkLabel: "{symbol} over the last 24 hours",
  headlines: "Headlines",
  noWatchlist: "Your watchlist is empty.",
  noHeadlines: "No headlines yet.",
  errorTitle: "Couldn’t load markets",
  retry: "Try again",
};

export interface MarketsDashboardProps {
  /** The overview for `range`. Leave it out while it loads. */
  data?: MarketOverview;
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Feature a watchlist ticker in the chart. Symbols are plain text without it. */
  onSelectTicker?: (symbol: string) => void;
  /** The "Add ticker" button only shows when this is given. */
  onAddTicker?: () => void;
  /** The portfolio's name, shown above the title. */
  portfolioName?: string;
  className?: string;
}

const RANGES: ChartRange[] = ["1D", "1W", "1M", "1Y", "ALL"];
/** Allocation colours by rank; the last slice is usually cash. */
const ALLOCATION_COLOURS = ["bg-category-5", "bg-category-1", "bg-category-2", "bg-category-3", "bg-muted-foreground", "bg-category-6"];
const SKELETON_ROWS = ["r1", "r2", "r3", "r4"];
const eyebrow = "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]";

function Line({ values, label, className, area, height }: { values: number[]; label: string; className: string; area?: boolean; height: number }) {
  const gradientId = useId();
  if (values.length < 2) return null;
  const w = 700;
  const h = height;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(0.001, max - min);
  const pad = area ? 10 : 2;
  const stepX = w / (values.length - 1);
  const pts = values.map((v, i) => `${i * stepX},${h - ((v - min) / range) * (h - pad * 2) - pad}`).join(" L ");
  return (
    <svg aria-label={label} className={cn("h-full w-full", className)} preserveAspectRatio="none" role="img" viewBox={`0 0 ${w} ${h}`}>
      {area ? (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="text-foreground/10" d={`M0 ${h * 0.25}H${w}M0 ${h * 0.5}H${w}M0 ${h * 0.75}H${w}`} stroke="currentColor" strokeDasharray="2 4" />
          <path d={`M 0,${h} L ${pts} L ${w},${h} Z`} fill={`url(#${gradientId})`} />
        </>
      ) : null}
      <path d={`M ${pts}`} fill="none" stroke="currentColor" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function MarketsDashboardScreen({ data, range, onRangeChange, status = "ready", error, onRetry, onSelectTicker, onAddTicker, portfolioName, className }: MarketsDashboardProps) {
  const t = useMessages("marketsDashboard", MARKETS_DASHBOARD_MESSAGES);
  const format = useFormat();
  const ready = status === "ready" && data ? data : undefined;
  const money = (v: number) => format.money(v);
  const signedMoney = (v: number) => format.money(v, undefined, { signDisplay: "exceptZero" });
  const pct = (v: number, sign = false) => format.number(sign ? v : Math.abs(v), { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2, ...(sign ? { signDisplay: "exceptZero" as const } : {}) });
  const volume = (v: number) => format.number(v, { notation: "compact", maximumFractionDigits: 1 });
  const tone = (change: number) => (change >= 0 ? "text-category-2-foreground" : "text-category-4-foreground");
  const line = (change: number) => (change >= 0 ? "text-success" : "text-destructive");

  const featured = ready?.featured;
  const portfolio = ready?.portfolio;
  const previous = portfolio ? portfolio.value - portfolio.change : 0;

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {portfolioName ? <div className={eyebrow}>{interpolate(t.eyebrow, { name: portfolioName })}</div> : null}
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
          </div>
          {onAddTicker ? (
            <Button className="gap-1.5 pointer-coarse:h-10" onClick={onAddTicker} size="sm" variant="outline">
              <PlusIcon className="size-3.5" />
              {t.addTicker}
            </Button>
          ) : null}
        </div>

        {status === "error" ? (
          <div className="rounded-2xl border border-border/60 p-10 text-center">
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
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 lg:grid-cols-[1fr_300px]">
              <section className="bg-background p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {featured ? (
                    <div className="min-w-0">
                      <h2 className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-heading text-2xl">{featured.symbol}</span>{" "}
                        <span className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">{featured.name}</span>
                      </h2>
                      <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
                        <span className="font-mono text-4xl tabular-nums sm:text-5xl">{money(featured.price)}</span>
                        <span className={cn("inline-flex items-baseline gap-0.5 font-mono tabular-nums", tone(featured.change))}>
                          {featured.change >= 0 ? <ArrowUpRightIcon aria-hidden className="size-4" /> : <ArrowDownRightIcon aria-hidden className="size-4" />}
                          {pct(featured.change)}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-muted-foreground text-xs">
                        {interpolate(t.todayVolume, {
                          change: signedMoney(featured.price - featured.price / (1 + featured.change)),
                          volume: volume(featured.volume),
                        })}
                      </div>
                    </div>
                  ) : (
                    <Skeleton className="h-24 w-56 motion-reduce:animate-none" />
                  )}
                  <RadioGroup aria-label={t.chartRange} className="flex gap-1" onValueChange={(v) => onRangeChange(v as ChartRange)} value={range}>
                    {RANGES.map((r) => (
                      <Radio.Root
                        className="min-h-7 cursor-pointer rounded-md px-2 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em] outline-none hover:bg-foreground/4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground data-checked:text-background pointer-coarse:min-h-10 pointer-coarse:px-2.5"
                        key={r}
                        value={r}
                      >
                        {r}
                      </Radio.Root>
                    ))}
                  </RadioGroup>
                </div>
                <div className="mt-5 h-48">
                  {featured ? (
                    <Line
                      area
                      className={line(featured.change)}
                      height={200}
                      label={interpolate(t.chartLabel, {
                        symbol: featured.symbol,
                        range,
                        first: money(featured.series[0] ?? featured.price),
                        last: money(featured.series[featured.series.length - 1] ?? featured.price),
                      })}
                      values={featured.series}
                    />
                  ) : (
                    <Skeleton className="h-full w-full motion-reduce:animate-none" />
                  )}
                </div>
              </section>

              <section className="bg-background p-4 sm:p-6">
                <h2 className={eyebrow}>{t.portfolioValue}</h2>
                {portfolio ? (
                  <>
                    <div className="mt-2 font-heading text-3xl tabular-nums">{format.money(portfolio.value, undefined, { maximumFractionDigits: 0 })}</div>
                    <div className={cn("mt-1 inline-flex items-baseline gap-1 font-mono text-sm tabular-nums", tone(portfolio.change))}>
                      {portfolio.change >= 0 ? <ArrowUpRightIcon aria-hidden className="size-3.5" /> : <ArrowDownRightIcon aria-hidden className="size-3.5" />}
                      {format.money(portfolio.change, undefined, { maximumFractionDigits: 0, signDisplay: "exceptZero" })} · {pct(previous ? portfolio.change / previous : 0)}
                    </div>
                    <div className="mt-5">
                      <h3 className={eyebrow}>{t.allocation}</h3>
                      <div aria-hidden className="mt-3 flex h-3 overflow-hidden rounded-full">
                        {portfolio.allocation.map((a, i) => (
                          <div className={cn("h-full", ALLOCATION_COLOURS[i % ALLOCATION_COLOURS.length])} key={a.name} style={{ width: `${a.share * 100}%` }} />
                        ))}
                      </div>
                      <dl className="mt-3 space-y-1.5 font-mono text-[11px]">
                        {portfolio.allocation.map((a, i) => (
                          <div className="flex items-center justify-between" key={a.name}>
                            <dt className="flex items-center gap-2">
                              <span aria-hidden className={cn("size-2 rounded-full", ALLOCATION_COLOURS[i % ALLOCATION_COLOURS.length])} />
                              {a.name}
                            </dt>
                            <dd className="text-muted-foreground tabular-nums">{format.number(a.share, { style: "percent" })}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </>
                ) : (
                  <Skeleton className="mt-2 h-48 w-full motion-reduce:animate-none" />
                )}
              </section>
            </div>

            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 lg:grid-cols-[1.6fr_1fr]">
              <section className="bg-background">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-border/40 border-b px-4 py-3 sm:px-5">
                  <h2 className={eyebrow}>{t.watchlist}</h2>
                  {ready ? <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{interpolate(t.tickers, { count: ready.watchlist.length })}</span> : null}
                </div>
                {ready && ready.watchlist.length === 0 ? (
                  <p className="px-5 py-8 text-center text-muted-foreground text-sm">{t.noWatchlist}</p>
                ) : (
                  // Priority columns: sparkline from sm, volume from md.
                  <table className="w-full">
                    <thead>
                      <tr className="border-border/40 border-b font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                        <th className="px-3 py-2 text-start font-normal sm:px-5" scope="col">
                          {t.symbol}
                        </th>
                        <th className="px-3 py-2 text-end font-normal sm:px-5" scope="col">
                          {t.price}
                        </th>
                        <th className="px-3 py-2 text-end font-normal sm:px-5" scope="col">
                          {t.change}
                        </th>
                        <th className="px-5 py-2 text-start font-normal max-sm:hidden" scope="col">
                          {t.trend}
                        </th>
                        <th className="px-5 py-2 text-end font-normal max-md:hidden" scope="col">
                          {t.volume}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ready
                        ? ready.watchlist.map((q) => (
                            <tr className="border-border/30 border-b hover:bg-foreground/2" key={q.symbol}>
                              <td className="px-3 py-2.5 sm:px-5">
                                {onSelectTicker ? (
                                  <button
                                    aria-label={interpolate(t.showTicker, { symbol: q.symbol })}
                                    className="rounded-sm text-start font-mono text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                                    onClick={() => onSelectTicker(q.symbol)}
                                    type="button"
                                  >
                                    {q.symbol}
                                  </button>
                                ) : (
                                  <div className="font-mono text-sm">{q.symbol}</div>
                                )}
                                <div className="max-w-36 truncate font-mono text-[10px] text-muted-foreground">{q.name}</div>
                              </td>
                              <td className="px-3 py-2.5 text-end font-mono text-sm tabular-nums sm:px-5">{money(q.price)}</td>
                              <td className={cn("px-3 py-2.5 text-end font-mono text-sm tabular-nums sm:px-5", tone(q.change))}>{pct(q.change, true)}</td>
                              <td className="px-5 py-2.5 max-sm:hidden">
                                <div className="h-7 w-24 lg:w-32">
                                  <Line className={line(q.change)} height={28} label={interpolate(t.sparkLabel, { symbol: q.symbol })} values={q.series} />
                                </div>
                              </td>
                              <td className="px-5 py-2.5 text-end font-mono text-[11px] text-muted-foreground tabular-nums max-md:hidden">{volume(q.volume)}</td>
                            </tr>
                          ))
                        : SKELETON_ROWS.map((key) => (
                            <tr key={key}>
                              <td className="px-5 py-2.5" colSpan={5}>
                                <Skeleton className="h-8 w-full motion-reduce:animate-none" />
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section className="bg-background">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-border/40 border-b px-4 py-3 sm:px-5">
                  <h2 className={eyebrow}>{t.headlines}</h2>
                </div>
                <ul className="divide-y divide-border/40">
                  {ready ? (
                    ready.headlines.length ? (
                      ready.headlines.map((n) => (
                        <li className="px-4 py-3 sm:px-5" key={n.id}>
                          <div className="flex items-baseline gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                            <time className="tabular-nums" dateTime={n.publishedAt}>
                              {format.time(n.publishedAt)}
                            </time>
                            <span aria-hidden>·</span>
                            <span>{n.source}</span>
                          </div>
                          {n.url ? (
                            <WirefrontLink className="mt-1 block text-sm leading-snug underline-offset-4 hover:underline" href={n.url}>
                              {n.title}
                            </WirefrontLink>
                          ) : (
                            <div className="mt-1 text-sm leading-snug">{n.title}</div>
                          )}
                        </li>
                      ))
                    ) : (
                      <li className="px-5 py-8 text-center text-muted-foreground text-sm">{t.noHeadlines}</li>
                    )
                  ) : (
                    SKELETON_ROWS.map((key) => (
                      <li className="px-5 py-3" key={key}>
                        <Skeleton className="h-10 w-full motion-reduce:animate-none" />
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MarketsDashboard(props: MarketsDashboardProps) {
  return (
    <ScreenBoundary name="MarketsDashboard">
      <MarketsDashboardScreen {...props} />
    </ScreenBoundary>
  );
}

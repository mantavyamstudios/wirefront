// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** The featured chart's span. */
export const ChartRange = z.enum(["1D", "1W", "1M", "1Y", "ALL"]).meta({ id: "ChartRange" });
export type ChartRange = z.infer<typeof ChartRange>;

/** Prices are in the provider's currency. */
export const Quote = z
  .object({
    symbol: z.string(),
    name: z.string(),
    price: z.number().nonnegative(),
    /** Change since the previous close, as a fraction (0.0241 = +2.41%). */
    change: z.number(),
    /** Shares traded today. */
    volume: z.number().int().nonnegative(),
    /** Prices over the period, oldest first. */
    series: z.array(z.number()),
  })
  .meta({ id: "Quote" });
export type Quote = z.infer<typeof Quote>;

export const Headline = z
  .object({
    id: z.string(),
    publishedAt: z.iso.datetime({ offset: true }),
    source: z.string(),
    title: z.string(),
    /** Where the story lives; the headline links there when given. */
    url: z.string().optional(),
  })
  .meta({ id: "Headline" });
export type Headline = z.infer<typeof Headline>;

export const MarketOverview = z
  .object({
    /** The featured ticker, with `series` covering the chosen chart range. */
    featured: Quote,
    portfolio: z.object({
      value: z.number().nonnegative(),
      /** Today's change in money. */
      change: z.number(),
      /** Largest first; shares are fractions that add up to 1. */
      allocation: z.array(z.object({ name: z.string(), share: z.number().min(0).max(1) })),
    }),
    /** Each with a 24-hour series. */
    watchlist: z.array(Quote),
    /** Newest first. */
    headlines: z.array(Headline),
  })
  .meta({ id: "MarketOverview" });
export type MarketOverview = z.infer<typeof MarketOverview>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getMarketOverview: {
    method: "GET",
    path: "/markets/overview",
    summary: "The featured ticker over a range, portfolio, watchlist and headlines",
    query: z.object({ symbol: z.string().optional(), range: ChartRange }),
    response: MarketOverview,
  },
});

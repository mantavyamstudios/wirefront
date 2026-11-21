// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** The period shown. */
export const Range = z.enum(["7d", "30d", "90d"]).meta({ id: "Range" });
export type Range = z.infer<typeof Range>;

export const DailyViews = z
  .object({
    date: z.iso.date(),
    views: z.number().int().nonnegative(),
    /** Still being counted (e.g. late-arriving events); drawn fainter. */
    partial: z.boolean().optional(),
  })
  .meta({ id: "DailyViews" });
export type DailyViews = z.infer<typeof DailyViews>;

export const TrafficSource = z.object({ id: z.string(), label: z.string(), views: z.number().int().nonnegative() }).meta({ id: "TrafficSource" });
export type TrafficSource = z.infer<typeof TrafficSource>;

export const TopPage = z
  .object({
    path: z.string(),
    views: z.number().int().nonnegative(),
    /** Change against the previous period, as a fraction (0.12 = +12%). */
    change: z.number(),
  })
  .meta({ id: "TopPage" });
export type TopPage = z.infer<typeof TopPage>;

export const CountryShare = z
  .object({
    /** ISO 3166-1 alpha-2, e.g. "US". The screen draws the flag and localises the name. */
    country: z.string().length(2),
    /** Share of all views, as a fraction (0.42 = 42%). */
    share: z.number().min(0).max(1),
  })
  .meta({ id: "CountryShare" });
export type CountryShare = z.infer<typeof CountryShare>;

export const PageviewStats = z
  .object({
    total: z.number().int().nonnegative(),
    /** Change against the previous period, as a fraction. */
    change: z.number(),
    /** One entry per day, oldest first. */
    daily: z.array(DailyViews),
    /** Largest first. */
    sources: z.array(TrafficSource),
    pages: z.array(TopPage),
    countries: z.array(CountryShare),
  })
  .meta({ id: "PageviewStats" });
export type PageviewStats = z.infer<typeof PageviewStats>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getPageviews: {
    method: "GET",
    path: "/analytics/pageviews",
    summary: "Pageviews, their trend, sources, top pages and countries for a period",
    query: z.object({ range: Range }),
    response: PageviewStats,
  },
  exportPageviews: {
    method: "GET",
    path: "/analytics/pageviews.csv",
    summary: "The same period as CSV; the screen hands the download to the browser",
    query: z.object({ range: Range }),
  },
});

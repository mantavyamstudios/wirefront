// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** The period the dashboard covers, compared with the period before it. */
export const Range = z.enum(["7d", "30d", "90d"]).meta({ id: "Range" });
export type Range = z.infer<typeof Range>;

export const Metric = z
  .object({
    id: z.string(),
    label: z.string(),
    /** The raw value; the screen formats it. Percentages are fractions (0.018 = 1.8%), durations are seconds. */
    value: z.number(),
    unit: z.enum(["count", "currency", "percent", "duration"]),
    /** Change against the previous period, as a fraction (0.082 = +8.2%). */
    change: z.number(),
    /** Which direction is good news: churn going down is good. */
    goodWhen: z.enum(["up", "down"]),
  })
  .meta({ id: "Metric" });
export type Metric = z.infer<typeof Metric>;

export const SeriesPoint = z.object({ date: z.iso.date(), value: z.number() }).meta({ id: "SeriesPoint" });
export type SeriesPoint = z.infer<typeof SeriesPoint>;

export const Activity = z
  .object({
    id: z.string(),
    actor: z.string(),
    /** What they did, e.g. "deployed". */
    action: z.string(),
    /** What they did it to, e.g. "main → production". */
    target: z.string(),
    at: z.iso.datetime(),
  })
  .meta({ id: "Activity" });
export type Activity = z.infer<typeof Activity>;

export const Overview = z
  .object({
    /** First and last day covered, ISO dates. */
    period: z.object({ start: z.iso.date(), end: z.iso.date() }),
    metrics: z.array(Metric),
    /** The chart: one metric over the period. */
    chart: z.object({ metricId: z.string(), points: z.array(SeriesPoint) }),
    /** Latest first. */
    activity: z.array(Activity),
  })
  .meta({ id: "Overview" });
export type Overview = z.infer<typeof Overview>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getOverview: {
    method: "GET",
    path: "/overview",
    summary: "Key metrics, a trend and recent activity for a period",
    query: z.object({ range: Range }),
    response: Overview,
  },
});

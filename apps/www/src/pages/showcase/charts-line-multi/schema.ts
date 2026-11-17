// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const SeriesPoint = z
  .object({
    /** The day, as YYYY-MM-DD. */
    date: z.string(),
    values: z.record(z.string(), z.number()),
  })
  .meta({ id: "SeriesPoint" });
export type SeriesPoint = z.infer<typeof SeriesPoint>;

export const SeriesOverTime = z
  .object({
    series: z.array(z.object({ id: z.string(), label: z.string() })),
    /** Oldest first. */
    points: z.array(SeriesPoint),
  })
  .meta({ id: "SeriesOverTime" });
export type SeriesOverTime = z.infer<typeof SeriesOverTime>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getDailyActiveUsers: {
    method: "GET",
    path: "/reports/daily-active-users",
    summary: "Daily active users per platform over a range",
    query: z.object({ range: z.string() }),
    response: SeriesOverTime,
  },
});

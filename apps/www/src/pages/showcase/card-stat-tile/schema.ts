// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Kpi = z
  .object({
    id: z.string(),
    label: z.string(),
    value: z.number(),
    /** How to show `value`: money (in `currency`), a plain number, or a percentage (value 1.8 means 1.8%). */
    kind: z.enum(["money", "number", "percent"]),
    currency: z.string().length(3).optional(),
    /** Change against the previous period, in percent. */
    deltaPct: z.number(),
    /** Recent values, oldest first, for the sparkline. */
    series: z.array(z.number()).min(2),
    /** False for metrics where down is good (churn, latency). Defaults to true. */
    higherIsBetter: z.boolean().optional(),
  })
  .meta({ id: "Kpi" });
export type Kpi = z.infer<typeof Kpi>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listKpis: { method: "GET", path: "/metrics/overview", summary: "The overview metrics for the period", query: z.object({ period: z.string().optional() }), response: z.array(Kpi) },
});

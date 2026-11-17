// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** One month of revenue by stream, in the provider's currency. */
export const RevenueMonth = z
  .object({
    /** The month, as YYYY-MM. */
    month: z.string(),
    subscriptions: z.number(),
    addons: z.number(),
    services: z.number(),
  })
  .meta({ id: "RevenueMonth" });
export type RevenueMonth = z.infer<typeof RevenueMonth>;

export const RevenueBreakdown = z
  .object({
    /** Oldest first. */
    months: z.array(RevenueMonth),
    /** The total for the period before, to show the change. */
    previousTotal: z.number().optional(),
  })
  .meta({ id: "RevenueBreakdown" });
export type RevenueBreakdown = z.infer<typeof RevenueBreakdown>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getRevenueBreakdown: { method: "GET", path: "/reports/revenue-breakdown", summary: "Monthly revenue by stream for the last 12 months", response: RevenueBreakdown },
});

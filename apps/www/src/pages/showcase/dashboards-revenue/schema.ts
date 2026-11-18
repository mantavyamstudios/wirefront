// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** How many months the trend covers. */
export const RevenueRange = z.enum(["3m", "12m", "24m"]).meta({ id: "RevenueRange" });
export type RevenueRange = z.infer<typeof RevenueRange>;

/** Money is in major units of the provider's currency (e.g. dollars), not cents. */
export const MonthlyMrr = z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), mrr: z.number().nonnegative() }).meta({ id: "MonthlyMrr" });
export type MonthlyMrr = z.infer<typeof MonthlyMrr>;

export const PlanRevenue = z.object({ id: z.string(), name: z.string(), mrr: z.number().nonnegative(), accounts: z.number().int().nonnegative() }).meta({ id: "PlanRevenue" });
export type PlanRevenue = z.infer<typeof PlanRevenue>;

export const TopAccount = z
  .object({
    id: z.string(),
    name: z.string(),
    plan: z.string(),
    mrr: z.number().nonnegative(),
    /** Change against last month, as a fraction (0.06 = +6%). */
    change: z.number(),
  })
  .meta({ id: "TopAccount" });
export type TopAccount = z.infer<typeof TopAccount>;

export const RevenueSummary = z
  .object({
    /** One point per month, oldest first; the last one is the current month. */
    trend: z.array(MonthlyMrr),
    payingAccounts: z.number().int().nonnegative(),
    /** This month's MRR movements, all as positive amounts. */
    movements: z.object({ new: z.number(), expansion: z.number(), contraction: z.number(), churn: z.number() }),
    /** Net revenue retention as a fraction (1.12 = 112%) and its change in points (0.021 = +2.1 pts). */
    netRetention: z.object({ value: z.number(), change: z.number() }),
    /** Largest first. */
    plans: z.array(PlanRevenue),
    topAccounts: z.array(TopAccount),
  })
  .meta({ id: "RevenueSummary" });
export type RevenueSummary = z.infer<typeof RevenueSummary>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getRevenue: {
    method: "GET",
    path: "/revenue",
    summary: "MRR trend, this month's movements, retention, plans and top accounts",
    query: z.object({ range: RevenueRange }),
    response: RevenueSummary,
  },
  exportRevenue: {
    method: "GET",
    path: "/revenue.csv",
    summary: "The same range as CSV; the screen hands the download to the browser",
    query: z.object({ range: RevenueRange }),
  },
});

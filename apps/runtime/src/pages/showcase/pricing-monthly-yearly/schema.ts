// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const BillingPlan = z
  .object({
    id: z.string(),
    name: z.string(),
    /** Per seat per month on each billing period, in `currency` major units. 0 is free. */
    monthly: z.number().min(0),
    yearly: z.number().min(0),
    currency: z.string().length(3),
    blurb: z.string(),
    features: z.array(z.string()),
    recommended: z.boolean().optional(),
  })
  .meta({ id: "BillingPlan" });
export type BillingPlan = z.infer<typeof BillingPlan>;

export const BillingPeriod = z.enum(["monthly", "yearly"]).meta({ id: "BillingPeriod" });
export type BillingPeriod = z.infer<typeof BillingPeriod>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listBillingPlans: { method: "GET", path: "/plans", summary: "Plans with monthly and yearly prices", response: z.array(BillingPlan) },
});

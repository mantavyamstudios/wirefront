// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Plan = z
  .object({
    id: z.string(),
    name: z.string(),
    /** Null for "Custom" (priced by sales). In the currency's major unit. */
    price: z.object({ amount: z.number().min(0), currency: z.string().length(3) }).nullable(),
    /** "forever" for free plans. */
    interval: z.enum(["month", "year", "forever"]),
    perSeat: z.boolean(),
    blurb: z.string(),
    features: z.array(z.string()),
    /** The button's label, e.g. "Start free trial". */
    cta: z.string(),
    /** Highlight this plan (shown first on narrow screens). */
    featured: z.boolean(),
    badge: z.string().optional(),
  })
  .meta({ id: "Plan" });
export type Plan = z.infer<typeof Plan>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listPlans: { method: "GET", path: "/plans", summary: "Plans to show on the pricing page", response: z.array(Plan) },
  choosePlan: {
    method: "POST",
    path: "/billing/checkout",
    summary: "Start checkout (or a sales conversation) for a plan; typically answers with a URL to redirect to",
    body: z.object({ planId: z.string() }),
    response: z.object({ url: z.url() }),
  },
});

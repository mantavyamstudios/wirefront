// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const PlanTier = z
  .object({
    id: z.string(),
    name: z.string(),
    blurb: z.string(),
    /** In `currency` major units; null for "Custom" (talk to sales). */
    price: z.number().min(0).nullable(),
    currency: z.string().length(3),
    /** What the price covers. */
    billing: z.enum([
      "forever",
      "seat-month",
      "month",
      "year",
      "annual-contract",
    ]),
    features: z.array(z.string()),
    /** Called out as the most popular plan. */
    featured: z.boolean().optional(),
    /** The button: start a trial, or contact sales. */
    action: z.enum(["trial", "sales"]),
  })
  .meta({ id: "PlanTier" });
export type PlanTier = z.infer<typeof PlanTier>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listPlanTiers: {
    method: "GET",
    path: "/plans",
    summary: "The plans to show on the pricing page",
    response: z.array(PlanTier),
  },
});

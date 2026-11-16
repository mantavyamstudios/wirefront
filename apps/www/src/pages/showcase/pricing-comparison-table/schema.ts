// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ComparedPlan = z
  .object({
    id: z.string(),
    name: z.string(),
    /** In `currency` major units; null for "Custom". */
    price: z.number().min(0).nullable(),
    currency: z.string().length(3),
    billing: z.enum(["month", "seat-month", "annual-contract"]),
    /** The button: start free, choose, or talk to sales. */
    action: z.enum(["start", "choose", "sales"]),
    featured: z.boolean().optional(),
  })
  .meta({ id: "ComparedPlan" });
export type ComparedPlan = z.infer<typeof ComparedPlan>;

/** One feature row; values are keyed by plan id: text, or true/false for included/not. */
export const ComparisonRow = z
  .object({ label: z.string(), values: z.record(z.string(), z.union([z.string(), z.boolean()])) })
  .meta({ id: "ComparisonRow" });
export type ComparisonRow = z.infer<typeof ComparisonRow>;

export const ComparisonSection = z.object({ title: z.string(), rows: z.array(ComparisonRow) }).meta({ id: "ComparisonSection" });
export type ComparisonSection = z.infer<typeof ComparisonSection>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getComparison: {
    method: "GET",
    path: "/plans/comparison",
    summary: "Plans and the features to compare them on",
    response: z.object({ plans: z.array(ComparedPlan), sections: z.array(ComparisonSection) }),
  },
});

// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const SinglePlan = z
  .object({
    name: z.string(),
    /** Per user per month, in `currency` major units. */
    price: z.number().min(0),
    currency: z.string().length(3),
    features: z.array(z.string()),
    trialDays: z.int().min(0),
  })
  .meta({ id: "SinglePlan" });
export type SinglePlan = z.infer<typeof SinglePlan>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getPlan: {
    method: "GET",
    path: "/plan",
    summary: "The one plan and its price",
    response: SinglePlan,
  },
});

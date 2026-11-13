// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const UsageLimit = z
  .object({
    id: z.string(),
    label: z.string(),
    used: z.number().min(0),
    limit: z.number().positive(),
    /** "gigabytes" shows "GB"; "per-month" shows "/ month". */
    unit: z.enum(["count", "gigabytes", "per-month"]),
  })
  .meta({ id: "UsageLimit" });
export type UsageLimit = z.infer<typeof UsageLimit>;

export const Usage = z
  .object({
    plan: z.object({ name: z.string(), interval: z.enum(["month", "year"]) }),
    /** What the workspace pays per month, in the currency's major unit. */
    monthlyPrice: z.object({ amount: z.number().min(0), currency: z.string().length(3) }),
    /** The current billing cycle, ISO dates. Limits reset at the end. */
    cycle: z.object({ start: z.iso.date(), end: z.iso.date() }),
    card: z.object({ brand: z.string(), last4: z.string().length(4) }).nullable(),
    limits: z.array(UsageLimit),
  })
  .meta({ id: "Usage" });
export type Usage = z.infer<typeof Usage>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getUsage: { method: "GET", path: "/billing/usage", summary: "The plan, billing cycle and usage against each limit", response: Usage },
});

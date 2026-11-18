// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const AccountHealth = z
  .object({
    id: z.string(),
    name: z.string(),
    /** Satisfaction score, 1–10 (e.g. an NPS proxy). */
    satisfaction: z.number().min(1).max(10),
    /** Retention, 0–100 percent. */
    retention: z.number().min(0).max(100),
    /** Monthly recurring revenue; sets the bubble size. */
    mrr: z.number().nonnegative(),
    /** Label this account on the chart. */
    highlight: z.boolean().optional(),
  })
  .meta({ id: "AccountHealth" });
export type AccountHealth = z.infer<typeof AccountHealth>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listAccountHealth: { method: "GET", path: "/reports/account-health", summary: "Satisfaction, retention and MRR for the top accounts", response: z.array(AccountHealth) },
});

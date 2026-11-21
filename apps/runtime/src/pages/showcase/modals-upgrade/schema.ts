// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const UpgradePlan = z
  .object({
    id: z.string(),
    name: z.string(),
    /** Per member per month, in `currency` major units. */
    price: z.number().min(0),
    currency: z.string().length(3),
    features: z.array(z.string()),
    recommended: z.boolean().optional(),
  })
  .meta({ id: "UpgradePlan" });
export type UpgradePlan = z.infer<typeof UpgradePlan>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listUpgradePlans: { method: "GET", path: "/billing/upgrade-plans", summary: "Plans the workspace can upgrade to", response: z.array(UpgradePlan) },
  startUpgrade: {
    method: "POST",
    path: "/billing/upgrade",
    summary: "Start an upgrade; returns where to send the user (e.g. a checkout page)",
    body: z.object({ planId: z.string() }),
    response: z.object({ redirectUrl: z.url() }),
  },
});

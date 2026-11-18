// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const MixSlice = z.object({ id: z.string(), name: z.string(), amount: z.number().nonnegative() }).meta({ id: "MixSlice" });
export type MixSlice = z.infer<typeof MixSlice>;

export const RevenueMix = z
  .object({
    /** Largest first reads best; the order is kept. Amounts are in the provider's currency. */
    slices: z.array(MixSlice),
    /** The total for the period before, to show the change. */
    previousTotal: z.number().optional(),
  })
  .meta({ id: "RevenueMix" });
export type RevenueMix = z.infer<typeof RevenueMix>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getRevenueMix: { method: "GET", path: "/reports/revenue-mix", summary: "Revenue by source for the quarter", response: RevenueMix },
});

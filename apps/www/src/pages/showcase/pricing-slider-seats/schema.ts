// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const SeatPlan = z
  .object({
    name: z.string(),
    /** Per seat per month on monthly billing, in `currency` major units. */
    perSeat: z.number().min(0),
    currency: z.string().length(3),
    /** Percent off when billed yearly. */
    annualDiscountPct: z.number().min(0).max(100),
    minSeats: z.int().min(1),
    /** The slider's top; the top value reads "{max}+". */
    maxSeats: z.int().min(2),
    features: z.array(z.string()),
    trialDays: z.int().min(0),
  })
  .meta({ id: "SeatPlan" });
export type SeatPlan = z.infer<typeof SeatPlan>;

export const SeatSelection = z.object({ seats: z.int().min(1), billing: z.enum(["monthly", "yearly"]) }).meta({ id: "SeatSelection" });
export type SeatSelection = z.infer<typeof SeatSelection>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getSeatPlan: { method: "GET", path: "/plans/seats", summary: "The per-seat plan and its limits", response: SeatPlan },
});

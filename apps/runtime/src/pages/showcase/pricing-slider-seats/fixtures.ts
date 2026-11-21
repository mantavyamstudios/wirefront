// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { SeatPlan } from "./schema";

/** What the mocks return for `getSeatPlan`. Demo data for the showcase and tests. */
export const getSeatPlan: SeatPlan = {
  name: "Pro",
  perSeat: 24,
  currency: "USD",
  annualDiscountPct: 20,
  minSeats: 1,
  maxSeats: 50,
  trialDays: 14,
  features: ["Unlimited projects", "1M API requests / mo", "30-day audit log", "SSO via Google", "Priority email support", "Custom roles"],
};

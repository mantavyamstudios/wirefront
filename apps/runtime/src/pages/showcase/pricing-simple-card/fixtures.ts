// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { SinglePlan } from "./schema";

/** What the mocks return for `getPlan`. Demo data for the showcase and tests. */
export const getPlan: SinglePlan = {
  name: "Pro",
  price: 19,
  currency: "USD",
  trialDays: 14,
  features: ["Unlimited projects", "Unlimited team members", "All integrations", "Audit log", "Priority support", "Cancel any time"],
};

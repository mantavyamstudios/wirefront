// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { UpgradePlan } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const listUpgradePlans: UpgradePlan[] = [
  { id: "pro", name: "Pro", price: 24, currency: "USD", features: ["10 projects", "Up to 10 members", "30-day audit log", "Email support"] },
  {
    id: "business",
    name: "Business",
    price: 79,
    currency: "USD",
    recommended: true,
    features: ["Unlimited projects", "Unlimited members", "1-year audit log", "SSO & SCIM", "Priority support", "Custom retention"],
  },
];

export const limit = { used: 10, limit: 10, resource: "projects" };

/** What the mocks return for `startUpgrade`. */
export const startUpgrade = { redirectUrl: "https://example.com/checkout/session_1" };

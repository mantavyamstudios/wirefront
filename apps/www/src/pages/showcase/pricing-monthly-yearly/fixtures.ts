// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { BillingPlan } from "./schema";

/** What the mocks return for `listBillingPlans`. Demo data for the showcase and tests. */
export const listBillingPlans: BillingPlan[] = [
  { id: "starter", name: "Starter", monthly: 0, yearly: 0, currency: "USD", blurb: "For solo work.", features: ["3 projects", "5 collaborators", "Community support"] },
  {
    id: "pro",
    name: "Pro",
    monthly: 24,
    yearly: 19,
    currency: "USD",
    blurb: "For growing teams.",
    recommended: true,
    features: ["Unlimited projects", "1M API requests", "30-day audit log", "Priority support"],
  },
  {
    id: "team",
    name: "Team",
    monthly: 48,
    yearly: 39,
    currency: "USD",
    blurb: "For larger orgs.",
    features: ["Everything in Pro", "10M API requests", "1-year audit log", "Custom roles", "SSO + SCIM"],
  },
];

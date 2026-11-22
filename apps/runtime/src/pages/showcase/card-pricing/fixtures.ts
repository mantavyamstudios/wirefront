// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { PlanTier } from "./schema";

/** What the mocks return for `listPlanTiers`. Demo data for the showcase and tests. */
export const listPlanTiers: PlanTier[] = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Everything you need to try us out.",
    price: 0,
    currency: "USD",
    billing: "forever",
    action: "trial",
    features: [
      "Up to 3 projects",
      "Single user",
      "Community support",
      "1 GB storage",
    ],
  },
  {
    id: "team",
    name: "Team",
    blurb: "For growing teams that need more.",
    price: 24,
    currency: "USD",
    billing: "seat-month",
    action: "trial",
    featured: true,
    features: [
      "Unlimited projects",
      "Up to 25 seats",
      "Priority support",
      "100 GB storage",
      "SSO & audit logs",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "For larger orgs with custom needs.",
    price: null,
    currency: "USD",
    billing: "annual-contract",
    action: "sales",
    features: [
      "Custom seat count",
      "Dedicated CSM",
      "99.99% SLA",
      "Custom data residency",
      "Procurement-ready DPA",
    ],
  },
];

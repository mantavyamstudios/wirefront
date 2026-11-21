// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Plan } from "./schema";

/** What the mocks return for `listPlans`. */
export const listPlans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: { amount: 0, currency: "USD" },
    interval: "forever",
    perSeat: false,
    blurb: "For solo work and weekend tinkering.",
    features: ["1 workspace", "3 projects", "Up to 5 collaborators", "Community support"],
    cta: "Get started",
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: { amount: 24, currency: "USD" },
    interval: "month",
    perSeat: true,
    blurb: "For teams that need real headroom.",
    features: ["Unlimited projects", "1M API requests", "30-day audit log", "Priority email support", "SSO via Google"],
    cta: "Start free trial",
    featured: true,
    badge: "Most popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    interval: "year",
    perSeat: false,
    blurb: "For organisations with compliance needs.",
    features: ["Everything in Pro", "Unlimited audit log", "SAML SSO + SCIM", "Custom roles & DPA", "Dedicated success manager"],
    cta: "Talk to sales",
    featured: false,
  },
];

/** What the mocks return for `choosePlan`. */
export const choosePlan = { url: "https://checkout.example.com/session/demo" };

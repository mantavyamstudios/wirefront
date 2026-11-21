// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ComparedPlan, ComparisonSection } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const plans: ComparedPlan[] = [
  { id: "starter", name: "Starter", price: 0, currency: "USD", billing: "month", action: "start" },
  { id: "pro", name: "Pro", price: 24, currency: "USD", billing: "seat-month", action: "choose", featured: true },
  { id: "team", name: "Team", price: 48, currency: "USD", billing: "seat-month", action: "choose" },
  { id: "enterprise", name: "Enterprise", price: null, currency: "USD", billing: "annual-contract", action: "sales" },
];

const row = (label: string, starter: string | boolean, pro: string | boolean, team: string | boolean, enterprise: string | boolean) => ({
  label,
  values: { starter, pro, team, enterprise },
});

export const sections: ComparisonSection[] = [
  {
    title: "Workspace",
    rows: [
      row("Projects", "3", "Unlimited", "Unlimited", "Unlimited"),
      row("Members", "5", "25", "100", "Unlimited"),
      row("API requests / mo", "10k", "1M", "10M", "Custom"),
      row("Storage", "1 GB", "100 GB", "1 TB", "Custom"),
    ],
  },
  {
    title: "Security",
    rows: [
      row("SSO via Google", false, true, true, true),
      row("SAML SSO", false, false, true, true),
      row("SCIM provisioning", false, false, false, true),
      row("Custom roles", false, false, true, true),
      row("Audit log retention", "7 days", "30 days", "1 year", "Forever"),
    ],
  },
  {
    title: "Support",
    rows: [
      row("Community", true, true, true, true),
      row("Email", false, true, true, true),
      row("Priority email + chat", false, false, true, true),
      row("Dedicated success manager", false, false, false, true),
    ],
  },
];

/** What the mocks return for `getComparison`. */
export const getComparison = { plans, sections };

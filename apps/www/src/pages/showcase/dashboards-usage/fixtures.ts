// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Usage } from "./schema";

/** The demo's "now", 12 days into the cycle. */
export const now = "2026-04-26T12:00:00.000Z";

/** What the mocks return for `getUsage`. */
export const getUsage: Usage = {
  plan: { name: "Pro", interval: "year" },
  monthlyPrice: { amount: 240, currency: "USD" },
  cycle: { start: "2026-04-14", end: "2026-05-14" },
  card: { brand: "Visa", last4: "4242" },
  limits: [
    { id: "seats", label: "Seats", used: 18, limit: 25, unit: "count" },
    { id: "projects", label: "Projects", used: 47, limit: 50, unit: "count" },
    { id: "requests", label: "API requests", used: 612_000, limit: 1_000_000, unit: "per-month" },
    { id: "storage", label: "Storage", used: 84, limit: 200, unit: "gigabytes" },
    { id: "webhooks", label: "Webhooks", used: 6, limit: 20, unit: "count" },
  ],
};

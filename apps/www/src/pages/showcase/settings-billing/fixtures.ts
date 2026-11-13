// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Billing } from "./schema";

const month = (n: number) => `2026-${String(n).padStart(2, "0")}-14`;

/** What the mocks return for `getBilling`. */
export const getBilling: Billing = {
  plan: { name: "Pro", interval: "year", summary: "25 seats · unlimited projects · 1M API requests", status: "active", periodEnd: "2026-05-14" },
  monthlyPrice: { amount: 240, currency: "USD" },
  paymentMethod: { brand: "Visa", last4: "4242", expMonth: 9, expYear: 2027, email: "billing@acme.com" },
  credits: { amount: 48.2, currency: "USD" },
  taxId: { type: "EU VAT", value: "ATU 88374521" },
  invoices: [4, 3, 2, 1].map((m) => ({
    id: `in_2026_${m}`,
    number: `INV-2026-0${m}`,
    issuedAt: month(m),
    total: { amount: 240, currency: "USD" },
    status: "paid" as const,
    url: `https://invoice.example.com/INV-2026-0${m}`,
  })),
};

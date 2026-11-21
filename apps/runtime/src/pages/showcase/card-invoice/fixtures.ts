// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { InvoiceSummary } from "./schema";

/** The demo's clock. */
export const now = "2026-04-26T12:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const invoices: InvoiceSummary[] = [
  { id: "inv_2871", number: "INV-2871", customer: "Foundry Labs", amount: 4800, currency: "USD", status: "open", dueAt: "2026-04-30" },
  { id: "inv_2870", number: "INV-2870", customer: "Northwind Co.", amount: 1250, currency: "USD", status: "paid", dueAt: "2026-04-25", settledAt: "2026-04-22" },
  { id: "inv_2869", number: "INV-2869", customer: "Halcyon Ventures", amount: 9900, currency: "USD", status: "overdue", dueAt: "2026-04-15" },
  { id: "inv_2868", number: "INV-2868", customer: "Atlas Studio", amount: 320, currency: "USD", status: "void", dueAt: "2026-04-20", settledAt: "2026-04-19" },
];

/** What the mocks return for `listRecentInvoices`. */
export const listRecentInvoices = { items: invoices, total: 142 };

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Invoice, InvoicesPage } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const invoices: Invoice[] = [
  { id: "in_2871", number: "INV-2871", customer: "Foundry Labs", email: "ar@foundrylabs.io", issuedAt: "2026-04-18", dueAt: "2026-04-30", status: "open", amount: 4800, currency: "USD" },
  { id: "in_2870", number: "INV-2870", customer: "Northwind Co.", email: "billing@northwind.co", issuedAt: "2026-04-12", dueAt: "2026-04-22", status: "paid", amount: 1250, currency: "USD" },
  { id: "in_2869", number: "INV-2869", customer: "Halcyon Ventures", email: "ops@halcyon.vc", issuedAt: "2026-03-28", dueAt: "2026-04-11", status: "overdue", amount: 9900, currency: "USD" },
  { id: "in_2868", number: "INV-2868", customer: "Atlas Studio", email: "hi@atlasstudio.co", issuedAt: "2026-03-22", dueAt: null, status: "void", amount: 320, currency: "USD" },
  { id: "in_2867", number: "INV-2867", customer: "Brightline Inc.", email: "ap@brightline.io", issuedAt: "2026-03-18", dueAt: "2026-04-02", status: "paid", amount: 6420, currency: "USD" },
  { id: "in_2866", number: "INV-2866", customer: "Quayside Partners", email: "team@quayside.co", issuedAt: "2026-03-14", dueAt: "2026-04-14", status: "open", amount: 12_780, currency: "USD" },
  { id: "in_2865", number: "INV-2865", customer: "Granite & Co.", email: "books@granite.co", issuedAt: "2026-03-10", dueAt: "2026-03-24", status: "paid", amount: 980, currency: "USD" },
];

/** Unpaid, non-void invoices only. */
export function outstandingOf(list: Invoice[]) {
  return list.filter((i) => i.status === "open" || i.status === "overdue").reduce((sum, i) => sum + i.amount, 0);
}

/** What the mocks return for `listInvoices`. */
export const listInvoices: InvoicesPage = {
  items: invoices,
  total: invoices.length,
  outstanding: { amount: outstandingOf(invoices), currency: "USD" },
};

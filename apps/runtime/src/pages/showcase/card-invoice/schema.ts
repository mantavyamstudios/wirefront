// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const InvoiceCardStatus = z.enum(["paid", "open", "overdue", "void"]).meta({ id: "InvoiceCardStatus" });
export type InvoiceCardStatus = z.infer<typeof InvoiceCardStatus>;

export const InvoiceSummary = z
  .object({
    id: z.string(),
    number: z.string(),
    customer: z.string(),
    /** In `currency` major units. */
    amount: z.number(),
    currency: z.string().length(3),
    status: InvoiceCardStatus,
    dueAt: z.iso.date(),
    /** When it was paid or voided. */
    settledAt: z.iso.date().optional(),
  })
  .meta({ id: "InvoiceSummary" });
export type InvoiceSummary = z.infer<typeof InvoiceSummary>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listRecentInvoices: {
    method: "GET",
    path: "/invoices/recent",
    summary: "The most recent invoices, with how many there are in all",
    query: z.object({ limit: z.int().min(1).max(20).optional() }),
    response: z.object({ items: z.array(InvoiceSummary), total: z.int().min(0) }),
  },
  exportInvoices: { method: "POST", path: "/invoices/export", summary: "Export all invoices as CSV" },
});

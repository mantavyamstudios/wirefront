// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const InvoiceStatus = z.enum(["paid", "open", "overdue", "void"]).meta({ id: "InvoiceStatus" });
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;

export const Invoice = z
  .object({
    id: z.string(),
    /** The number customers see, e.g. "INV-2871". */
    number: z.string(),
    customer: z.string(),
    email: z.email(),
    issuedAt: z.iso.date(),
    /** Null for invoices with no due date (e.g. voided before sending). */
    dueAt: z.iso.date().nullable(),
    status: InvoiceStatus,
    /** In the currency's major unit (dollars, not cents). */
    amount: z.number(),
    /** ISO 4217, e.g. "USD". */
    currency: z.string().length(3),
  })
  .meta({ id: "Invoice" });
export type Invoice = z.infer<typeof Invoice>;

export const InvoicesQuery = z
  .object({
    page: z.int().min(1),
    pageSize: z.int().min(1).max(100),
    search: z.string().optional(),
    sort: z.enum(["issuedAt", "dueAt", "amount"]).optional(),
    direction: z.enum(["asc", "desc"]).optional(),
    status: InvoiceStatus.optional(),
  })
  .meta({ id: "InvoicesQuery" });

export const InvoicesPage = z
  .object({
    items: z.array(Invoice),
    total: z.int().min(0),
    /** Unpaid, non-void amount across every matching invoice, not just this page. */
    outstanding: z.object({ amount: z.number(), currency: z.string().length(3) }),
  })
  .meta({ id: "InvoicesPage" });
export type InvoicesPage = z.infer<typeof InvoicesPage>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listInvoices: {
    method: "GET",
    path: "/invoices",
    summary: "List invoices, filtered, sorted and paginated, with the outstanding total",
    query: InvoicesQuery,
    response: InvoicesPage,
  },
  exportInvoices: {
    method: "POST",
    path: "/invoices/export",
    summary: "Start a CSV export of the invoices matching the query; the file is emailed or downloaded",
    body: InvoicesQuery,
  },
});

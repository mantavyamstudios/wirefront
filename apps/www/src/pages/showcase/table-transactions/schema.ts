// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const TransactionStatus = z.enum(["succeeded", "pending", "refunded", "failed"]).meta({ id: "TransactionStatus" });
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const PaymentMethod = z.enum(["card", "ach", "wire", "wallet"]).meta({ id: "PaymentMethod" });
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const Transaction = z
  .object({
    id: z.string(),
    occurredAt: z.iso.datetime(),
    description: z.string(),
    counterparty: z.string(),
    /** Always positive, in `currency` major units; `direction` gives the sign. */
    amount: z.number().min(0),
    currency: z.string().length(3),
    direction: z.enum(["in", "out"]),
    method: PaymentMethod,
    status: TransactionStatus,
    fee: z.number().min(0).nullable(),
  })
  .meta({ id: "Transaction" });
export type Transaction = z.infer<typeof Transaction>;

export const TransactionAccount = z.object({ id: z.string(), label: z.string() }).meta({ id: "TransactionAccount" });
export type TransactionAccount = z.infer<typeof TransactionAccount>;

export const TransactionFilters = z
  .object({
    account: z.string().optional(),
    direction: z.enum(["in", "out"]).optional(),
    /** Only the last this-many days. */
    withinDays: z.int().min(1).optional(),
  })
  .meta({ id: "TransactionFilters" });
export type TransactionFilters = z.infer<typeof TransactionFilters>;

/** The list query as query-string parameters. */
export const TransactionsQuery = z
  .object({ page: z.int().min(1), pageSize: z.int().min(1).max(100), search: z.string().optional() })
  .extend(TransactionFilters.shape)
  .meta({ id: "TransactionsQuery" });
export type TransactionsQuery = z.infer<typeof TransactionsQuery>;

/** Settled money in and out across every match, not just this page. */
export const TransactionSummary = z
  .object({ inflow: z.number().min(0), outflow: z.number().min(0), currency: z.string().length(3) })
  .meta({ id: "TransactionSummary" });
export type TransactionSummary = z.infer<typeof TransactionSummary>;

export const TransactionsPage = z
  .object({ items: z.array(Transaction), total: z.int().min(0), summary: TransactionSummary })
  .meta({ id: "TransactionsPage" });
export type TransactionsPage = z.infer<typeof TransactionsPage>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listTransactions: {
    method: "GET",
    path: "/transactions",
    summary: "List transactions, searched, filtered and paginated, with inflow and outflow totals",
    query: TransactionsQuery,
    response: TransactionsPage,
  },
  listAccounts: { method: "GET", path: "/accounts", summary: "The accounts to filter by", response: z.array(TransactionAccount) },
  exportTransactions: { method: "POST", path: "/transactions/export", summary: "Export the matching transactions as CSV", body: TransactionsQuery },
});

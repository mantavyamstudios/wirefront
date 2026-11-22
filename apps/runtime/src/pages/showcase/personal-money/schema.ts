// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const MoneyCategory = z.enum([
  "groceries",
  "dining",
  "transport",
  "shopping",
  "home",
  "fun",
  "income",
]);
export type MoneyCategory = z.infer<typeof MoneyCategory>;

export const MoneyAccount = z
  .object({
    id: z.string(),
    name: z.string(),
    kind: z.enum(["checking", "savings", "credit"]),
    /** Last four digits. */
    mask: z.string(),
    /** Current balance in the provider currency; negative for money owed. */
    balance: z.number(),
    /** Daily closing balances, oldest first, ending today. Drawn as the balance chart. */
    history: z.array(z.number()).optional(),
  })
  .meta({ id: "MoneyAccount" });
export type MoneyAccount = z.infer<typeof MoneyAccount>;

export const MoneyTransaction = z
  .object({
    id: z.string(),
    merchant: z.string(),
    category: MoneyCategory,
    /** Negative for spending. */ amount: z.number(),
    accountId: z.string(),
    /** ISO timestamp. */ postedAt: z.string(),
  })
  .meta({ id: "MoneyTransaction" });
export type MoneyTransaction = z.infer<typeof MoneyTransaction>;

export const MoneyBill = z
  .object({
    id: z.string(),
    name: z.string(),
    amount: z.number(),
    /** Calendar date, YYYY-MM-DD. */ due: z.string(),
    category: MoneyCategory,
    autopay: z.boolean().optional(),
    paid: z.boolean().optional(),
  })
  .meta({ id: "MoneyBill" });
export type MoneyBill = z.infer<typeof MoneyBill>;

export const MoneyBudget = z
  .object({ category: MoneyCategory, /** Monthly limit. */ limit: z.number() })
  .meta({ id: "MoneyBudget" });
export type MoneyBudget = z.infer<typeof MoneyBudget>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listAccounts: {
    method: "GET",
    path: "/money/accounts",
    summary: "Accounts with balances and 30-day history",
    response: z.array(MoneyAccount),
  },
  listTransactions: {
    method: "GET",
    path: "/money/transactions",
    summary: "Recent transactions, newest first",
    response: z.array(MoneyTransaction),
  },
  listBills: {
    method: "GET",
    path: "/money/bills",
    summary: "Bills due in the next two weeks",
    response: z.array(MoneyBill),
  },
  listBudgets: {
    method: "GET",
    path: "/money/budgets",
    summary: "Monthly budgets by category",
    response: z.array(MoneyBudget),
  },
  payBill: {
    method: "POST",
    path: "/money/bills/{id}/pay",
    summary: "Pay a bill and return the payment",
    params: z.object({ id: z.string() }),
    response: MoneyTransaction,
  },
});

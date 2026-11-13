// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Transaction, TransactionAccount, TransactionsPage } from "./schema";
import type { TransactionsListQuery } from "./view";

/** The demo's clock. */
export const now = "2026-04-26T12:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const listAccounts: TransactionAccount[] = [
  { id: "op", label: "Operating" },
  { id: "reserve", label: "Reserve" },
];

export const transactions: (Transaction & { account: string })[] = [
  { id: "tx_8412c", account: "op", occurredAt: "2026-04-26T09:18:00Z", description: "Customer payment", counterparty: "Halcyon Ventures", amount: 9900, currency: "USD", direction: "in", method: "wire", status: "succeeded", fee: 9.9 },
  { id: "tx_8411a", account: "op", occurredAt: "2026-04-26T08:42:00Z", description: "Card processor payout", counterparty: "Processor → Operating ••2841", amount: 18240, currency: "USD", direction: "out", method: "ach", status: "pending", fee: null },
  { id: "tx_8410f", account: "op", occurredAt: "2026-04-25T22:01:00Z", description: "Subscription renewal", counterparty: "Foundry Labs", amount: 480, currency: "USD", direction: "in", method: "card", status: "succeeded", fee: 14.7 },
  { id: "tx_8409d", account: "op", occurredAt: "2026-04-25T16:55:00Z", description: "Cloud infrastructure", counterparty: "Nimbus Cloud", amount: 2120, currency: "USD", direction: "out", method: "card", status: "succeeded", fee: null },
  { id: "tx_8408b", account: "op", occurredAt: "2026-04-25T11:32:00Z", description: "Refund", counterparty: "Atlas Studio", amount: 320, currency: "USD", direction: "out", method: "card", status: "refunded", fee: null },
  { id: "tx_8407e", account: "op", occurredAt: "2026-04-24T18:09:00Z", description: "Customer payment", counterparty: "Northwind Co.", amount: 1250, currency: "USD", direction: "in", method: "card", status: "succeeded", fee: 38.5 },
  { id: "tx_8406c", account: "reserve", occurredAt: "2026-04-24T09:14:00Z", description: "Failed charge", counterparty: "Brightline Inc.", amount: 6420, currency: "USD", direction: "in", method: "card", status: "failed", fee: null },
  { id: "tx_8405a", account: "reserve", occurredAt: "2026-04-23T20:27:00Z", description: "Wallet top-up", counterparty: "Wallet Pay", amount: 1500, currency: "USD", direction: "in", method: "wallet", status: "succeeded", fee: 4.5 },
];

/** The query the demo opens with. */
export const defaultQuery: TransactionsListQuery = { page: 1, pageSize: 8, filters: { withinDays: 7 } };

/** What the mocks return for `listTransactions`. */
export const listTransactions: TransactionsPage = {
  items: transactions.map(({ account: _a, ...tx }) => tx),
  total: 412,
  summary: { inflow: 13130, outflow: 2120, currency: "USD" },
};

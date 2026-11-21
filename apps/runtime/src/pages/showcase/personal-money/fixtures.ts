// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { MoneyAccount, MoneyBill, MoneyBudget, MoneyTransaction } from "./schema";

/** The demo clock. */
export const now = "2026-10-24T19:30:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const productName = "Tally";
export const user = { name: "Ines Moreau", plan: "Personal plan" };

// A believable 30-day balance curve per account, seeded so it never changes between renders.
function noise(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
function history(id: string, kind: MoneyAccount["kind"], end: number, days = 30) {
  const seed = id.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const out = new Array<number>(days).fill(end);
  let v = end;
  for (let i = days - 2; i >= 0; i--) {
    const ago = days - 1 - i;
    let step: number;
    if (kind === "savings") step = (ago === 15 ? 1000 : ago === 1 ? 600 : 0) + 1 + noise(seed + i) * 2;
    else if (kind === "credit") step = -(noise(seed + i) * 70) + (ago === 18 ? -900 : 0);
    else {
      step = -(noise(seed + i) * 90 + 15);
      if (ago === 2 || ago === 16) step += 3240;
      if (ago === 23) step -= 1450;
      if (ago === 15) step -= 1000;
      if (ago === 1) step -= 600;
    }
    v -= step;
    out[i] = Math.round(v * 100) / 100;
  }
  return out;
}
const account = (id: string, name: string, kind: MoneyAccount["kind"], mask: string, balance: number): MoneyAccount => ({ id, name, kind, mask, balance, history: history(id, kind, balance) });

export const listAccounts: MoneyAccount[] = [account("everyday", "Everyday", "checking", "4021", 4218.4), account("savings", "Rainy day", "savings", "7730", 18650), account("credit", "Credit card", "credit", "0915", -1342.18)];

export const listTransactions: MoneyTransaction[] = [
  { id: "t1", merchant: "Ridely", category: "transport", amount: -14.2, accountId: "credit", postedAt: "2026-10-24T18:05:00Z" },
  { id: "t2", merchant: "Greenleaf Market", category: "groceries", amount: -64.18, accountId: "everyday", postedAt: "2026-10-24T12:40:00Z" },
  { id: "t3", merchant: "Nimbus Coffee", category: "dining", amount: -6.4, accountId: "everyday", postedAt: "2026-10-24T08:12:00Z" },
  { id: "t4", merchant: "Pho Saigon Kitchen", category: "dining", amount: -38.5, accountId: "credit", postedAt: "2026-10-23T19:48:00Z" },
  { id: "t5", merchant: "Atlas Books", category: "shopping", amount: -27.99, accountId: "everyday", postedAt: "2026-10-23T13:15:00Z" },
  { id: "t6", merchant: "Metro Transit", category: "transport", amount: -2.9, accountId: "everyday", postedAt: "2026-10-23T08:31:00Z" },
  { id: "t7", merchant: "Brightline Studio", category: "income", amount: 3240, accountId: "everyday", postedAt: "2026-10-22T09:00:00Z" },
  { id: "t8", merchant: "Fieldstone Grocers", category: "groceries", amount: -41.72, accountId: "everyday", postedAt: "2026-10-22T17:52:00Z" },
  { id: "t9", merchant: "Cinema Lumière", category: "fun", amount: -26, accountId: "credit", postedAt: "2026-10-22T20:20:00Z" },
  { id: "t10", merchant: "Marlowe's Diner", category: "dining", amount: -41.3, accountId: "everyday", postedAt: "2026-10-21T12:30:00Z" },
  { id: "t11", merchant: "Harbor Hardware", category: "home", amount: -48.35, accountId: "everyday", postedAt: "2026-10-20T11:04:00Z" },
  { id: "t12", merchant: "Sunday Supper Club", category: "dining", amount: -92, accountId: "credit", postedAt: "2026-10-19T20:45:00Z" },
  { id: "t13", merchant: "Nimbus Coffee", category: "dining", amount: -5.8, accountId: "everyday", postedAt: "2026-10-19T09:10:00Z" },
  { id: "t14", merchant: "Greenleaf Market", category: "groceries", amount: -88.04, accountId: "everyday", postedAt: "2026-10-18T10:22:00Z" },
  { id: "t15", merchant: "Spinwell Cycles", category: "transport", amount: -34, accountId: "everyday", postedAt: "2026-10-18T15:40:00Z" },
  { id: "t16", merchant: "Pinball Parlour", category: "fun", amount: -18, accountId: "everyday", postedAt: "2026-10-18T21:15:00Z" },
  { id: "t17", merchant: "Greenleaf Market", category: "groceries", amount: -72.3, accountId: "everyday", postedAt: "2026-10-15T18:02:00Z" },
  { id: "t18", merchant: "Tidewater Ramen", category: "dining", amount: -44.1, accountId: "credit", postedAt: "2026-10-15T19:30:00Z" },
  { id: "t19", merchant: "Fieldstone Grocers", category: "groceries", amount: -59.66, accountId: "everyday", postedAt: "2026-10-12T11:48:00Z" },
  { id: "t20", merchant: "Corner Bakehouse", category: "dining", amount: -12.75, accountId: "everyday", postedAt: "2026-10-12T08:55:00Z" },
  { id: "t21", merchant: "Kiln & Co.", category: "shopping", amount: -64, accountId: "credit", postedAt: "2026-10-12T14:10:00Z" },
  { id: "t22", merchant: "Brightline Studio", category: "income", amount: 3240, accountId: "everyday", postedAt: "2026-10-08T09:00:00Z" },
  { id: "t23", merchant: "Greenleaf Market", category: "groceries", amount: -66.4, accountId: "everyday", postedAt: "2026-10-08T17:35:00Z" },
  { id: "t24", merchant: "Velvet Room", category: "dining", amount: -58.2, accountId: "credit", postedAt: "2026-10-08T22:40:00Z" },
  { id: "t25", merchant: "Ticketpost", category: "fun", amount: -68, accountId: "credit", postedAt: "2026-10-07T13:02:00Z" },
  { id: "t26", merchant: "Northgate Pharmacy", category: "shopping", amount: -18.45, accountId: "everyday", postedAt: "2026-10-05T16:18:00Z" },
  { id: "t27", merchant: "Metro Transit", category: "transport", amount: -12.9, accountId: "everyday", postedAt: "2026-10-05T07:58:00Z" },
  { id: "t28", merchant: "Corner Bakehouse", category: "dining", amount: -9.6, accountId: "everyday", postedAt: "2026-10-05T09:20:00Z" },
  { id: "t29", merchant: "Fieldstone Grocers", category: "groceries", amount: -39.85, accountId: "everyday", postedAt: "2026-10-02T18:44:00Z" },
  { id: "t30", merchant: "Habitat Living", category: "home", amount: -1450, accountId: "everyday", postedAt: "2026-10-01T07:00:00Z" },
];

export const listBills: MoneyBill[] = [
  { id: "b1", name: "Northwind Energy", amount: 86.4, due: "2026-10-26", category: "home", autopay: true },
  { id: "b2", name: "Fernway Fiber", amount: 55, due: "2026-10-28", category: "home" },
  { id: "b3", name: "Reelhouse", amount: 12.99, due: "2026-10-30", category: "fun", autopay: true },
  { id: "b4", name: "Habitat Living", amount: 1450, due: "2026-11-01", category: "home" },
  { id: "b5", name: "Ironbridge Insurance", amount: 38.2, due: "2026-11-04", category: "home" },
];

export const listBudgets: MoneyBudget[] = [
  { category: "groceries", limit: 600 },
  { category: "dining", limit: 300 },
  { category: "transport", limit: 150 },
  { category: "fun", limit: 200 },
];

export const payBill: MoneyTransaction = { id: "pay-b2", merchant: "Fernway Fiber", category: "home", amount: -55, accountId: "everyday", postedAt: now };

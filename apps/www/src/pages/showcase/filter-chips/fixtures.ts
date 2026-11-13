// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Customer, CustomersPage } from "./schema";
import type { CustomersListQuery } from "./view";

/** The demo's clock; lastActiveAt values are relative to it. */
export const now = "2026-10-24T12:00:00Z";

const daysAgo = (days: number) => new Date(Date.parse(now) - days * 86_400_000).toISOString();

/** Demo data for the showcase, the generated mocks and tests. */
export const countries = ["US", "CA", "GB", "DE", "FR"];

export const customers: Customer[] = [
  { id: "c1", name: "Foundry Labs", status: "active", plan: "pro", country: "GB", mrr: 1200, lastActiveAt: daysAgo(1), tags: ["enterprise", "design"] },
  { id: "c2", name: "Northwind Co.", status: "active", plan: "pro", country: "US", mrr: 480, lastActiveAt: daysAgo(2), tags: ["smb"] },
  { id: "c3", name: "Halcyon Ventures", status: "active", plan: "enterprise", country: "DE", mrr: 9800, lastActiveAt: daysAgo(0), tags: ["enterprise", "finance"] },
  { id: "c4", name: "Atlas Studio", status: "paused", plan: "pro", country: "CA", mrr: 0, lastActiveAt: daysAgo(60), tags: ["agency"] },
  { id: "c5", name: "Lumen Health", status: "active", plan: "enterprise", country: "US", mrr: 14200, lastActiveAt: daysAgo(3), tags: ["enterprise", "health"] },
  { id: "c6", name: "Nimbus IO", status: "trial", plan: "pro", country: "US", mrr: 0, lastActiveAt: daysAgo(1), tags: ["devtools"] },
  { id: "c7", name: "Frequency", status: "churned", plan: "pro", country: "FR", mrr: 0, lastActiveAt: daysAgo(92), tags: ["agency"] },
  { id: "c8", name: "Quartz Bank", status: "active", plan: "enterprise", country: "GB", mrr: 22000, lastActiveAt: daysAgo(5), tags: ["enterprise", "finance"] },
  { id: "c9", name: "Cobalt Studio", status: "trial", plan: "free", country: "US", mrr: 0, lastActiveAt: daysAgo(0), tags: ["agency", "design"] },
  { id: "c10", name: "Ridgeline", status: "active", plan: "pro", country: "DE", mrr: 740, lastActiveAt: daysAgo(8), tags: ["smb"] },
  { id: "c11", name: "Pivot & Co.", status: "active", plan: "free", country: "FR", mrr: 0, lastActiveAt: daysAgo(14), tags: ["smb"] },
  { id: "c12", name: "Granite Health", status: "active", plan: "enterprise", country: "CA", mrr: 6400, lastActiveAt: daysAgo(2), tags: ["enterprise", "health"] },
  { id: "c13", name: "Tinto Ltd", status: "paused", plan: "pro", country: "GB", mrr: 0, lastActiveAt: daysAgo(35), tags: ["smb"] },
  { id: "c14", name: "Vert Studio", status: "active", plan: "pro", country: "FR", mrr: 580, lastActiveAt: daysAgo(12), tags: ["agency", "design"] },
  { id: "c15", name: "Slate Group", status: "active", plan: "enterprise", country: "US", mrr: 18800, lastActiveAt: daysAgo(0), tags: ["enterprise"] },
  { id: "c16", name: "Boreal", status: "trial", plan: "free", country: "CA", mrr: 0, lastActiveAt: daysAgo(4), tags: ["devtools"] },
];

/** The query the demo opens with. */
export const defaultQuery: CustomersListQuery = {
  page: 1,
  pageSize: 20,
  filters: { status: ["active", "trial"], plan: "pro", country: ["US", "CA"], excludeCountry: true, mrrMin: 500 },
};

/** What the mocks return for `listCustomers`. */
export const listCustomers: CustomersPage = { items: customers.slice(0, 5), total: 5 };

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const CustomerStatus = z.enum(["active", "trial", "paused", "churned"]).meta({ id: "CustomerStatus" });
export type CustomerStatus = z.infer<typeof CustomerStatus>;

export const CustomerPlan = z.enum(["free", "pro", "enterprise"]).meta({ id: "CustomerPlan" });
export type CustomerPlan = z.infer<typeof CustomerPlan>;

export const Customer = z
  .object({
    id: z.string(),
    name: z.string(),
    status: CustomerStatus,
    plan: CustomerPlan,
    /** ISO 3166-1 alpha-2, e.g. "GB". */
    country: z.string().length(2),
    /** Monthly recurring revenue in the provider's currency, major units. */
    mrr: z.number().min(0),
    lastActiveAt: z.iso.datetime(),
    tags: z.array(z.string()),
  })
  .meta({ id: "Customer" });
export type Customer = z.infer<typeof Customer>;

/** The chips. Absent means no filter on that field. */
export const CustomerFilters = z
  .object({
    /** Any of these statuses. */
    status: z.array(CustomerStatus).optional(),
    plan: CustomerPlan.optional(),
    /** In these countries, or not in them when `excludeCountry` is true. */
    country: z.array(z.string().length(2)).optional(),
    excludeCountry: z.boolean().optional(),
    /** MRR at least this much. */
    mrrMin: z.number().min(0).optional(),
    /** Active within this many days. */
    activeWithinDays: z.int().min(1).optional(),
    /** Has a tag containing this text. */
    tag: z.string().optional(),
  })
  .meta({ id: "CustomerFilters" });
export type CustomerFilters = z.infer<typeof CustomerFilters>;

/** The list query as query-string parameters (arrays repeat the key). */
export const CustomersQuery = z
  .object({ page: z.int().min(1), pageSize: z.int().min(1).max(100), search: z.string().optional() })
  .extend(CustomerFilters.shape)
  .meta({ id: "CustomersQuery" });
export type CustomersQuery = z.infer<typeof CustomersQuery>;

export const CustomersPage = z
  .object({ items: z.array(Customer), total: z.int().min(0) })
  .meta({ id: "CustomersPage" });
export type CustomersPage = z.infer<typeof CustomersPage>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listCustomers: {
    method: "GET",
    path: "/customers",
    summary: "One page of customers matching the search and filter chips",
    query: CustomersQuery,
    response: CustomersPage,
  },
});

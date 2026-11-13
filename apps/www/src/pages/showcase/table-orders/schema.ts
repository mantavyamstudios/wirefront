// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const OrderStage = z.enum(["ordered", "packed", "shipped", "delivered"]).meta({ id: "OrderStage" });
export type OrderStage = z.infer<typeof OrderStage>;

export const Order = z
  .object({
    id: z.string(),
    /** The reference customers see, e.g. "#A-2841". */
    number: z.string(),
    customer: z.string(),
    itemCount: z.int().min(1),
    /** In `currency`, major units. */
    total: z.number().min(0),
    currency: z.string().length(3),
    stage: OrderStage,
    carrier: z.string().nullable(),
    /** Estimated (or actual) delivery date. */
    eta: z.iso.date().nullable(),
    placedAt: z.iso.datetime(),
  })
  .meta({ id: "Order" });
export type Order = z.infer<typeof Order>;

/** The list query as query-string parameters. */
export const OrdersQuery = z
  .object({
    page: z.int().min(1),
    pageSize: z.int().min(1).max(100),
    sort: z.enum(["placedAt", "total"]).optional(),
    direction: z.enum(["asc", "desc"]).optional(),
  })
  .meta({ id: "OrdersQuery" });
export type OrdersQuery = z.infer<typeof OrdersQuery>;

export const OrdersPage = z.object({ items: z.array(Order), total: z.int().min(0) }).meta({ id: "OrdersPage" });
export type OrdersPage = z.infer<typeof OrdersPage>;

const OrderIds = z.object({ ids: z.array(z.string()).min(1) }).meta({ id: "OrderIds" });

/** The backend operations this screen calls. */
export const api = defineApi({
  listOrders: { method: "GET", path: "/orders", summary: "List orders, sorted and paginated", query: OrdersQuery, response: OrdersPage },
  markShipped: { method: "POST", path: "/orders/mark-shipped", summary: "Mark the selected orders as shipped", body: OrderIds },
  printLabels: {
    method: "POST",
    path: "/orders/labels",
    summary: "Create shipping labels for the selected orders; returns a URL to the printable file",
    body: OrderIds,
    response: z.object({ url: z.url() }),
  },
});

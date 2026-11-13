// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const InventoryItem = z
  .object({
    id: z.string(),
    sku: z.string(),
    name: z.string(),
    /** e.g. "12oz · Sand". */
    variant: z.string().optional(),
    category: z.string(),
    /** In `currency`, major units. */
    price: z.number().min(0),
    currency: z.string().length(3),
    stock: z.int().min(0),
    /** What a full shelf holds; the meter shows stock against it. */
    capacity: z.int().min(1),
    imageUrl: z.url().optional(),
  })
  .meta({ id: "InventoryItem" });
export type InventoryItem = z.infer<typeof InventoryItem>;

/** The list query as query-string parameters. */
export const InventoryQuery = z
  .object({
    page: z.int().min(1),
    pageSize: z.int().min(1).max(100),
    sort: z.enum(["name", "stock", "price"]).optional(),
    direction: z.enum(["asc", "desc"]).optional(),
  })
  .meta({ id: "InventoryQuery" });
export type InventoryQuery = z.infer<typeof InventoryQuery>;

export const InventoryPage = z.object({ items: z.array(InventoryItem), total: z.int().min(0) }).meta({ id: "InventoryPage" });
export type InventoryPage = z.infer<typeof InventoryPage>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listInventory: {
    method: "GET",
    path: "/inventory",
    summary: "List products with their stock, sorted and paginated",
    query: InventoryQuery,
    response: InventoryPage,
  },
});

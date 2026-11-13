// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { InventoryItem, InventoryPage } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const inventory: InventoryItem[] = [
  { id: "1", sku: "FRJ-001", name: "Dune buggy mug", variant: "12oz · Sand", category: "Drinkware", price: 24, currency: "USD", stock: 124, capacity: 200 },
  { id: "2", sku: "FRJ-014", name: "Field hoodie", variant: "Heavyweight · Moss", category: "Apparel", price: 92, currency: "USD", stock: 38, capacity: 150 },
  { id: "3", sku: "FRJ-022", name: "Pocket notebook", variant: "Hardcover · Bone", category: "Stationery", price: 18, currency: "USD", stock: 6, capacity: 80 },
  { id: "4", sku: "FRJ-031", name: "Foldable lantern", variant: "USB-C · Night", category: "Hardware", price: 64, currency: "USD", stock: 0, capacity: 50 },
  { id: "5", sku: "FRJ-040", name: "Ceramic planter", variant: "Med · Dune", category: "Home", price: 38, currency: "USD", stock: 72, capacity: 100 },
  { id: "6", sku: "FRJ-052", name: "Slate playing cards", variant: "Dual deck", category: "Games", price: 14, currency: "USD", stock: 410, capacity: 500 },
];

/** What the mocks return for `listInventory`. */
export const listInventory: InventoryPage = { items: inventory, total: 124 };

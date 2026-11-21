// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the table over an in-memory backend.
// Not shipped by the registry; builders wire InventoryTable to their own backend.
import { useMemo, useState } from "react";
import * as fixtures from "./fixtures";
import { InventoryTable, type InventoryListQuery } from "./view";

/** What a backend's listInventory would do with the query (the demo has one page of the 124). */
function runQuery(query: InventoryListQuery) {
  const { id = "stock", direction = "asc" } = query.sort ?? {};
  const key = (i: (typeof fixtures.inventory)[number]) => (id === "name" ? i.name : id === "price" ? i.price : i.stock);
  const items = [...fixtures.inventory].sort((a, b) => {
    const [x, y] = [key(a), key(b)];
    return (typeof x === "string" ? x.localeCompare(String(y)) : x - Number(y)) * (direction === "asc" ? 1 : -1);
  });
  return { items, total: fixtures.listInventory.total };
}

export function TableInventoryShowcasePage() {
  const [query, setQuery] = useState<InventoryListQuery>({ page: 1, pageSize: 6, sort: { id: "stock", direction: "asc" } });
  const page = useMemo(() => runQuery(query), [query]);
  return <InventoryTable newProductHref="#new-product" onQueryChange={setQuery} page={page} query={query} subtitle="Field & Range" />;
}

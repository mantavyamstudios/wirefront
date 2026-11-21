// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the table over an in-memory backend.
// Not shipped by the registry; builders wire OrdersTable to their own backend.
import { ok } from "@wirefront/ui/wirefront/types";
import { useMemo, useState } from "react";
import * as fixtures from "./fixtures";
import type { Order } from "./schema";
import { OrdersTable, type OrdersListQuery } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** What a backend's listOrders would do with the query (the demo has one page of the 248). */
function runQuery(all: Order[], query: OrdersListQuery) {
  const { id = "placedAt", direction = "desc" } = query.sort ?? {};
  const items = [...all].sort((a, b) => (id === "total" ? a.total - b.total : a.placedAt.localeCompare(b.placedAt)) * (direction === "asc" ? 1 : -1));
  return { items, total: fixtures.listOrders.total };
}

export function TableOrdersShowcasePage() {
  const [db, setDb] = useState(fixtures.orders);
  const [query, setQuery] = useState<OrdersListQuery>({ page: 1, pageSize: 6, sort: { id: "placedAt", direction: "desc" } });
  const page = useMemo(() => runQuery(db, query), [db, query]);
  return (
    <OrdersTable
      onMarkShipped={async (ids) => {
        await wait(600);
        setDb((rows) => rows.map((o) => (ids.includes(o.id) && o.stage !== "delivered" ? { ...o, stage: "shipped" } : o)));
      }}
      onPrintLabels={async () => {
        await wait(800);
        return ok(fixtures.printLabels);
      }}
      onQueryChange={setQuery}
      page={page}
      query={query}
    />
  );
}

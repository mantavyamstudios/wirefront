// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: wires the view to an in-memory backend and the previewed state.
// Not shipped by the registry; builders wire InvoicesTable to their own backend.
import { useMemo, useState } from "react";
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import type { Invoice, InvoicesPage } from "./schema";
import { type InvoicesListQuery, InvoicesTable } from "./view";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** What a backend's listInvoices would do with the query. */
function runQuery(all: Invoice[], query: InvoicesListQuery): InvoicesPage {
  const search = query.search?.trim().toLowerCase();
  let items = all.filter(
    (i) =>
      (!search || [i.number, i.customer, i.email].some((v) => v.toLowerCase().includes(search))) &&
      (!query.filters?.status || i.status === query.filters.status),
  );
  if (query.sort) {
    const { id, direction } = query.sort;
    const key = (i: Invoice) => (id === "amount" ? i.amount : id === "dueAt" ? (i.dueAt ?? "") : i.issuedAt);
    items = [...items].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0) * (direction === "asc" ? 1 : -1));
  }
  const start = (query.page - 1) * query.pageSize;
  return { items: items.slice(start, start + query.pageSize), total: items.length, outstanding: { amount: fixtures.outstandingOf(items), currency: "USD" } };
}

async function demoExport() {
  await wait(800);
}

export function TableInvoicesShowcasePage() {
  const state = useShowcaseState();
  const [query, setQuery] = useState<InvoicesListQuery>({ page: 1, pageSize: 20 });
  const page = useMemo(() => runQuery(state === "empty" ? [] : fixtures.invoices, query), [state, query]);
  return (
    <InvoicesTable
      error="The billing service didn’t respond. Check your connection and try again."
      invoiceHref={(invoice) => `#${invoice.number}`}
      newInvoiceHref="#new-invoice"
      onExport={demoExport}
      onQueryChange={setQuery}
      onRetry={() => {}}
      page={state === "loading" || state === "error" ? undefined : page}
      query={query}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}

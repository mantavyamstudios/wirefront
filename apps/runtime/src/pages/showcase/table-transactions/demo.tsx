// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the table over an in-memory backend.
// Not shipped by the registry; builders wire TransactionsTable to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useMemo, useState } from "react";
import * as fixtures from "./fixtures";
import { TransactionsTable, type TransactionsListQuery } from "./view";

const demoNow = () => new Date(fixtures.now);
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** What a backend's listTransactions would do with the query. */
function runQuery(query: TransactionsListQuery) {
  const search = query.search?.trim().toLowerCase();
  const f = query.filters ?? {};
  const since = f.withinDays
    ? Date.parse(fixtures.now) - f.withinDays * 86_400_000
    : 0;
  const all = fixtures.transactions.filter(
    (tx) =>
      (!search ||
        [tx.id, tx.description, tx.counterparty].some((v) =>
          v.toLowerCase().includes(search)
        )) &&
      (!f.account || tx.account === f.account) &&
      (!f.direction || tx.direction === f.direction) &&
      Date.parse(tx.occurredAt) >= since
  );
  const settled = all.filter((tx) => tx.status === "succeeded");
  const sum = (dir: "in" | "out") =>
    settled
      .filter((tx) => tx.direction === dir)
      .reduce((n, tx) => n + tx.amount, 0);
  const start = (query.page - 1) * query.pageSize;
  return {
    items: all.slice(start, start + query.pageSize),
    total: all.length,
    summary: { inflow: sum("in"), outflow: sum("out"), currency: "USD" },
  };
}

export function TableTransactionsShowcasePage() {
  const [query, setQuery] = useState(fixtures.defaultQuery);
  const page = useMemo(() => runQuery(query), [query]);
  return (
    <WirefrontProvider now={demoNow} timeZone="UTC">
      <TransactionsTable
        accounts={fixtures.listAccounts}
        onExport={() => wait(900)}
        onQueryChange={setQuery}
        onRefresh={() => setQuery((q) => ({ ...q }))}
        page={page}
        query={query}
        subtitle="Northbank · Operating and reserve"
      />
    </WirefrontProvider>
  );
}

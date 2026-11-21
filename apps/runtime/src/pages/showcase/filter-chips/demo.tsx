// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the chips over an in-memory backend, in sample page chrome.
// Not shipped by the registry; builders wire CustomerFilterChips to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useMemo, useState } from "react";
import * as fixtures from "./fixtures";
import { CustomerFilterChips, type CustomersListQuery } from "./view";

const demoNow = () => new Date(fixtures.now);

/** What a backend's listCustomers would do with the query. */
function runQuery(query: CustomersListQuery) {
  const search = query.search?.trim().toLowerCase();
  const f = query.filters ?? {};
  const since = f.activeWithinDays ? Date.parse(fixtures.now) - f.activeWithinDays * 86_400_000 : 0;
  const tag = f.tag?.trim().toLowerCase();
  const items = fixtures.customers.filter(
    (c) =>
      (!search || c.name.toLowerCase().includes(search)) &&
      (!f.status?.length || f.status.includes(c.status)) &&
      (!f.plan || c.plan === f.plan) &&
      (!f.country?.length || f.country.includes(c.country) !== (f.excludeCountry === true)) &&
      (f.mrrMin === undefined || c.mrr >= f.mrrMin) &&
      Date.parse(c.lastActiveAt) >= since &&
      (!tag || c.tags.some((t) => t.includes(tag))),
  );
  const start = (query.page - 1) * query.pageSize;
  return { items: items.slice(start, start + query.pageSize), total: items.length };
}

export function FilterChipsShowcasePage() {
  const [query, setQuery] = useState(fixtures.defaultQuery);
  const page = useMemo(() => runQuery(query), [query]);
  return (
    <WirefrontProvider currency="USD" now={demoNow}>
      <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <header className="mb-6">
            <h1 className="font-heading text-xl">Active filter chips</h1>
            <p className="text-muted-foreground text-sm">Field · operator · value pills with quick edit and removal.</p>
          </header>
          <CustomerFilterChips
            countries={fixtures.countries}
            customers={page.items}
            onQueryChange={setQuery}
            onSaveView={() => {}}
            onShare={() => {}}
            query={query}
            total={page.total}
          />
        </div>
      </div>
    </WirefrontProvider>
  );
}

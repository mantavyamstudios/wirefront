// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: holds the search and filters in local state.
// Not shipped by the registry; builders pass their own list query.
import { useState } from "react";
import * as fixtures from "./fixtures";
import { NoResults } from "./view";

export function EmptyNoResultsShowcasePage() {
  const [query, setQuery] = useState(fixtures.query);
  const [filters, setFilters] = useState(fixtures.filters);
  return (
    <NoResults
      filters={filters}
      onClearFilters={() => setFilters([])}
      onQueryChange={setQuery}
      onRemoveFilter={(id) => setFilters((all) => all.filter((f) => f.id !== id))}
      query={query}
      searchPlaceholder="Search invoices…"
    />
  );
}

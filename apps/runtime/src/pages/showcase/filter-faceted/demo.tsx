// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the filter bar over an in-memory backend, in sample page chrome.
// Not shipped by the registry; builders wire IssueFilterBar to their own backend.
import { useMemo, useState } from "react";
import * as fixtures from "./fixtures";
import { IssueFilterBar, type IssuesListQuery } from "./view";

/** What a backend's listIssues would do with the query. */
function runQuery(query: IssuesListQuery) {
  const f = query.filters ?? {};
  const items = fixtures.issues.filter(
    (i) =>
      (!f.status?.length || f.status.includes(i.status)) &&
      (!f.priority?.length || f.priority.includes(i.priority)) &&
      (!f.assignee?.length || (i.assigneeId !== null && f.assignee.includes(i.assigneeId))) &&
      (!f.label?.length || i.labelIds.some((l) => f.label?.includes(l))),
  );
  const start = (query.page - 1) * query.pageSize;
  return { items: items.slice(start, start + query.pageSize), total: items.length };
}

const counts = fixtures.countFacets(fixtures.issues);

export function FilterFacetedShowcasePage() {
  const [query, setQuery] = useState(fixtures.defaultQuery);
  const page = useMemo(() => runQuery(query), [query]);
  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6">
          <h1 className="font-heading text-xl">Faceted filters</h1>
          <p className="text-muted-foreground text-sm">Each facet opens a popover with multi-select options and counts.</p>
        </header>
        <IssueFilterBar
          counts={counts}
          issues={page.items}
          labels={fixtures.listLabels}
          onAddFilter={() => {}}
          onQueryChange={setQuery}
          overall={fixtures.issues.length}
          people={fixtures.listPeople}
          query={query}
          total={page.total}
        />
      </div>
    </div>
  );
}

// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the table over an in-memory backend.
// Not shipped by the registry; builders wire IssuesTable to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useMemo, useState } from "react";
import * as fixtures from "./fixtures";
import type { TrackerPriority } from "./schema";
import { IssuesTable, type IssuesTableListQuery } from "./view";

const demoNow = () => new Date(fixtures.now);
const RANK: Record<TrackerPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

/** What a backend's listIssues would do with the query. */
function runQuery(query: IssuesTableListQuery) {
  const search = query.search?.trim().toLowerCase();
  const f = query.filters ?? {};
  const items = fixtures.issues.filter(
    (i) =>
      (!search || `${i.key} ${i.title}`.toLowerCase().includes(search)) &&
      (!f.status?.length || f.status.includes(i.status)) &&
      (!f.priority?.length || f.priority.includes(i.priority)) &&
      (!f.assignee?.length ||
        (i.assigneeId !== null && f.assignee.includes(i.assigneeId))) &&
      (!f.label?.length || i.labelIds.some((l) => f.label?.includes(l)))
  );
  const { id = "updatedAt", direction = "desc" } = query.sort ?? {};
  items.sort(
    (a, b) =>
      (id === "priority"
        ? RANK[a.priority] - RANK[b.priority]
        : a.updatedAt.localeCompare(b.updatedAt)) *
      (direction === "asc" ? 1 : -1)
  );
  return { items, total: items.length };
}

export function TableIssuesShowcasePage() {
  const [query, setQuery] = useState(fixtures.defaultQuery);
  const page = useMemo(() => runQuery(query), [query]);
  return (
    <WirefrontProvider now={demoNow}>
      <IssuesTable
        labels={fixtures.listLabels}
        newIssueHref="#new-issue"
        onQueryChange={setQuery}
        page={page}
        people={fixtures.listPeople}
        query={query}
        subtitle="ENG · Cycle 14"
      />
    </WirefrontProvider>
  );
}

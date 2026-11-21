// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the toolbar over an in-memory backend, in sample page chrome.
// Not shipped by the registry; builders wire ProjectsToolbar to their own backend.
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { useMemo, useState } from "react";
import * as fixtures from "./fixtures";
import { ProjectsToolbar, type ProjectsListQuery } from "./view";

const demoNow = () => new Date(fixtures.now);

/** What a backend's listProjects would do with the query. */
function runQuery(query: ProjectsListQuery) {
  const search = query.search?.trim().toLowerCase();
  const f = query.filters ?? {};
  const since = f.activeWithinDays ? Date.parse(fixtures.now) - f.activeWithinDays * 86_400_000 : 0;
  const items = fixtures.projects.filter(
    (p) =>
      (!search || p.name.toLowerCase().includes(search)) &&
      (!f.status || p.status === f.status) &&
      (!f.owner || p.owner === f.owner) &&
      Date.parse(p.lastActiveAt) >= since,
  );
  const start = (query.page - 1) * query.pageSize;
  return { items: items.slice(start, start + query.pageSize), total: items.length };
}

export function FilterToolbarShowcasePage() {
  const [query, setQuery] = useState<ProjectsListQuery>(fixtures.defaultQuery);
  const page = useMemo(() => runQuery(query), [query]);
  return (
    <WirefrontProvider now={demoNow}>
      <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-5xl">
          <header className="mb-6">
            <h1 className="font-heading text-xl">Toolbar filters</h1>
            <p className="text-muted-foreground text-sm">One row · search, scoped selects, date range, density toggle.</p>
          </header>
          <ProjectsToolbar
            onCreateView={() => {}}
            onQueryChange={setQuery}
            onViewOptions={() => {}}
            overall={fixtures.projects.length}
            projects={page.items}
            query={query}
            savedViews={fixtures.savedViews}
            total={page.total}
          />
        </div>
      </div>
    </WirefrontProvider>
  );
}

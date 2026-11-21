// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { DocNode } from "./schema";

const page = (id: string, title: string): DocNode => ({ id, title, href: `#${id}` });

/** What the mocks return for `getDocsTree`. Demo data for the showcase and tests. */
export const getDocsTree: DocNode[] = [
  { id: "getting-started", title: "Getting started", children: [page("install", "Install the CLI"), page("quickstart", "Quickstart"), page("structure", "Project structure")] },
  {
    id: "concepts",
    title: "Concepts",
    children: [
      page("workspaces", "Workspaces"),
      page("teams", "Teams"),
      page("permissions", "Permissions"),
      { id: "events", title: "Realtime events", children: [page("events-overview", "Overview"), page("events-domain", "Domain events"), page("events-projector", "Projectors")] },
    ],
  },
  { id: "guides", title: "Guides", children: [page("add-permission", "Add a permission"), page("add-context", "Add a bounded context"), page("add-job", "Write a job")] },
  { id: "reference", title: "Reference", children: [page("ref-api", "API"), page("ref-cli", "CLI flags")] },
];

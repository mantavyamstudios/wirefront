// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { TrackerIssue, TrackerLabel, TrackerPage, TrackerPerson } from "./schema";
import type { IssuesTableListQuery } from "./view";

/** The demo's clock; updatedAt values are relative to it. */
export const now = "2026-04-24T12:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const listPeople: TrackerPerson[] = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "grace", name: "Grace Hopper" },
  { id: "alan", name: "Alan Turing" },
  { id: "linus", name: "Linus Torvalds" },
  { id: "margaret", name: "Margaret Hamilton" },
  { id: "edsger", name: "Edsger Dijkstra" },
];

export const listLabels: TrackerLabel[] = [
  { id: "bug", name: "bug", color: 4 },
  { id: "feature", name: "feature", color: 5 },
  { id: "infra", name: "infra", color: 3 },
  { id: "docs", name: "docs", color: 1 },
  { id: "design", name: "design", color: 6 },
  { id: "perf", name: "perf", color: 2 },
];

export const issues: TrackerIssue[] = [
  { id: "218", key: "ENG-218", title: "Realtime cursors flicker on Safari 17 after WS reconnect", status: "in-progress", priority: "urgent", assigneeId: "ada", labelIds: ["bug", "perf"], estimate: 5, updatedAt: "2026-04-24T11:48:00Z" },
  { id: "217", key: "ENG-217", title: "Add cycle progress chart to project sidebar", status: "in-review", priority: "medium", assigneeId: "grace", labelIds: ["feature", "design"], estimate: 3, updatedAt: "2026-04-24T10:00:00Z" },
  { id: "216", key: "ENG-216", title: "Migrate billing webhook to v2 schema", status: "todo", priority: "high", assigneeId: "alan", labelIds: ["infra"], estimate: 8, updatedAt: "2026-04-23T09:30:00Z" },
  { id: "215", key: "ENG-215", title: "Filter chips: persist operator across pages", status: "todo", priority: "low", assigneeId: null, labelIds: ["bug"], estimate: 2, updatedAt: "2026-04-22T16:00:00Z" },
  { id: "214", key: "ENG-214", title: "Document the new useFilters() hook", status: "in-progress", priority: "medium", assigneeId: "linus", labelIds: ["docs"], estimate: null, updatedAt: "2026-04-22T08:15:00Z" },
  { id: "213", key: "ENG-213", title: "Reduce p99 latency on /v1/search to 180ms", status: "in-review", priority: "high", assigneeId: "margaret", labelIds: ["perf", "infra"], estimate: 13, updatedAt: "2026-04-21T14:20:00Z" },
  { id: "212", key: "ENG-212", title: "Onboarding: reorder workspace steps", status: "done", priority: "low", assigneeId: "edsger", labelIds: ["design"], estimate: 3, updatedAt: "2026-04-19T12:00:00Z" },
];

/** The query the demo opens with. */
export const defaultQuery: IssuesTableListQuery = {
  page: 1,
  pageSize: 20,
  sort: { id: "updatedAt", direction: "desc" },
  filters: { status: ["todo", "in-progress", "in-review"] },
};

/** What the mocks return for `listIssues`. */
export const listIssues: TrackerPage = { items: issues, total: 218 };

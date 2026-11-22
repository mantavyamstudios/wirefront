// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type {
  Issue,
  IssueFacetCounts,
  IssueLabel,
  IssuePerson,
  IssuesPage,
} from "./schema";
import type { IssuesListQuery } from "./view";

/** Demo data for the showcase, the generated mocks and tests. */
export const listPeople: IssuePerson[] = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "grace", name: "Grace Hopper" },
  { id: "alan", name: "Alan Turing" },
  { id: "linus", name: "Linus Torvalds" },
];

export const listLabels: IssueLabel[] = [
  { id: "bug", name: "Bug", color: 4 },
  { id: "feature", name: "Feature", color: 5 },
  { id: "infra", name: "Infra", color: 3 },
  { id: "docs", name: "Docs", color: 1 },
  { id: "design", name: "Design", color: 6 },
];

export const issues: Issue[] = [
  {
    id: "i1",
    key: "ENG-204",
    title: "Migrate billing webhooks to v3",
    status: "in-progress",
    priority: "high",
    assigneeId: "ada",
    labelIds: ["infra", "feature"],
  },
  {
    id: "i2",
    key: "ENG-198",
    title: "Audit log retention policy",
    status: "in-review",
    priority: "urgent",
    assigneeId: "alan",
    labelIds: ["infra"],
  },
  {
    id: "i3",
    key: "DSN-91",
    title: "Onboarding particle field micro-anim",
    status: "in-progress",
    priority: "medium",
    assigneeId: "grace",
    labelIds: ["design"],
  },
  {
    id: "i4",
    key: "ENG-211",
    title: "Investigate charge.failed spike",
    status: "todo",
    priority: "urgent",
    assigneeId: "ada",
    labelIds: ["bug"],
  },
  {
    id: "i5",
    key: "ENG-210",
    title: "Schema validation: missing event.id",
    status: "in-progress",
    priority: "high",
    assigneeId: "linus",
    labelIds: ["bug", "infra"],
  },
  {
    id: "i6",
    key: "DOC-44",
    title: "Document new webhook signing flow",
    status: "todo",
    priority: "low",
    assigneeId: "grace",
    labelIds: ["docs"],
  },
  {
    id: "i7",
    key: "ENG-209",
    title: "Rate limit handling for OAuth",
    status: "todo",
    priority: "medium",
    assigneeId: "alan",
    labelIds: ["infra"],
  },
  {
    id: "i8",
    key: "DSN-87",
    title: "Refresh empty-state illustrations",
    status: "done",
    priority: "low",
    assigneeId: "grace",
    labelIds: ["design"],
  },
  {
    id: "i9",
    key: "ENG-201",
    title: "Remove deprecated team_id query param",
    status: "in-review",
    priority: "medium",
    assigneeId: "ada",
    labelIds: ["feature"],
  },
  {
    id: "i10",
    key: "ENG-200",
    title: "Mobile push notifications backend",
    status: "in-progress",
    priority: "high",
    assigneeId: "linus",
    labelIds: ["feature"],
  },
  {
    id: "i11",
    key: "ENG-189",
    title: "Postgres upgrade prep work",
    status: "todo",
    priority: "high",
    assigneeId: "alan",
    labelIds: ["infra"],
  },
  {
    id: "i12",
    key: "DOC-41",
    title: "API key rotation guide",
    status: "done",
    priority: "low",
    assigneeId: "grace",
    labelIds: ["docs"],
  },
  {
    id: "i13",
    key: "DSN-83",
    title: "Pricing page A/B variant B",
    status: "in-review",
    priority: "medium",
    assigneeId: "grace",
    labelIds: ["design", "feature"],
  },
  {
    id: "i14",
    key: "ENG-184",
    title: "Cache project lookups (TTL 12s)",
    status: "done",
    priority: "low",
    assigneeId: "linus",
    labelIds: ["infra"],
  },
  {
    id: "i15",
    key: "ENG-180",
    title: "Combobox keyboard focus regression",
    status: "todo",
    priority: "medium",
    assigneeId: "ada",
    labelIds: ["bug"],
  },
  {
    id: "i16",
    key: "ENG-176",
    title: "Toast double-announce in Safari",
    status: "done",
    priority: "low",
    assigneeId: "linus",
    labelIds: ["bug"],
  },
  {
    id: "i17",
    key: "DOC-40",
    title: "Rewrite onboarding tutorial",
    status: "in-progress",
    priority: "medium",
    assigneeId: null,
    labelIds: ["docs"],
  },
  {
    id: "i18",
    key: "DSN-79",
    title: "Card: stat tile sparklines",
    status: "done",
    priority: "low",
    assigneeId: "grace",
    labelIds: ["design", "feature"],
  },
];

/** The query the demo opens with. */
export const defaultQuery: IssuesListQuery = {
  page: 1,
  pageSize: 20,
  filters: {
    status: ["todo", "in-progress"],
    priority: ["high"],
    label: ["bug", "infra"],
  },
};

/** How many of `all` have each value; what a backend's counts would be. */
export function countFacets(all: Issue[]): IssueFacetCounts {
  const counts: IssueFacetCounts = {
    status: {},
    priority: {},
    assignee: {},
    label: {},
  };
  const bump = (bucket: Record<string, number>, key: string) => {
    bucket[key] = (bucket[key] ?? 0) + 1;
  };
  for (const issue of all) {
    bump(counts.status, issue.status);
    bump(counts.priority, issue.priority);
    if (issue.assigneeId) bump(counts.assignee, issue.assigneeId);
    for (const label of issue.labelIds) bump(counts.label, label);
  }
  return counts;
}

/** What the mocks return for `listIssues`. */
export const listIssues: IssuesPage = {
  items: issues.slice(0, 5),
  total: 5,
  overall: issues.length,
  counts: countFacets(issues),
};

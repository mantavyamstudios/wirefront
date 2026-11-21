// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const IssueStatus = z.enum(["todo", "in-progress", "in-review", "done"]).meta({ id: "IssueStatus" });
export type IssueStatus = z.infer<typeof IssueStatus>;

export const IssuePriority = z.enum(["urgent", "high", "medium", "low"]).meta({ id: "IssuePriority" });
export type IssuePriority = z.infer<typeof IssuePriority>;

export const IssuePerson = z.object({ id: z.string(), name: z.string() }).meta({ id: "IssuePerson" });
export type IssuePerson = z.infer<typeof IssuePerson>;

/** A label; `color` picks one of the eight category colours. */
export const IssueLabel = z
  .object({ id: z.string(), name: z.string(), color: z.int().min(1).max(8) })
  .meta({ id: "IssueLabel" });
export type IssueLabel = z.infer<typeof IssueLabel>;

export const Issue = z
  .object({
    id: z.string(),
    /** The short reference, e.g. "ENG-204". */
    key: z.string(),
    title: z.string(),
    status: IssueStatus,
    priority: IssuePriority,
    assigneeId: z.string().nullable(),
    labelIds: z.array(z.string()),
  })
  .meta({ id: "Issue" });
export type Issue = z.infer<typeof Issue>;

/**
 * The facets. Values within a facet are OR-ed (any of these statuses); facets
 * are AND-ed. An issue matches `label` when it has any of the labels.
 */
export const IssueFilters = z
  .object({
    status: z.array(IssueStatus).optional(),
    priority: z.array(IssuePriority).optional(),
    assignee: z.array(z.string()).optional(),
    label: z.array(z.string()).optional(),
  })
  .meta({ id: "IssueFilters" });
export type IssueFilters = z.infer<typeof IssueFilters>;

/** How many issues have each value, for the counts beside each option. */
export const IssueFacetCounts = z
  .object({
    status: z.record(z.string(), z.int().min(0)),
    priority: z.record(z.string(), z.int().min(0)),
    assignee: z.record(z.string(), z.int().min(0)),
    label: z.record(z.string(), z.int().min(0)),
  })
  .meta({ id: "IssueFacetCounts" });
export type IssueFacetCounts = z.infer<typeof IssueFacetCounts>;

/** The list query as query-string parameters (arrays repeat the key). */
export const IssuesQuery = z
  .object({ page: z.int().min(1), pageSize: z.int().min(1).max(100) })
  .extend(IssueFilters.shape)
  .meta({ id: "IssuesQuery" });
export type IssuesQuery = z.infer<typeof IssuesQuery>;

export const IssuesPage = z
  .object({
    items: z.array(Issue),
    /** Issues matching the filters, across all pages. */
    total: z.int().min(0),
    /** All issues, ignoring the filters. */
    overall: z.int().min(0),
    counts: IssueFacetCounts,
  })
  .meta({ id: "IssuesPage" });
export type IssuesPage = z.infer<typeof IssuesPage>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listIssues: {
    method: "GET",
    path: "/issues",
    summary: "One page of issues matching the facets, with per-value counts",
    query: IssuesQuery,
    response: IssuesPage,
  },
  listPeople: { method: "GET", path: "/people", summary: "People issues can be assigned to", response: z.array(IssuePerson) },
  listLabels: { method: "GET", path: "/labels", summary: "Labels issues can have", response: z.array(IssueLabel) },
});

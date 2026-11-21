// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const TrackerStatus = z.enum(["todo", "in-progress", "in-review", "done"]).meta({ id: "TrackerStatus" });
export type TrackerStatus = z.infer<typeof TrackerStatus>;

export const TrackerPriority = z.enum(["urgent", "high", "medium", "low", "none"]).meta({ id: "TrackerPriority" });
export type TrackerPriority = z.infer<typeof TrackerPriority>;

export const TrackerPerson = z.object({ id: z.string(), name: z.string() }).meta({ id: "TrackerPerson" });
export type TrackerPerson = z.infer<typeof TrackerPerson>;

/** A label; `color` picks one of the eight category colours. */
export const TrackerLabel = z.object({ id: z.string(), name: z.string(), color: z.int().min(1).max(8) }).meta({ id: "TrackerLabel" });
export type TrackerLabel = z.infer<typeof TrackerLabel>;

export const TrackerIssue = z
  .object({
    id: z.string(),
    /** The short reference, e.g. "ENG-218". */
    key: z.string(),
    title: z.string(),
    status: TrackerStatus,
    priority: TrackerPriority,
    assigneeId: z.string().nullable(),
    labelIds: z.array(z.string()),
    /** Story points. */
    estimate: z.int().min(0).nullable(),
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "TrackerIssue" });
export type TrackerIssue = z.infer<typeof TrackerIssue>;

/** Values within a facet are OR-ed; facets are AND-ed. */
export const TrackerFilters = z
  .object({
    status: z.array(TrackerStatus).optional(),
    priority: z.array(TrackerPriority).optional(),
    assignee: z.array(z.string()).optional(),
    label: z.array(z.string()).optional(),
  })
  .meta({ id: "TrackerFilters" });
export type TrackerFilters = z.infer<typeof TrackerFilters>;

/** The list query as query-string parameters (arrays repeat the key). */
export const TrackerQuery = z
  .object({
    page: z.int().min(1),
    pageSize: z.int().min(1).max(100),
    search: z.string().optional(),
    sort: z.enum(["updatedAt", "priority"]).optional(),
    direction: z.enum(["asc", "desc"]).optional(),
  })
  .extend(TrackerFilters.shape)
  .meta({ id: "TrackerQuery" });
export type TrackerQuery = z.infer<typeof TrackerQuery>;

export const TrackerPage = z.object({ items: z.array(TrackerIssue), total: z.int().min(0) }).meta({ id: "TrackerPage" });
export type TrackerPage = z.infer<typeof TrackerPage>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listIssues: { method: "GET", path: "/issues", summary: "List issues, searched, filtered, sorted and paginated", query: TrackerQuery, response: TrackerPage },
  listPeople: { method: "GET", path: "/people", summary: "People issues can be assigned to", response: z.array(TrackerPerson) },
  listLabels: { method: "GET", path: "/labels", summary: "Labels issues can have", response: z.array(TrackerLabel) },
});

// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const IssueStatus = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
]);
export type IssueStatus = z.infer<typeof IssueStatus>;
/** 0 none, 1 urgent, 2 high, 3 medium, 4 low. */
export const IssuePriority = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
export type IssuePriority = z.infer<typeof IssuePriority>;
export const IssueTone = z.enum([
  "blue",
  "orange",
  "teal",
  "violet",
  "rose",
  "amber",
  "emerald",
  "sky",
]);
export type IssueTone = z.infer<typeof IssueTone>;

export const IssuePerson = z
  .object({ id: z.string(), name: z.string(), tone: IssueTone })
  .meta({ id: "IssuePerson" });
export type IssuePerson = z.infer<typeof IssuePerson>;
export const IssueLabel = z
  .object({ id: z.string(), name: z.string(), tone: IssueTone })
  .meta({ id: "IssueLabel" });
export type IssueLabel = z.infer<typeof IssueLabel>;

export const IssueActivity = z
  .object({
    who: z.string(),
    text: z.string(),
    /** ISO timestamp or date. */ at: z.string(),
    comment: z.boolean().optional(),
  })
  .meta({ id: "IssueActivity" });
export type IssueActivity = z.infer<typeof IssueActivity>;

export const Issue = z
  .object({
    id: z.string(),
    title: z.string(),
    status: IssueStatus,
    priority: IssuePriority,
    assignee: z.string().optional(),
    labels: z.array(z.string()).optional(),
    estimate: z.number().optional(),
    /** ISO date. */
    due: z.string().optional(),
    /** ISO date. */
    created: z.string(),
    description: z.array(z.string()).optional(),
    subtasks: z
      .array(z.object({ title: z.string(), done: z.boolean() }))
      .optional(),
    activity: z.array(IssueActivity).optional(),
  })
  .meta({ id: "Issue" });
export type Issue = z.infer<typeof Issue>;

/** A change to apply to one or more issues. */
export const IssuePatch = z
  .object({
    status: IssueStatus.optional(),
    priority: IssuePriority.optional(),
    /** null clears the assignee. */
    assignee: z.string().nullable().optional(),
    title: z.string().optional(),
    label: z.object({ id: z.string(), on: z.boolean() }).optional(),
    subtask: z.object({ title: z.string(), done: z.boolean() }).optional(),
  })
  .meta({ id: "IssuePatch" });
export type IssuePatch = z.infer<typeof IssuePatch>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listIssues: {
    method: "GET",
    path: "/teams/{key}/issues",
    summary: "The team's issues",
    params: z.object({ key: z.string() }),
    response: z.array(Issue),
  },
  createIssue: {
    method: "POST",
    path: "/teams/{key}/issues",
    summary: "Create an issue",
    params: z.object({ key: z.string() }),
    body: z.object({ status: IssueStatus }),
    response: Issue,
  },
  updateIssues: {
    method: "PATCH",
    path: "/issues",
    summary: "Apply one change to several issues",
    body: z.object({ ids: z.array(z.string()).min(1), patch: IssuePatch }),
  },
  deleteIssues: {
    method: "POST",
    path: "/issues/delete",
    summary: "Delete issues",
    body: z.object({ ids: z.array(z.string()).min(1) }),
  },
  commentOnIssue: {
    method: "POST",
    path: "/issues/{id}/comments",
    summary: "Comment on an issue",
    params: z.object({ id: z.string() }),
    body: z.object({ body: z.string().min(1) }),
  },
});

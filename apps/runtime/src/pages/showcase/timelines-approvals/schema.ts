// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Reviewer = z
  .object({
    id: z.string(),
    name: z.string(),
    state: z.enum(["approved", "changes", "pending"]),
    at: z.string().optional(),
  })
  .meta({ id: "Reviewer" });
export type Reviewer = z.infer<typeof Reviewer>;

export const Check = z
  .object({
    id: z.string(),
    name: z.string(),
    status: z.enum(["passed", "failing", "pending"]),
    durationMs: z.number().nonnegative().optional(),
  })
  .meta({ id: "Check" });
export type Check = z.infer<typeof Check>;

export const PrEvent = z
  .object({
    id: z.string(),
    type: z.enum(["commit", "review", "comment", "ci", "opened"]),
    /** A one-line summary, e.g. "James pushed 3 commits". */
    summary: z.string(),
    detail: z.string().optional(),
    actor: z.string().optional(),
    state: z.enum(["approved", "changes", "passed", "failing"]).optional(),
    at: z.string(),
  })
  .meta({ id: "PrEvent" });
export type PrEvent = z.infer<typeof PrEvent>;

export const PullRequest = z
  .object({
    number: z.number().int(),
    repo: z.string(),
    title: z.string(),
    state: z.enum(["open", "merged", "closed"]),
    head: z.string(),
    base: z.string(),
    commits: z.number().int().nonnegative(),
    files: z.number().int().nonnegative(),
    reviewers: z.array(Reviewer),
    checks: z.array(Check),
    /** Newest first. */
    events: z.array(PrEvent),
  })
  .meta({ id: "PullRequest" });
export type PullRequest = z.infer<typeof PullRequest>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getPullRequest: {
    method: "GET",
    path: "/repos/{repo}/pulls/{number}",
    summary: "A pull request with reviewers, checks and activity",
    params: z.object({ repo: z.string(), number: z.string() }),
    response: PullRequest,
  },
  mergePullRequest: {
    method: "POST",
    path: "/repos/{repo}/pulls/{number}/merge",
    summary: "Squash and merge",
    params: z.object({ repo: z.string(), number: z.string() }),
  },
});

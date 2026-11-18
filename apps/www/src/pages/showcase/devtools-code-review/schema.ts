// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ReviewTone = z.enum(["blue", "orange", "teal", "violet", "rose", "amber", "emerald", "sky"]);
export type ReviewTone = z.infer<typeof ReviewTone>;

export const ReviewPerson = z.object({ id: z.string(), name: z.string(), tone: ReviewTone }).meta({ id: "ReviewPerson" });
export type ReviewPerson = z.infer<typeof ReviewPerson>;

export const DiffFile = z
  .object({
    path: z.string(),
    status: z.enum(["added", "modified", "deleted"]),
    /** Unified-diff hunks; each line starts with " ", "+" or "-". */
    hunks: z.array(z.object({ header: z.string(), oldStart: z.number().int(), newStart: z.number().int(), lines: z.string() })),
  })
  .meta({ id: "DiffFile" });
export type DiffFile = z.infer<typeof DiffFile>;

export const ReviewComment = z.object({ id: z.string(), author: z.string(), body: z.string(), /** ISO timestamp. */ createdAt: z.string() }).meta({ id: "ReviewComment" });
export type ReviewComment = z.infer<typeof ReviewComment>;

export const ReviewThread = z
  .object({ id: z.string(), file: z.string(), line: z.number().int(), side: z.enum(["new", "old"]), resolved: z.boolean().optional(), comments: z.array(ReviewComment) })
  .meta({ id: "ReviewThread" });
export type ReviewThread = z.infer<typeof ReviewThread>;

export const PullRequest = z
  .object({
    number: z.number().int(),
    title: z.string(),
    author: z.string(),
    base: z.string(),
    head: z.string(),
    commits: z.number().int(),
    checks: z.object({ passed: z.number().int(), total: z.number().int() }),
    /** Requested reviewer ids. */
    reviewers: z.array(z.string()),
  })
  .meta({ id: "PullRequest" });
export type PullRequest = z.infer<typeof PullRequest>;

export const ReviewVerdict = z.enum(["comment", "approve", "changes"]);
export type ReviewVerdict = z.infer<typeof ReviewVerdict>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getPullRequest: { method: "GET", path: "/pulls/{number}", summary: "The pull request", params: z.object({ number: z.string() }), response: PullRequest },
  listPullFiles: { method: "GET", path: "/pulls/{number}/files", summary: "Changed files with their hunks", params: z.object({ number: z.string() }), response: z.array(DiffFile) },
  listReviewThreads: { method: "GET", path: "/pulls/{number}/threads", summary: "Line comment threads", params: z.object({ number: z.string() }), response: z.array(ReviewThread) },
  createReviewThread: { method: "POST", path: "/pulls/{number}/threads", summary: "Comment on a line", params: z.object({ number: z.string() }), body: z.object({ file: z.string(), line: z.number().int(), side: z.enum(["new", "old"]), body: z.string().min(1) }) },
  replyToThread: { method: "POST", path: "/threads/{id}/comments", summary: "Reply to a thread", params: z.object({ id: z.string() }), body: z.object({ body: z.string().min(1) }) },
  setThreadResolved: { method: "PUT", path: "/threads/{id}/resolved", summary: "Resolve or reopen a thread", params: z.object({ id: z.string() }), body: z.object({ resolved: z.boolean() }) },
  setFileViewed: { method: "PUT", path: "/pulls/{number}/viewed", summary: "Mark a file viewed or not", params: z.object({ number: z.string() }), body: z.object({ path: z.string(), viewed: z.boolean() }) },
  submitReview: { method: "POST", path: "/pulls/{number}/reviews", summary: "Submit a review", params: z.object({ number: z.string() }), body: z.object({ verdict: ReviewVerdict, summary: z.string() }) },
});

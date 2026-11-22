// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

const Base = { id: z.string(), at: z.string() };

export const DiffSnippet = z
  .object({
    file: z.string(),
    line: z.number().int(),
    lines: z.array(
      z.object({
        kind: z.enum(["context", "add", "del"]),
        n: z.number().int(),
        text: z.string(),
      })
    ),
  })
  .meta({ id: "DiffSnippet" });

export const PrTimelineItem = z
  .discriminatedUnion("kind", [
    z.object({
      ...Base,
      kind: z.literal("commit"),
      actor: z.string(),
      commits: z.array(z.object({ sha: z.string(), message: z.string() })),
    }),
    z.object({
      ...Base,
      kind: z.literal("comment"),
      actor: z.string(),
      body: z.string(),
      diff: DiffSnippet.optional(),
    }),
    z.object({
      ...Base,
      kind: z.literal("review"),
      actor: z.string(),
      state: z.enum(["approved", "changes", "commented"]),
      summary: z.string().optional(),
    }),
    z.object({
      ...Base,
      kind: z.literal("ci"),
      passed: z.number().int(),
      total: z.number().int(),
      durationMs: z.number().nonnegative(),
    }),
    z.object({
      ...Base,
      kind: z.literal("deploy"),
      env: z.string(),
      url: z.string(),
      durationMs: z.number().nonnegative(),
    }),
    z.object({
      ...Base,
      kind: z.literal("status"),
      actor: z.string(),
      label: z.string(),
    }),
  ])
  .meta({ id: "PrTimelineItem" });
export type PrTimelineItem = z.infer<typeof PrTimelineItem>;

export const PullRequestDetail = z
  .object({
    number: z.number().int(),
    repo: z.string(),
    title: z.string(),
    state: z.enum(["open", "draft", "merged", "closed"]),
    author: z.string(),
    head: z.string(),
    base: z.string(),
    /** The description; blank lines separate paragraphs. */
    body: z.string(),
    /** Bullet points under the description. */
    highlights: z.array(z.string()).optional(),
    commits: z.number().int().nonnegative(),
    files: z.number().int().nonnegative(),
    additions: z.number().int().nonnegative(),
    deletions: z.number().int().nonnegative(),
    requiredApprovals: z.number().int().nonnegative(),
    conflicts: z.boolean(),
    upToDate: z.boolean(),
    reviewers: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        state: z.enum(["approved", "changes", "pending"]),
        note: z.string().optional(),
      })
    ),
    checks: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        context: z.string(),
        status: z.enum(["passed", "failed", "running", "skipped"]),
        durationMs: z.number().nonnegative().optional(),
      })
    ),
    /** Oldest first. */
    timeline: z.array(PrTimelineItem),
    labels: z.array(
      z.object({
        name: z.string(),
        tone: z.enum(["violet", "amber", "sky", "rose", "emerald"]),
      })
    ),
    linkedIssues: z.array(
      z.object({
        number: z.number().int(),
        title: z.string(),
        href: z.string().optional(),
      })
    ),
    milestone: z
      .object({
        title: z.string(),
        done: z.number().int(),
        total: z.number().int(),
        dueAt: z.string().optional(),
      })
      .optional(),
  })
  .meta({ id: "PullRequestDetail" });
export type PullRequestDetail = z.infer<typeof PullRequestDetail>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getPullRequestDetail: {
    method: "GET",
    path: "/repos/{repo}/pulls/{number}",
    summary: "A pull request with its checks, reviewers and timeline",
    params: z.object({ repo: z.string(), number: z.string() }),
    response: PullRequestDetail,
  },
  squashMerge: {
    method: "POST",
    path: "/repos/{repo}/pulls/{number}/merge",
    summary: "Squash and merge",
    params: z.object({ repo: z.string(), number: z.string() }),
  },
});

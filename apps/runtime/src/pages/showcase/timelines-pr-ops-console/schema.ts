// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const CiCheck = z
  .object({
    id: z.string(),
    /** Picks the app badge. */
    app: z.enum(["github", "vercel", "mintlify", "linear", "snyk", "other"]),
    name: z.string(),
    status: z.enum(["failed", "skipped", "passed"]),
    /** One line from the check, e.g. "Successful in 14s". */
    summary: z.string(),
    required: z.boolean().optional(),
    /** Where its logs live. */
    detailsHref: z.string().optional(),
  })
  .meta({ id: "CiCheck" });
export type CiCheck = z.infer<typeof CiCheck>;

export const PrChecks = z
  .object({
    number: z.number().int(),
    title: z.string(),
    author: z.string(),
    head: z.string(),
    base: z.string(),
    commits: z.number().int().nonnegative(),
    draft: z.boolean(),
    /** The branch is behind its base. */
    behind: z.boolean(),
    /** Who the update's merge commit is attributed to. */
    mergeAuthorEmail: z.string().optional(),
    checks: z.array(CiCheck),
  })
  .meta({ id: "PrChecks" });
export type PrChecks = z.infer<typeof PrChecks>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getPrChecks: {
    method: "GET",
    path: "/repos/{repo}/pulls/{number}/checks",
    summary: "A pull request's checks and merge state",
    params: z.object({ repo: z.string(), number: z.string() }),
    response: PrChecks,
  },
  updateBranch: {
    method: "POST",
    path: "/repos/{repo}/pulls/{number}/update-branch",
    summary: "Merge the base branch into the pull request",
    params: z.object({ repo: z.string(), number: z.string() }),
  },
  markReadyForReview: {
    method: "POST",
    path: "/repos/{repo}/pulls/{number}/ready",
    summary: "Take the pull request out of draft",
    params: z.object({ repo: z.string(), number: z.string() }),
  },
  mergePr: {
    method: "POST",
    path: "/repos/{repo}/pulls/{number}/merge",
    summary: "Squash and merge",
    params: z.object({ repo: z.string(), number: z.string() }),
  },
});

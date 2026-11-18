// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Commit = z
  .object({
    sha: z.string(),
    /** Parent SHAs; two or more makes it a merge. */
    parents: z.array(z.string()),
    /** The column it's drawn in, 0 for the main line. */
    lane: z.number().int().nonnegative(),
    author: z.string(),
    message: z.string(),
    /** The area it touched, e.g. "billing/audit". */
    scope: z.string().optional(),
    /** When it was committed (ISO 8601). */
    at: z.string(),
    filesChanged: z.number().int().nonnegative().optional(),
    additions: z.number().int().nonnegative().optional(),
    deletions: z.number().int().nonnegative().optional(),
    tag: z.string().optional(),
  })
  .meta({ id: "Commit" });
export type Commit = z.infer<typeof Commit>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listCommits: { method: "GET", path: "/repos/{repo}/commits", summary: "Recent commits on a branch, newest first, with graph lanes", params: z.object({ repo: z.string() }), response: z.array(Commit) },
});

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ResolvedThread = z
  .object({
    id: z.string(),
    author: z.object({ name: z.string() }),
    /** When the thread was started (ISO). */
    createdAt: z.string(),
    /** The first comment. */
    preview: z.string(),
    resolvedBy: z.object({ name: z.string() }),
    replyCount: z.number().int().min(0),
  })
  .meta({ id: "ResolvedThread" });
export type ResolvedThread = z.infer<typeof ResolvedThread>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listResolvedThreads: { method: "GET", path: "/threads", summary: "Resolved threads, newest first, and how many are still open", response: z.object({ threads: z.array(ResolvedThread), openCount: z.number().int().min(0) }) },
  reopenThread: { method: "POST", path: "/threads/{id}/reopen", summary: "Reopen a resolved thread", params: z.object({ id: z.string() }) },
});

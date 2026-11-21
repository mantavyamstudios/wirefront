// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ActivityEvent = z
  .object({
    id: z.string(),
    actor: z.string(),
    /** What they did, e.g. "commented on". */
    verb: z.string(),
    context: z.string().optional(),
    /** Picks the icon and colour. */
    kind: z.enum(["ship", "complete", "comment", "design", "invite", "commit", "reaction", "merge", "other"]),
    /** When it happened (ISO 8601). */
    at: z.string(),
    /** A short extra, e.g. "v3.4.0 → production". */
    meta: z.string().optional(),
  })
  .meta({ id: "ActivityEvent" });
export type ActivityEvent = z.infer<typeof ActivityEvent>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listActivity: {
    method: "GET",
    path: "/activity",
    summary: "Workspace activity, newest first; pass the last id for older events",
    query: z.object({ before: z.string().optional() }),
    response: z.object({ events: z.array(ActivityEvent), hasMore: z.boolean() }),
  },
});

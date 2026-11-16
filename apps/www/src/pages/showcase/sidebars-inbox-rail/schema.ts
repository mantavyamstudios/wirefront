// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const InboxThread = z
  .object({
    id: z.string(),
    from: z.object({ name: z.string(), avatarUrl: z.url().optional() }),
    /** One of the eight category colours, for the avatar. */
    color: z.int().min(1).max(8),
    preview: z.string(),
    at: z.iso.datetime(),
    unread: z.boolean(),
  })
  .meta({ id: "InboxThread" });
export type InboxThread = z.infer<typeof InboxThread>;

export const InboxFilter = z.enum(["unread", "all", "mentions"]).meta({ id: "InboxFilter" });
export type InboxFilter = z.infer<typeof InboxFilter>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listThreads: {
    method: "GET",
    path: "/inbox/threads",
    summary: "Threads for a filter, with the unread count",
    query: z.object({ filter: InboxFilter }),
    response: z.object({ items: z.array(InboxThread), unread: z.int().min(0) }),
  },
  archiveRead: { method: "POST", path: "/inbox/archive-read", summary: "Archive every read thread" },
});

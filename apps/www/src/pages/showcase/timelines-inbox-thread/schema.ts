// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ThreadMessage = z
  .object({
    id: z.string(),
    from: z.object({ name: z.string(), email: z.string() }),
    /** When it was sent (ISO 8601). */
    at: z.string(),
    body: z.string(),
    /** A line quoted from an earlier message. */
    quoted: z.string().optional(),
    attachments: z.array(z.object({ id: z.string(), name: z.string(), bytes: z.number().int().nonnegative(), href: z.string().optional() })).optional(),
  })
  .meta({ id: "ThreadMessage" });
export type ThreadMessage = z.infer<typeof ThreadMessage>;

export const Thread = z
  .object({ id: z.string(), subject: z.string(), labels: z.array(z.string()), starred: z.boolean(), messages: z.array(ThreadMessage) })
  .meta({ id: "Thread" });
export type Thread = z.infer<typeof Thread>;

export const ReplyInput = z.object({ body: z.string().trim().min(1, "Write a reply first.") }).meta({ id: "ReplyInput" });
export type ReplyInput = z.infer<typeof ReplyInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getThread: { method: "GET", path: "/threads/{id}", summary: "A thread and its messages, oldest first", params: z.object({ id: z.string() }), response: Thread },
  starThread: { method: "PUT", path: "/threads/{id}/star", summary: "Star or unstar a thread", params: z.object({ id: z.string() }), body: z.object({ starred: z.boolean() }) },
  replyToThread: { method: "POST", path: "/threads/{id}/messages", summary: "Send a reply to everyone on the thread", params: z.object({ id: z.string() }), body: ReplyInput },
  saveReplyDraft: { method: "PUT", path: "/threads/{id}/draft", summary: "Save the reply as a draft", params: z.object({ id: z.string() }), body: z.object({ body: z.string() }) },
});

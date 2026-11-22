// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ThreadComment = z
  .object({
    id: z.string(),
    author: z.object({ name: z.string() }),
    /** ISO timestamp. */ createdAt: z.string(),
    body: z.string(),
  })
  .meta({ id: "ThreadComment" });
export type ThreadComment = z.infer<typeof ThreadComment>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listThreadComments: {
    method: "GET",
    path: "/threads/{id}/comments",
    summary: "Comments on an anchored thread",
    params: z.object({ id: z.string() }),
    response: z.array(ThreadComment),
  },
  replyToThread: {
    method: "POST",
    path: "/threads/{id}/comments",
    summary: "Add a reply",
    params: z.object({ id: z.string() }),
    body: z.object({ body: z.string().min(1) }),
    response: ThreadComment,
  },
  resolveThread: {
    method: "POST",
    path: "/threads/{id}/resolve",
    summary: "Mark the thread resolved",
    params: z.object({ id: z.string() }),
  },
});

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const RowReaction = z.object({ emoji: z.string(), count: z.number().int().min(0), mine: z.boolean().optional() }).meta({ id: "RowReaction" });
export type RowReaction = z.infer<typeof RowReaction>;

export const Comment = z
  .object({
    id: z.string(),
    author: z.object({ name: z.string() }),
    /** ISO timestamp. */
    createdAt: z.string(),
    /** Set when the comment was edited. */
    editedAt: z.string().optional(),
    /** Plain text; `code` and @mentions are highlighted. */
    body: z.string(),
    reactions: z.array(RowReaction),
    replyCount: z.number().int().min(0),
  })
  .meta({ id: "Comment" });
export type Comment = z.infer<typeof Comment>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listComments: { method: "GET", path: "/comments", summary: "Comments in a discussion", response: z.array(Comment) },
  setCommentReaction: { method: "PUT", path: "/comments/{commentId}/reactions/{emoji}", summary: "Add or remove the user's reaction", params: z.object({ commentId: z.string(), emoji: z.string() }), body: z.object({ mine: z.boolean() }) },
  deleteComment: { method: "DELETE", path: "/comments/{id}", summary: "Delete a comment", params: z.object({ id: z.string() }) },
});

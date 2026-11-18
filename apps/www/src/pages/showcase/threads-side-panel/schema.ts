// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Reaction = z.object({ emoji: z.string(), count: z.number().int().min(0), /** Whether the signed-in user reacted. */ mine: z.boolean().optional() }).meta({ id: "Reaction" });
export type Reaction = z.infer<typeof Reaction>;

export const PanelComment = z
  .object({ id: z.string(), author: z.object({ name: z.string() }), /** ISO timestamp. */ createdAt: z.string(), /** Plain text; `code` and @mentions are highlighted. */ body: z.string(), reactions: z.array(Reaction).optional() })
  .meta({ id: "PanelComment" });
export type PanelComment = z.infer<typeof PanelComment>;

export const Conversation = z.object({ id: z.string(), subject: z.string(), subscribed: z.boolean(), comments: z.array(PanelComment) }).meta({ id: "Conversation" });
export type Conversation = z.infer<typeof Conversation>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getConversation: { method: "GET", path: "/conversations/{id}", summary: "A conversation and its replies", params: z.object({ id: z.string() }), response: Conversation },
  replyToConversation: { method: "POST", path: "/conversations/{id}/comments", summary: "Add a reply", params: z.object({ id: z.string() }), body: z.object({ body: z.string().min(1) }), response: PanelComment },
  setReaction: { method: "PUT", path: "/comments/{commentId}/reactions/{emoji}", summary: "Add or remove the user's reaction", params: z.object({ commentId: z.string(), emoji: z.string() }), body: z.object({ mine: z.boolean() }) },
  setSubscribed: { method: "PUT", path: "/conversations/{id}/subscription", summary: "Follow or unfollow the conversation", params: z.object({ id: z.string() }), body: z.object({ subscribed: z.boolean() }) },
});

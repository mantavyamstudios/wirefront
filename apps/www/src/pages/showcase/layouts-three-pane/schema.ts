// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

const Color = z.int().min(1).max(8);

export const ChatWorkspaceSummary = z.object({ id: z.string(), name: z.string(), color: Color }).meta({ id: "ChatWorkspaceSummary" });
export type ChatWorkspaceSummary = z.infer<typeof ChatWorkspaceSummary>;

export const ChatChannel = z
  .object({ id: z.string(), name: z.string(), topic: z.string().optional(), unread: z.boolean(), memberCount: z.int().min(0) })
  .meta({ id: "ChatChannel" });
export type ChatChannel = z.infer<typeof ChatChannel>;

export const ChatDirect = z
  .object({ id: z.string(), name: z.string(), presence: z.enum(["online", "away", "offline"]), unread: z.int().min(0) })
  .meta({ id: "ChatDirect" });
export type ChatDirect = z.infer<typeof ChatDirect>;

export const ChatMessage = z
  .object({
    id: z.string(),
    author: z.object({ name: z.string(), color: Color }),
    at: z.iso.datetime(),
    body: z.string(),
    /** Present when the message has a thread. */
    thread: z.object({ replies: z.int().min(1), lastReplyAt: z.iso.datetime() }).optional(),
  })
  .meta({ id: "ChatMessage" });
export type ChatMessage = z.infer<typeof ChatMessage>;

export const SendChatInput = z.object({ channelId: z.string(), body: z.string().trim().min(1).max(4000) }).meta({ id: "SendChatInput" });
export type SendChatInput = z.infer<typeof SendChatInput>;

/** The backend operations this screen calls. New messages can also arrive over a stream. */
export const api = defineApi({
  listChannels: {
    method: "GET",
    path: "/workspaces/{id}/sidebar",
    summary: "A workspace's channels and direct messages",
    params: z.object({ id: z.string() }),
    response: z.object({ channels: z.array(ChatChannel), directs: z.array(ChatDirect), memberCount: z.int().min(0) }),
  },
  listMessages: { method: "GET", path: "/channels/{id}/messages", summary: "Recent messages in a channel, oldest first", params: z.object({ id: z.string() }), response: z.array(ChatMessage) },
  sendMessage: { method: "POST", path: "/channels/{channelId}/messages", summary: "Post a message", params: z.object({ channelId: z.string() }), body: SendChatInput.pick({ body: true }) },
});

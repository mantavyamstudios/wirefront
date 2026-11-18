// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ChatTone = z.enum(["blue", "orange", "teal", "violet", "rose", "amber", "emerald", "sky"]);
export type ChatTone = z.infer<typeof ChatTone>;

export const ChatPerson = z.object({ id: z.string(), name: z.string(), tone: ChatTone, title: z.string().optional(), presence: z.enum(["active", "away", "offline"]).optional() }).meta({ id: "ChatPerson" });
export type ChatPerson = z.infer<typeof ChatPerson>;

export const ChatReaction = z.object({ emoji: z.string(), /** Person ids. */ people: z.array(z.string()) }).meta({ id: "ChatReaction" });
export type ChatReaction = z.infer<typeof ChatReaction>;

export const ChatReply = z
  .object({ id: z.string(), author: z.string(), /** ISO timestamp. */ sentAt: z.string(), /** Plain text; `code`, **bold**, _italic_ and @first-name mentions are styled. */ text: z.string(), reactions: z.array(ChatReaction).optional(), saved: z.boolean().optional() })
  .meta({ id: "ChatReply" });
export type ChatReply = z.infer<typeof ChatReply>;

export const ChatFile = z.object({ name: z.string(), /** e.g. "2.4 MB". */ size: z.string(), pages: z.number().int().optional() }).meta({ id: "ChatFile" });
export type ChatFile = z.infer<typeof ChatFile>;

export const ChatMessage = ChatReply.extend({ replies: z.array(ChatReply).optional(), file: ChatFile.optional() }).meta({ id: "ChatMessage" });
export type ChatMessage = z.infer<typeof ChatMessage>;

export const ChatChannel = z
  .object({
    id: z.string(),
    name: z.string(),
    kind: z.enum(["channel", "dm"]),
    /** The other person in a direct message. */
    with: z.string().optional(),
    topic: z.string().optional(),
    private: z.boolean().optional(),
    unread: z.number().int().optional(),
    mentions: z.number().int().optional(),
    muted: z.boolean().optional(),
    members: z.number().int().optional(),
    /** Pinned message ids. */
    pinned: z.array(z.string()).optional(),
    messages: z.array(ChatMessage),
  })
  .meta({ id: "ChatChannel" });
export type ChatChannel = z.infer<typeof ChatChannel>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listChannels: { method: "GET", path: "/chat/channels", summary: "Channels and direct messages with recent messages", response: z.array(ChatChannel) },
  sendChatMessage: { method: "POST", path: "/chat/channels/{channelId}/messages", summary: "Post a message (multipart when a file is attached)", params: z.object({ channelId: z.string() }), body: z.object({ text: z.string() }), response: ChatMessage },
  replyInThread: { method: "POST", path: "/chat/channels/{channelId}/messages/{messageId}/replies", summary: "Reply in a thread", params: z.object({ channelId: z.string(), messageId: z.string() }), body: z.object({ text: z.string().min(1) }), response: ChatReply },
  createChannel: { method: "POST", path: "/chat/channels", summary: "Create a channel", body: z.object({ name: z.string().min(1) }), response: ChatChannel },
  openDirectMessage: { method: "POST", path: "/chat/dms", summary: "Open a direct message with someone", body: z.object({ personId: z.string() }), response: ChatChannel },
});

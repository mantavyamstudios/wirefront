// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const MailMessage = z
  .object({
    id: z.string(),
    from: z.object({ name: z.string(), email: z.email().optional() }),
    /** One of the eight category colours, for the avatar. */
    color: z.int().min(1).max(8),
    subject: z.string(),
    preview: z.string(),
    /** The full text, paragraphs separated by blank lines. Load it when the message opens. */
    body: z.string().optional(),
    at: z.iso.datetime(),
    unread: z.boolean(),
  })
  .meta({ id: "MailMessage" });
export type MailMessage = z.infer<typeof MailMessage>;

export const MailFilter = z.enum(["all", "unread", "mentions"]).meta({ id: "MailFilter" });
export type MailFilter = z.infer<typeof MailFilter>;

export const MailReply = z.object({ messageId: z.string(), body: z.string().trim().min(1, "Write a reply first.") }).meta({ id: "MailReply" });
export type MailReply = z.infer<typeof MailReply>;

const ById = z.object({ id: z.string() });

/** The backend operations this screen calls. */
export const api = defineApi({
  listMessages: {
    method: "GET",
    path: "/mail",
    summary: "Messages for a filter and search, with the unread count",
    query: z.object({ filter: MailFilter, search: z.string().optional() }),
    response: z.object({ items: z.array(MailMessage), unread: z.int().min(0) }),
  },
  getMessage: { method: "GET", path: "/mail/{id}", summary: "One message with its body", params: ById, response: MailMessage },
  archiveMessage: { method: "POST", path: "/mail/{id}/archive", summary: "Archive a message", params: ById },
  deleteMessage: { method: "DELETE", path: "/mail/{id}", summary: "Delete a message", params: ById },
  replyToMessage: { method: "POST", path: "/mail/{id}/replies", summary: "Reply to a message", params: ById, body: MailReply.pick({ body: true }) },
});

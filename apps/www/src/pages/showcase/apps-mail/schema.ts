// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const MailTone = z.enum(["blue", "orange", "teal", "violet", "rose", "amber", "emerald", "sky"]);
export type MailTone = z.infer<typeof MailTone>;
export const MailFolder = z.enum(["inbox", "starred", "snoozed", "sent", "drafts", "archive", "trash"]);
export type MailFolder = z.infer<typeof MailFolder>;

export const MailPerson = z.object({ name: z.string(), email: z.string(), tone: MailTone.optional() }).meta({ id: "MailPerson" });
export type MailPerson = z.infer<typeof MailPerson>;

export const MailAttachment = z.object({ name: z.string(), /** e.g. "184 KB". */ size: z.string(), kind: z.enum(["pdf", "sheet", "image", "doc"]) }).meta({ id: "MailAttachment" });
export type MailAttachment = z.infer<typeof MailAttachment>;

export const MailMessage = z
  .object({ id: z.string(), from: MailPerson, /** e.g. "to me, Priya". */ to: z.string(), /** ISO timestamp. */ sentAt: z.string(), body: z.array(z.string()), attachments: z.array(MailAttachment).optional() })
  .meta({ id: "MailMessage" });
export type MailMessage = z.infer<typeof MailMessage>;

export const MailThread = z
  .object({ id: z.string(), subject: z.string(), folder: MailFolder.exclude(["starred"]), labels: z.array(z.string()).optional(), unread: z.boolean().optional(), starred: z.boolean().optional(), messages: z.array(MailMessage) })
  .meta({ id: "MailThread" });
export type MailThread = z.infer<typeof MailThread>;

export const MailLabel = z.object({ id: z.string(), name: z.string(), tone: MailTone }).meta({ id: "MailLabel" });
export type MailLabel = z.infer<typeof MailLabel>;

export const ThreadPatch = z.object({ folder: MailFolder.exclude(["starred"]).optional(), starred: z.boolean().optional(), unread: z.boolean().optional() }).meta({ id: "ThreadPatch" });
export type ThreadPatch = z.infer<typeof ThreadPatch>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listThreads: { method: "GET", path: "/mail/threads", summary: "Conversations in every folder", response: z.array(MailThread) },
  listLabels: { method: "GET", path: "/mail/labels", summary: "Labels", response: z.array(MailLabel) },
  updateThread: { method: "PATCH", path: "/mail/threads/{id}", summary: "Move, star or mark a conversation", params: z.object({ id: z.string() }), body: ThreadPatch },
  replyToThread: { method: "POST", path: "/mail/threads/{id}/replies", summary: "Reply to a conversation (multipart, with attachments)", params: z.object({ id: z.string() }), body: z.object({ body: z.string() }), response: MailMessage },
  sendMail: { method: "POST", path: "/mail/messages", summary: "Send a new message (multipart, with attachments)", body: z.object({ to: z.string().min(1), subject: z.string(), body: z.string() }), response: MailThread },
});

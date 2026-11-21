// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Attachment = z.object({ id: z.string(), name: z.string() }).meta({ id: "Attachment" });
export type Attachment = z.infer<typeof Attachment>;

export const ReplyTarget = z.object({ name: z.string(), /** ISO timestamp of the comment being answered. */ createdAt: z.string() }).meta({ id: "ReplyTarget" });
export type ReplyTarget = z.infer<typeof ReplyTarget>;

/** The backend operations this screen calls. */
export const api = defineApi({
  uploadAttachment: { method: "POST", path: "/attachments", summary: "Upload a file to attach to a reply", response: Attachment },
  postReply: { method: "POST", path: "/threads/{id}/comments", summary: "Post a markdown reply with attachments", params: z.object({ id: z.string() }), body: z.object({ body: z.string().min(1), attachmentIds: z.array(z.string()) }) },
});

// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ShareRole = z
  .enum(["owner", "editor", "viewer"])
  .meta({ id: "ShareRole" });
export type ShareRole = z.infer<typeof ShareRole>;

/** What anyone with the link can do. */
export const LinkAccess = z
  .enum(["restricted", "view", "edit"])
  .meta({ id: "LinkAccess" });
export type LinkAccess = z.infer<typeof LinkAccess>;

export const ShareMember = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    role: ShareRole,
  })
  .meta({ id: "ShareMember" });
export type ShareMember = z.infer<typeof ShareMember>;

export const ShareInviteInput = z
  .object({
    emails: z
      .array(z.email("One of those isn’t an email address."))
      .min(1, "Add at least one email."),
    role: ShareRole.exclude(["owner"]),
  })
  .meta({ id: "ShareInviteInput" });
export type ShareInviteInput = z.infer<typeof ShareInviteInput>;

export const ShareRoleChange = z
  .object({ memberId: z.string(), role: ShareRole.exclude(["owner"]) })
  .meta({ id: "ShareRoleChange" });
export type ShareRoleChange = z.infer<typeof ShareRoleChange>;

const DocParams = z.object({ documentId: z.string() });

/** The backend operations this screen calls. */
export const api = defineApi({
  listAccess: {
    method: "GET",
    path: "/documents/{documentId}/access",
    summary: "Who has access, and what the link allows",
    params: DocParams,
    response: z.object({
      members: z.array(ShareMember),
      linkAccess: LinkAccess,
      linkUrl: z.url(),
    }),
  },
  invite: {
    method: "POST",
    path: "/documents/{documentId}/access",
    summary: "Give people access by email",
    params: DocParams,
    body: ShareInviteInput,
  },
  changeRole: {
    method: "PATCH",
    path: "/documents/{documentId}/access/{memberId}",
    summary: "Change someone's role",
    params: DocParams.extend({ memberId: z.string() }),
    body: ShareRoleChange.pick({ role: true }),
  },
  removeAccess: {
    method: "DELETE",
    path: "/documents/{documentId}/access/{memberId}",
    summary: "Remove someone's access",
    params: DocParams.extend({ memberId: z.string() }),
  },
  setLinkAccess: {
    method: "PUT",
    path: "/documents/{documentId}/link-access",
    summary: "Change what anyone with the link can do",
    params: DocParams,
    body: z.object({ linkAccess: LinkAccess }),
  },
});

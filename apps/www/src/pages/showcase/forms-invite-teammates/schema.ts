// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const InviteRole = z.enum(["admin", "member", "viewer"]).meta({ id: "InviteRole" });
export type InviteRole = z.infer<typeof InviteRole>;

export const Invitation = z.object({ email: z.email(), role: InviteRole }).meta({ id: "Invitation" });
export type Invitation = z.infer<typeof Invitation>;

/** What "Send invites" submits: valid addresses outside the auto-join domain, and an optional note. */
export const SendInvitesInput = z
  .object({
    invitations: z.array(Invitation).min(1, "Add at least one email address."),
    message: z.string().trim().max(500).optional(),
  })
  .meta({ id: "SendInvitesInput" });
export type SendInvitesInput = z.infer<typeof SendInvitesInput>;

export const SendInvitesResult = z.object({ sent: z.int().min(0) }).meta({ id: "SendInvitesResult" });
export type SendInvitesResult = z.infer<typeof SendInvitesResult>;

/** The backend operations this screen calls. */
export const api = defineApi({
  sendInvites: {
    method: "POST",
    path: "/members/invitations/bulk",
    summary: "Email an invitation to each address; skips people already in the workspace",
    body: SendInvitesInput,
    response: SendInvitesResult,
    errors: { 429: "Too many invitations; try again later" },
  },
});

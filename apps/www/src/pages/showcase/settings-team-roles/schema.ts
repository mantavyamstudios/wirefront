// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const TeamHue = z.enum(["amber", "rose", "violet", "teal", "sky", "emerald", "indigo", "orange"]).meta({ id: "TeamHue" });
export type TeamHue = z.infer<typeof TeamHue>;

export const PermissionArea = z
  .object({ id: z.string(), name: z.string(), permissions: z.array(z.object({ id: z.string(), label: z.string() })) })
  .meta({ id: "PermissionArea" });
export type PermissionArea = z.infer<typeof PermissionArea>;

export const TeamRole = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    /** The owner role: can't be edited or assigned. */
    locked: z.boolean().optional(),
    /** For a custom role, the role it was duplicated from (members fall back to it if it's deleted). */
    from: z.string().optional(),
    /** Permission ids this role grants. */
    grants: z.array(z.string()),
  })
  .meta({ id: "TeamRole" });
export type TeamRole = z.infer<typeof TeamRole>;

export const TeamMember = z
  .object({ id: z.string(), name: z.string(), email: z.email(), roleId: z.string(), hue: TeamHue, lastActiveAt: z.iso.datetime().nullable() })
  .meta({ id: "TeamMember" });
export type TeamMember = z.infer<typeof TeamMember>;

export const TeamInvite = z
  .object({ id: z.string(), email: z.email(), roleId: z.string(), invitedBy: z.string(), sentAt: z.iso.datetime() })
  .meta({ id: "TeamInvite" });
export type TeamInvite = z.infer<typeof TeamInvite>;

export const TeamData = z
  .object({
    areas: z.array(PermissionArea),
    roles: z.array(TeamRole),
    members: z.array(TeamMember),
    invites: z.array(TeamInvite),
    currentUserId: z.string(),
  })
  .meta({ id: "TeamData" });
export type TeamData = z.infer<typeof TeamData>;

export const InviteInput = z
  .object({ email: z.email("Enter a full email address, like name@company.com."), roleId: z.string() })
  .meta({ id: "TeamInviteInput" });
export type InviteInput = z.infer<typeof InviteInput>;

/** The full role set the save bar commits. New custom roles have ids starting "new-". */
export const SaveRolesInput = z.array(TeamRole.omit({ locked: true })).meta({ id: "SaveRolesInput" });
export type SaveRolesInput = z.infer<typeof SaveRolesInput>;

const IdParams = z.object({ id: z.string() });

/** The backend operations this screen calls. */
export const api = defineApi({
  getTeam: { method: "GET", path: "/workspace/team", summary: "Members, invites, roles and permissions", response: TeamData },
  invite: { method: "POST", path: "/workspace/invites", summary: "Invite someone with a role", body: InviteInput, response: TeamInvite, errors: { 409: "Already a member or invited" } },
  resendInvite: { method: "POST", path: "/workspace/invites/{id}/resend", summary: "Send the invite email again", params: IdParams },
  revokeInvite: { method: "DELETE", path: "/workspace/invites/{id}", summary: "Cancel an invite", params: IdParams },
  changeRole: { method: "PATCH", path: "/workspace/members/{id}", summary: "Change a member's role", params: IdParams, body: z.object({ roleId: z.string() }) },
  removeMember: { method: "DELETE", path: "/workspace/members/{id}", summary: "Remove a member", params: IdParams },
  saveRoles: {
    method: "PUT",
    path: "/workspace/roles",
    summary: "Replace the role set; members of a deleted custom role move to the role it came from",
    body: SaveRolesInput,
  },
});

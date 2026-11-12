// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Role = z.enum(["owner", "admin", "member", "viewer"]).meta({ id: "Role" });
export type Role = z.infer<typeof Role>;

/** Roles that can be given to someone. Ownership moves with a transfer, never a role change. */
export const AssignableRole = Role.exclude(["owner"]).meta({ id: "AssignableRole" });
export type AssignableRole = z.infer<typeof AssignableRole>;

export const Member = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    avatarUrl: z.url().optional(),
    role: Role,
    team: z.string().optional(),
    /** ISO 8601; null when they have never signed in. */
    lastActiveAt: z.iso.datetime().nullable(),
    twoFactor: z.boolean(),
    /** "invited" until they accept the invitation. */
    status: z.enum(["active", "invited"]),
  })
  .meta({ id: "Member" });
export type Member = z.infer<typeof Member>;

/** The list request, as query string parameters. */
export const MembersQuery = z
  .object({
    page: z.int().min(1),
    pageSize: z.int().min(1).max(100),
    search: z.string().optional(),
    sort: z.enum(["name", "lastActiveAt"]).optional(),
    direction: z.enum(["asc", "desc"]).optional(),
    role: Role.optional(),
  })
  .meta({ id: "MembersQuery" });
export type MembersQuery = z.infer<typeof MembersQuery>;

export const MembersPage = z
  .object({
    items: z.array(Member),
    /** Matching members across all pages. */
    total: z.int().min(0),
  })
  .meta({ id: "MembersPage" });
export type MembersPage = z.infer<typeof MembersPage>;

/** What the invite dialog submits. */
export const InviteInput = z
  .object({
    email: z.email("Enter a valid email address."),
    role: AssignableRole,
  })
  .meta({ id: "InviteInput" });
export type InviteInput = z.infer<typeof InviteInput>;

export const RoleUpdate = z.object({ role: AssignableRole }).meta({ id: "RoleUpdate" });
export type RoleUpdate = z.infer<typeof RoleUpdate>;

const MemberParams = z.object({ id: z.string() });

/** The backend operations this screen calls. */
export const api = defineApi({
  listMembers: {
    method: "GET",
    path: "/members",
    summary: "List workspace members, filtered, sorted and paginated",
    query: MembersQuery,
    response: MembersPage,
  },
  inviteMember: {
    method: "POST",
    path: "/members/invitations",
    summary: "Invite someone by email",
    body: InviteInput,
    response: Member,
    errors: { 409: "They're already a member or invited" },
  },
  updateMemberRole: {
    method: "PATCH",
    path: "/members/{id}",
    summary: "Change a member's role",
    params: MemberParams,
    body: RoleUpdate,
    response: Member,
    errors: { 403: "You can't change this member's role" },
  },
  removeMember: {
    method: "DELETE",
    path: "/members/{id}",
    summary: "Remove a member or revoke an invitation",
    params: MemberParams,
    errors: { 403: "You can't remove this member" },
  },
  transferOwnership: {
    method: "POST",
    path: "/members/{id}/transfer-ownership",
    summary: "Make this member the owner",
    params: MemberParams,
    errors: { 403: "Only the owner can transfer ownership" },
  },
});

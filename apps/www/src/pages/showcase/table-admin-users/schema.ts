// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const AdminRole = z.enum(["owner", "admin", "member", "viewer", "billing"]).meta({ id: "AdminRole" });
export type AdminRole = z.infer<typeof AdminRole>;

/** Roles that can be given to someone. Ownership is never handed out from this screen. */
export const AssignableAdminRole = AdminRole.exclude(["owner"]).meta({ id: "AssignableAdminRole" });
export type AssignableAdminRole = z.infer<typeof AssignableAdminRole>;

/** Roles an invitation can carry. */
export const InviteAdminRole = z.enum(["admin", "member", "viewer"]).meta({ id: "InviteAdminRole" });
export type InviteAdminRole = z.infer<typeof InviteAdminRole>;

export const AdminStatus = z.enum(["active", "invited", "suspended"]).meta({ id: "AdminStatus" });
export type AdminStatus = z.infer<typeof AdminStatus>;

export const AdminUser = z
  .object({
    id: z.string(),
    /** Empty until an invited person joins. */
    name: z.string(),
    email: z.email(),
    role: AdminRole,
    status: AdminStatus,
    twoFactor: z.boolean(),
    teams: z.array(z.string()),
    /** ISO 8601; null when they have never signed in. */
    lastActiveAt: z.iso.datetime().nullable(),
    /** When they joined, or when the invitation was sent for invited people. */
    joinedAt: z.iso.datetime(),
    location: z.string().optional(),
  })
  .meta({ id: "AdminUser" });
export type AdminUser = z.infer<typeof AdminUser>;

/** Org-wide numbers for the overview strip and the status tabs. */
export const AdminSummary = z
  .object({
    seats: z.int().min(0),
    /** Seats taken: everyone but viewers and suspended people. */
    seatsUsed: z.int().min(0),
    counts: z.object({ all: z.int(), active: z.int(), invited: z.int(), suspended: z.int() }),
    /** Active people without two-factor authentication. */
    activeWithoutTwoFactor: z.int().min(0),
  })
  .meta({ id: "AdminSummary" });
export type AdminSummary = z.infer<typeof AdminSummary>;

/** The list request, as query string parameters. `role` may repeat. */
export const AdminUsersQuery = z
  .object({
    page: z.int().min(1),
    pageSize: z.int().min(1).max(100),
    search: z.string().optional(),
    sort: z.enum(["name", "lastActiveAt"]).optional(),
    direction: z.enum(["asc", "desc"]).optional(),
    status: AdminStatus.optional(),
    role: z.array(AdminRole).optional(),
    twoFactor: z.literal("off").optional(),
  })
  .meta({ id: "AdminUsersQuery" });
export type AdminUsersQuery = z.infer<typeof AdminUsersQuery>;

export const AdminUsersPage = z
  .object({ items: z.array(AdminUser), total: z.int().min(0), summary: AdminSummary })
  .meta({ id: "AdminUsersPage" });
export type AdminUsersPage = z.infer<typeof AdminUsersPage>;

export const AdminActivityKind = z.enum(["signin", "role", "key", "join", "invite", "suspend", "2fa"]).meta({ id: "AdminActivityKind" });
export type AdminActivityKind = z.infer<typeof AdminActivityKind>;

export const AdminUserDetails = z
  .object({
    devices: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        kind: z.enum(["desktop", "mobile"]),
        location: z.string().optional(),
        lastActiveAt: z.iso.datetime(),
        current: z.boolean(),
      }),
    ),
    /** Newest first; `text` is the event as your audit log words it. */
    activity: z.array(z.object({ id: z.string(), kind: AdminActivityKind, text: z.string(), at: z.iso.datetime() })),
  })
  .meta({ id: "AdminUserDetails" });
export type AdminUserDetails = z.infer<typeof AdminUserDetails>;

export const InviteMembersInput = z
  .object({ emails: z.array(z.email()).min(1, "Add at least one email address."), role: InviteAdminRole })
  .meta({ id: "InviteMembersInput" });
export type InviteMembersInput = z.infer<typeof InviteMembersInput>;

export const RoleChangeInput = z.object({ ids: z.array(z.string()).min(1), role: AssignableAdminRole }).meta({ id: "RoleChangeInput" });
export type RoleChangeInput = z.infer<typeof RoleChangeInput>;

/** The people a bulk action applies to. */
const MemberIds = z.object({ ids: z.array(z.string()).min(1) }).meta({ id: "MemberIds" });

/** The backend operations this screen calls. */
export const api = defineApi({
  listUsers: {
    method: "GET",
    path: "/org/members",
    summary: "List org members, filtered, sorted and paginated, with org-wide counts",
    query: AdminUsersQuery,
    response: AdminUsersPage,
  },
  getUserDetails: {
    method: "GET",
    path: "/org/members/{id}/details",
    summary: "A member's signed-in devices and recent activity",
    params: z.object({ id: z.string() }),
    response: AdminUserDetails,
  },
  inviteMembers: {
    method: "POST",
    path: "/org/members/invitations",
    summary: "Invite people by email",
    body: InviteMembersInput,
    errors: { 402: "Not enough seats", 409: "Someone is already a member or invited" },
  },
  changeRoles: { method: "POST", path: "/org/members/role", summary: "Change the role of one or more members", body: RoleChangeInput },
  suspendMembers: { method: "POST", path: "/org/members/suspend", summary: "Suspend members and sign out their sessions", body: MemberIds },
  reactivateMembers: { method: "POST", path: "/org/members/reactivate", summary: "Reactivate suspended members", body: MemberIds },
  resendInvites: { method: "POST", path: "/org/members/invitations/resend", summary: "Resend pending invitations", body: MemberIds },
  removeMembers: { method: "POST", path: "/org/members/remove", summary: "Remove members or revoke invitations", body: MemberIds },
});

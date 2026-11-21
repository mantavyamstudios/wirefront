// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { TeamData, TeamInvite } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-09-20T12:00:00.000Z";
export const product = "Ridgeline";

const areas: TeamData["areas"] = [
  { id: "projects", name: "Projects", permissions: [
    { id: "projects.view", label: "View projects" },
    { id: "projects.edit", label: "Create and edit projects" },
    { id: "projects.delete", label: "Delete projects" },
    { id: "projects.access", label: "Manage project access" },
  ] },
  { id: "billing", name: "Billing", permissions: [
    { id: "billing.view", label: "View invoices and usage" },
    { id: "billing.manage", label: "Change plan and payment" },
  ] },
  { id: "members", name: "Members", permissions: [
    { id: "members.invite", label: "Invite people" },
    { id: "members.roles", label: "Change roles" },
    { id: "members.remove", label: "Remove people" },
  ] },
  { id: "settings", name: "Settings", permissions: [
    { id: "settings.edit", label: "Edit workspace settings" },
    { id: "settings.keys", label: "Manage API keys" },
    { id: "settings.audit", label: "Export the audit log" },
  ] },
];
const all = areas.flatMap((a) => a.permissions.map((p) => p.id));
const ago = (minutes: number) => new Date(Date.parse(now) - minutes * 60_000).toISOString();

/** What the mocks return for `getTeam`. */
export const getTeam: TeamData = {
  areas,
  roles: [
    { id: "viewer", name: "Viewer", description: "Can look around, can’t change anything", grants: ["projects.view", "billing.view"] },
    { id: "member", name: "Member", description: "Creates and ships projects", grants: ["projects.view", "projects.edit", "members.invite", "settings.keys"] },
    { id: "admin", name: "Admin", description: "Everything except the plan and payment", grants: all.filter((id) => id !== "billing.manage") },
    { id: "owner", name: "Owner", description: "Full control of the workspace", locked: true, grants: all },
  ],
  members: [
    { id: "m1", name: "Ada Lindqvist", email: "ada@ridgeline.app", roleId: "owner", hue: "violet", lastActiveAt: ago(0) },
    { id: "m2", name: "Theo Marsh", email: "theo@ridgeline.app", roleId: "admin", hue: "sky", lastActiveAt: ago(12) },
    { id: "m3", name: "Priya Raman", email: "priya@ridgeline.app", roleId: "admin", hue: "teal", lastActiveAt: ago(120) },
    { id: "m4", name: "Jonah Feld", email: "jonah@ridgeline.app", roleId: "member", hue: "amber", lastActiveAt: ago(1440) },
    { id: "m5", name: "Inès Duarte", email: "ines@ridgeline.app", roleId: "member", hue: "rose", lastActiveAt: ago(180) },
    { id: "m6", name: "Kofi Mensah", email: "kofi@ridgeline.app", roleId: "member", hue: "emerald", lastActiveAt: ago(5760) },
    { id: "m7", name: "Sara Whitlock", email: "sara@ridgeline.app", roleId: "viewer", hue: "orange", lastActiveAt: ago(10080) },
    { id: "m8", name: "Ren Takahashi", email: "ren@pinefold.co", roleId: "viewer", hue: "indigo", lastActiveAt: ago(20160) },
  ],
  invites: [
    { id: "i1", email: "lucas@ridgeline.app", roleId: "member", invitedBy: "Theo", sentAt: ago(2880) },
    { id: "i2", email: "nadia@ordinal.studio", roleId: "viewer", invitedBy: "Ada", sentAt: ago(8640) },
  ],
  currentUserId: "m1",
};

/** What the mocks return for `invite`. */
export const invite: TeamInvite = { id: "i_new", email: "sam@ridgeline.app", roleId: "member", invitedBy: "Ada", sentAt: now };

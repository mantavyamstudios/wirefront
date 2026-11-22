// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type {
  CapabilityGroup,
  PermissionMatrix,
  PermissionRole,
} from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
const roles: PermissionRole[] = [
  {
    id: "owner",
    name: "Owner",
    members: 2,
    description: "Full control, including billing and deletion.",
    category: 4,
    locked: true,
  },
  {
    id: "admin",
    name: "Admin",
    members: 6,
    description: "Manage members, settings, and integrations.",
    category: 3,
  },
  {
    id: "editor",
    name: "Editor",
    members: 24,
    description: "Create and edit content. No member or billing access.",
    category: 2,
  },
  {
    id: "viewer",
    name: "Viewer",
    members: 41,
    description: "Read-only access to documents and dashboards.",
    category: 1,
  },
  {
    id: "guest",
    name: "Guest",
    members: 13,
    description: "Limited, time-bound access to specific resources.",
  },
];

const groups: CapabilityGroup[] = [
  {
    id: "documents",
    label: "Documents",
    capabilities: [
      {
        id: "doc.view",
        label: "View documents",
        hint: "Read pages, comments, and attachments.",
        grants: {
          owner: "yes",
          admin: "yes",
          editor: "yes",
          viewer: "yes",
          guest: "yes",
        },
      },
      {
        id: "doc.create",
        label: "Create documents",
        grants: {
          owner: "yes",
          admin: "yes",
          editor: "yes",
          viewer: "no",
          guest: "no",
        },
      },
      {
        id: "doc.edit",
        label: "Edit documents",
        grants: {
          owner: "yes",
          admin: "yes",
          editor: "yes",
          viewer: "no",
          guest: "no",
        },
      },
      {
        id: "doc.delete",
        label: "Delete documents",
        hint: "Soft-delete with 30-day recovery.",
        grants: {
          owner: "yes",
          admin: "yes",
          editor: "no",
          viewer: "no",
          guest: "no",
        },
      },
      {
        id: "doc.share",
        label: "Share externally",
        grants: {
          owner: "yes",
          admin: "yes",
          editor: "yes",
          viewer: "no",
          guest: "no",
        },
      },
    ],
  },
  {
    id: "members",
    label: "Members",
    capabilities: [
      {
        id: "mem.invite",
        label: "Invite members",
        grants: {
          owner: "yes",
          admin: "yes",
          editor: "no",
          viewer: "no",
          guest: "na",
        },
      },
      {
        id: "mem.remove",
        label: "Remove members",
        grants: {
          owner: "yes",
          admin: "yes",
          editor: "no",
          viewer: "no",
          guest: "na",
        },
      },
      {
        id: "mem.role",
        label: "Change member role",
        hint: "Cannot promote above own role.",
        grants: {
          owner: "yes",
          admin: "yes",
          editor: "no",
          viewer: "no",
          guest: "na",
        },
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    capabilities: [
      {
        id: "bill.view",
        label: "View invoices",
        grants: {
          owner: "yes",
          admin: "yes",
          editor: "no",
          viewer: "no",
          guest: "na",
        },
      },
      {
        id: "bill.plan",
        label: "Change plan",
        grants: {
          owner: "yes",
          admin: "no",
          editor: "no",
          viewer: "no",
          guest: "na",
        },
      },
      {
        id: "bill.pay",
        label: "Manage payment methods",
        grants: {
          owner: "yes",
          admin: "no",
          editor: "no",
          viewer: "no",
          guest: "na",
        },
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    capabilities: [
      {
        id: "adm.audit",
        label: "Audit log access",
        hint: "Read-only access to workspace events.",
        grants: {
          owner: "yes",
          admin: "yes",
          editor: "no",
          viewer: "no",
          guest: "na",
        },
      },
      {
        id: "adm.sso",
        label: "SSO configuration",
        grants: {
          owner: "yes",
          admin: "no",
          editor: "no",
          viewer: "no",
          guest: "na",
        },
      },
      {
        id: "adm.delete",
        label: "Workspace deletion",
        hint: "Permanent. Requires 2FA.",
        grants: {
          owner: "yes",
          admin: "no",
          editor: "no",
          viewer: "no",
          guest: "na",
        },
      },
    ],
  },
];

export const getPermissions: PermissionMatrix = { roles, groups };

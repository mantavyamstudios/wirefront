// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** "na" marks a capability that doesn't apply to a role (it can't be granted). */
export const Grant = z.enum(["yes", "no", "na"]).meta({ id: "Grant" });
export type Grant = z.infer<typeof Grant>;

export const PermissionRole = z
  .object({
    id: z.string(),
    name: z.string(),
    members: z.number().int().nonnegative(),
    description: z.string(),
    /** Badge colour from the category palette (1–8). */
    category: z.number().int().min(1).max(8).optional(),
    /** Built-in roles that can't be edited, e.g. Owner. */
    locked: z.boolean().optional(),
  })
  .meta({ id: "PermissionRole" });
export type PermissionRole = z.infer<typeof PermissionRole>;

export const Capability = z
  .object({
    id: z.string(),
    label: z.string(),
    hint: z.string().optional(),
    /** Keyed by role id. */
    grants: z.record(z.string(), Grant),
  })
  .meta({ id: "Capability" });
export type Capability = z.infer<typeof Capability>;

export const CapabilityGroup = z
  .object({
    id: z.string(),
    label: z.string(),
    capabilities: z.array(Capability),
  })
  .meta({ id: "CapabilityGroup" });
export type CapabilityGroup = z.infer<typeof CapabilityGroup>;

export const PermissionMatrix = z
  .object({ roles: z.array(PermissionRole), groups: z.array(CapabilityGroup) })
  .meta({ id: "PermissionMatrix" });
export type PermissionMatrix = z.infer<typeof PermissionMatrix>;

export const SetGrantInput = z
  .object({
    roleId: z.string(),
    capabilityId: z.string(),
    allowed: z.boolean(),
  })
  .meta({ id: "SetGrantInput" });
export type SetGrantInput = z.infer<typeof SetGrantInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getPermissions: {
    method: "GET",
    path: "/workspace/permissions",
    summary: "Roles and what each can do",
    response: PermissionMatrix,
  },
  setGrant: {
    method: "PUT",
    path: "/workspace/roles/{roleId}/capabilities/{capabilityId}",
    summary: "Allow or deny a capability for a role",
    params: z.object({ roleId: z.string(), capabilityId: z.string() }),
    body: SetGrantInput.pick({ allowed: true }),
    errors: { 403: "Only owners can change this role" },
  },
});

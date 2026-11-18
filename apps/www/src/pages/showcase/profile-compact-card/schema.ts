// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Permission = z.enum(["owner", "admin", "member", "viewer"]);
export type Permission = z.infer<typeof Permission>;

export const RosterMember = z
  .object({
    id: z.string(),
    name: z.string(),
    handle: z.string(),
    email: z.string(),
    /** Their team or function, e.g. "Engineering". */
    team: z.string().optional(),
    presence: z.enum(["online", "away", "dnd", "off"]),
    customStatus: z.string().optional(),
    permission: Permission,
    /** When they were last active (ISO 8601). */
    lastActiveAt: z.string(),
  })
  .meta({ id: "RosterMember" });
export type RosterMember = z.infer<typeof RosterMember>;

export const Roster = z.object({ members: z.array(RosterMember), total: z.number().int() }).meta({ id: "Roster" });
export type Roster = z.infer<typeof Roster>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listRoster: { method: "GET", path: "/workspace/members", summary: "Workspace members with presence", response: Roster },
  setPermission: { method: "PUT", path: "/workspace/members/{id}/permission", summary: "Change a member's permission", params: z.object({ id: z.string() }), body: z.object({ permission: Permission }) },
  removeRosterMember: { method: "DELETE", path: "/workspace/members/{id}", summary: "Remove someone from the workspace", params: z.object({ id: z.string() }) },
});

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Presence = z.enum(["online", "idle", "dnd", "offline"]);
export type Presence = z.infer<typeof Presence>;

export const PresencePerson = z
  .object({
    id: z.string(),
    name: z.string(),
    presence: Presence,
    /** What they're doing, e.g. "in a call · ends 14:30". */
    activity: z.string().optional(),
    activityKind: z.enum(["call", "music", "other"]).optional(),
    avatarUrl: z.string().optional(),
  })
  .meta({ id: "PresencePerson" });
export type PresencePerson = z.infer<typeof PresencePerson>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listPresence: { method: "GET", path: "/presence", summary: "Everyone's presence in the workspace", response: z.array(PresencePerson) },
  setMyPresence: { method: "PUT", path: "/me/presence", summary: "Set do not disturb on or off", body: z.object({ presence: Presence }) },
});

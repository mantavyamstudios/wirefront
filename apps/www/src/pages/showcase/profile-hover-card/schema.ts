// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const PersonSummary = z
  .object({
    id: z.string(),
    name: z.string(),
    handle: z.string(),
    pronouns: z.string().optional(),
    verified: z.boolean().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
    location: z.string().optional(),
    /** When they joined (ISO date). */
    joinedAt: z.string().optional(),
    following: z.number().int(),
    followers: z.number().int(),
    /** People the viewer follows who follow them. */
    mutuals: z.object({ names: z.array(z.string()), more: z.number().int() }).optional(),
    /** Whether the viewer follows them. */
    isFollowing: z.boolean(),
  })
  .meta({ id: "PersonSummary" });
export type PersonSummary = z.infer<typeof PersonSummary>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getPersonSummary: { method: "GET", path: "/people/{id}/summary", summary: "What a profile hover card shows", params: z.object({ id: z.string() }), response: PersonSummary },
  followPerson: { method: "PUT", path: "/people/{id}/follow", summary: "Follow or unfollow", params: z.object({ id: z.string() }), body: z.object({ following: z.boolean() }) },
});

// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const PublicProfile = z
  .object({
    name: z.string(),
    handle: z.string(),
    /** e.g. "Engineering at Acme". */
    headline: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
    location: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
    /** When they joined (ISO date). */
    joinedAt: z.string(),
    tags: z.array(z.string()),
    stats: z.object({ following: z.number().int(), followers: z.number().int(), posts: z.number().int(), stars: z.number().int() }),
    /** Whether the viewer follows them. */
    following: z.boolean(),
    projects: z.array(z.object({ id: z.string(), name: z.string(), language: z.string(), stars: z.number().int(), forks: z.number().int(), blurb: z.string(), href: z.string().optional() })),
    activity: z.array(z.object({ id: z.string(), verb: z.string(), target: z.string(), at: z.string() })),
  })
  .meta({ id: "PublicProfile" });
export type PublicProfile = z.infer<typeof PublicProfile>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getProfile: { method: "GET", path: "/people/{handle}", summary: "A public profile with projects and recent activity", params: z.object({ handle: z.string() }), response: PublicProfile },
  setFollow: { method: "PUT", path: "/people/{handle}/follow", summary: "Follow or unfollow", params: z.object({ handle: z.string() }), body: z.object({ following: z.boolean() }) },
});

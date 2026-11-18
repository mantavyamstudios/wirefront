// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Suggestion = z
  .object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    city: z.string().optional(),
    followers: z.number().int().nonnegative(),
    /** Why they're suggested; picks the badge colour and icon. */
    reason: z.enum(["shared", "team", "topic", "repo"]),
    /** The reason in words, e.g. "Followed by Maya Okafor". */
    context: z.string(),
    /** Names of mutual connections. */
    mutuals: z.array(z.string()),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
    following: z.boolean(),
  })
  .meta({ id: "Suggestion" });
export type Suggestion = z.infer<typeof Suggestion>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listSuggestions: { method: "GET", path: "/suggestions/people", summary: "People the viewer may know", response: z.array(Suggestion) },
  followSuggestion: { method: "PUT", path: "/people/{id}/follow", summary: "Follow or unfollow", params: z.object({ id: z.string() }), body: z.object({ following: z.boolean() }) },
  dismissSuggestion: { method: "POST", path: "/suggestions/people/{id}/dismiss", summary: "Stop suggesting someone", params: z.object({ id: z.string() }) },
});

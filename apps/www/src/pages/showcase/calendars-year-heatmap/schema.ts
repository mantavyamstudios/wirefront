// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ContributionProfile = z
  .object({ login: z.string(), name: z.string().optional(), avatarUrl: z.string().optional(), bio: z.string().optional(), repos: z.number().int().nonnegative(), followers: z.number().int().nonnegative(), href: z.string().optional() })
  .meta({ id: "ContributionProfile" });

export const ContributionYear = z
  .object({
    profile: ContributionProfile,
    /** One entry per calendar day, oldest first, as YYYY-MM-DD. */
    days: z.array(z.object({ date: z.string(), count: z.number().int().nonnegative() })),
    /** Recent commits, newest first. */
    commits: z.array(z.object({ sha: z.string(), message: z.string(), repo: z.string(), at: z.string(), href: z.string().optional() })),
  })
  .meta({ id: "ContributionYear" });
export type ContributionYear = z.infer<typeof ContributionYear>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getContributions: { method: "GET", path: "/users/{login}/contributions", summary: "A user's daily contributions for the last year and recent commits", params: z.object({ login: z.string() }), response: ContributionYear },
});

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ProfileStat = z
  .object({
    label: z.string(),
    value: z.number(),
    /** Shown after the number, formatted for the locale. */
    unit: z.enum(["day", "hour", "percent"]).optional(),
  })
  .meta({ id: "ProfileStat" });
export type ProfileStat = z.infer<typeof ProfileStat>;

export const ProfileSummary = z
  .object({
    id: z.string(),
    name: z.string(),
    avatarUrl: z.url().optional(),
    /** e.g. "Senior Engineer · Platform team". */
    headline: z.string().optional(),
    /** e.g. "PRO". */
    badge: z.string().optional(),
    location: z.string().optional(),
    email: z.email().optional(),
    stats: z.array(ProfileStat).max(4),
  })
  .meta({ id: "ProfileSummary" });
export type ProfileSummary = z.infer<typeof ProfileSummary>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getProfileSummary: { method: "GET", path: "/people/{id}/summary", summary: "A person's card", params: z.object({ id: z.string() }), response: ProfileSummary },
});

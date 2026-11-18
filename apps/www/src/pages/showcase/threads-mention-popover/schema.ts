// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Mentionable = z.object({ id: z.string(), name: z.string(), handle: z.string(), team: z.string().optional() }).meta({ id: "Mentionable" });
export type Mentionable = z.infer<typeof Mentionable>;

export const MentionGroup = z.object({ handle: z.string(), /** e.g. "5 people · Engineering team". */ description: z.string() }).meta({ id: "MentionGroup" });
export type MentionGroup = z.infer<typeof MentionGroup>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listMentionables: { method: "GET", path: "/mentions", summary: "People and groups that can be mentioned", response: z.object({ members: z.array(Mentionable), groups: z.array(MentionGroup) }) },
});

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Skill = z
  .object({
    id: z.string(),
    name: z.string(),
    /** Self-rated proficiency, 1–5. */
    level: z.number().int().min(1).max(5),
    category: z.string(),
    endorsements: z.number().int().nonnegative(),
    /** Names of a few endorsers, for the avatars. */
    endorsers: z.array(z.string()),
    /** Whether the viewer has endorsed it. */
    endorsedByMe: z.boolean(),
  })
  .meta({ id: "Skill" });
export type Skill = z.infer<typeof Skill>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listSkills: { method: "GET", path: "/people/{id}/skills", summary: "A person's skills and endorsements", params: z.object({ id: z.string() }), response: z.array(Skill) },
  endorseSkill: { method: "PUT", path: "/skills/{id}/endorsement", summary: "Endorse or un-endorse a skill", params: z.object({ id: z.string() }), body: z.object({ endorsed: z.boolean() }) },
});

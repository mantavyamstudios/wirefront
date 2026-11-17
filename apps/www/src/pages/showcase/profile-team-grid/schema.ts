// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Teammate = z
  .object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    /** Groups the grid, e.g. "Engineering". */
    department: z.string(),
    city: z.string().optional(),
    presence: z.enum(["online", "away", "off"]),
    pronouns: z.string().optional(),
    bio: z.string().optional(),
    email: z.string().optional(),
    avatarUrl: z.string().optional(),
    profileHref: z.string().optional(),
  })
  .meta({ id: "Teammate" });
export type Teammate = z.infer<typeof Teammate>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listTeammates: { method: "GET", path: "/team", summary: "Everyone on the team, in display order", response: z.array(Teammate) },
});

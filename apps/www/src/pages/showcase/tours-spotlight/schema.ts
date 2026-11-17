// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const SpotlightStep = z
  .object({
    id: z.string(),
    /** Matches data-tour="…" on the element to highlight. */
    target: z.string(),
    title: z.string(),
    body: z.string(),
    /** A shortcut shown beside the title on devices with a keyboard. */
    kbd: z.string().optional(),
  })
  .meta({ id: "SpotlightStep" });
export type SpotlightStep = z.infer<typeof SpotlightStep>;

/** The backend operations this screen calls. */
export const api = defineApi({
  completeSpotlightTour: { method: "POST", path: "/me/tours/{id}/complete", summary: "Remember that the user finished or closed a tour", params: z.object({ id: z.string() }), body: z.object({ finished: z.boolean() }) },
});

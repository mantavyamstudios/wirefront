// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const TourStep = z.object({ id: z.string(), badge: z.string(), title: z.string(), body: z.string() }).meta({ id: "TourStep" });
export type TourStep = z.infer<typeof TourStep>;

/** The backend operations this screen calls. */
export const api = defineApi({
  completeTour: { method: "POST", path: "/me/tours/{id}/complete", summary: "Remember that the user finished or skipped a tour", params: z.object({ id: z.string() }), body: z.object({ finished: z.boolean() }) },
});

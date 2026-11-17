// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const TooltipStep = z
  .object({ id: z.string(), /** Matches data-tour="…" on the element to point at. */ target: z.string(), title: z.string(), body: z.string() })
  .meta({ id: "TooltipStep" });
export type TooltipStep = z.infer<typeof TooltipStep>;

/** The backend operations this screen calls. */
export const api = defineApi({
  completeTooltipTour: { method: "POST", path: "/me/tours/{id}/complete", summary: "Remember that the user finished or closed the tips", params: z.object({ id: z.string() }), body: z.object({ finished: z.boolean() }) },
});

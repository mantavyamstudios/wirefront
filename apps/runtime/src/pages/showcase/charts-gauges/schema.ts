// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Objective = z
  .object({
    id: z.string(),
    name: z.string(),
    value: z.number(),
    target: z.number(),
    /** Shown after the numbers, e.g. "%" or "ms". */
    unit: z.string(),
    /** "higher" when more is better (uptime); "lower" when less is (latency). */
    direction: z.enum(["higher", "lower"]),
    /** The top of the gauge. Defaults to 100. */
    max: z.number().positive().optional(),
    detail: z.string().optional(),
  })
  .meta({ id: "Objective" });
export type Objective = z.infer<typeof Objective>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listObjectives: { method: "GET", path: "/slos", summary: "Service-level objectives with their current values", response: z.array(Objective) },
});

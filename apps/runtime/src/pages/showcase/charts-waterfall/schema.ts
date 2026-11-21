// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Movement = z
  .object({
    /** Where the period started, e.g. { label: "Q4 ARR", value: 1640000 }. */
    start: z.object({ label: z.string(), value: z.number() }),
    /** What moved it, in order; positive adds, negative takes away. */
    steps: z.array(z.object({ id: z.string(), label: z.string(), value: z.number() })),
    /** The label for where it ended; the value is start plus every step. */
    endLabel: z.string(),
  })
  .meta({ id: "Movement" });
export type Movement = z.infer<typeof Movement>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getArrMovement: { method: "GET", path: "/reports/arr-movement", summary: "How ARR moved from last quarter to this one", response: Movement },
});

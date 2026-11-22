// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const MiniEvent = z
  .object({
    id: z.string(),
    title: z.string(),
    /** ISO 8601 date-time. */
    start: z.string(),
    color: z.enum(["indigo", "teal", "amber", "rose", "violet", "sky"]),
  })
  .meta({ id: "MiniEvent" });
export type MiniEvent = z.infer<typeof MiniEvent>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listMiniEvents: {
    method: "GET",
    path: "/calendar/events",
    summary: "Events in a month, for the dots",
    query: z.object({ month: z.string() }),
    response: z.array(MiniEvent),
  },
});

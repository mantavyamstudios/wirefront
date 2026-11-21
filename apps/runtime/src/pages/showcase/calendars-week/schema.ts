// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const TimedEvent = z
  .object({
    id: z.string(),
    title: z.string(),
    /** ISO 8601 date-time. */
    start: z.string(),
    /** ISO 8601 date-time. */
    end: z.string(),
    color: z.enum(["indigo", "teal", "amber", "rose", "violet", "sky"]),
    attendees: z.number().int().nonnegative().optional(),
  })
  .meta({ id: "TimedEvent" });
export type TimedEvent = z.infer<typeof TimedEvent>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listWeekEvents: { method: "GET", path: "/calendar/events", summary: "Timed events in a week", query: z.object({ weekStart: z.string() }), response: z.array(TimedEvent) },
});

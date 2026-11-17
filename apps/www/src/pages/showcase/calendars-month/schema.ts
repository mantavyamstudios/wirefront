// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const CalendarEvent = z
  .object({
    id: z.string(),
    title: z.string(),
    /** First day, as YYYY-MM-DD. */
    start: z.string(),
    /** Last day (inclusive) for multi-day events, as YYYY-MM-DD. */
    end: z.string().optional(),
    color: z.enum(["indigo", "teal", "amber", "rose", "violet", "sky"]),
  })
  .meta({ id: "CalendarEvent" });
export type CalendarEvent = z.infer<typeof CalendarEvent>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listMonthEvents: { method: "GET", path: "/calendar/events", summary: "Events overlapping a month", query: z.object({ month: z.string() }), response: z.array(CalendarEvent) },
});

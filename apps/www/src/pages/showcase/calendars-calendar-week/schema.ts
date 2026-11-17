// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const CalendarTone = z.enum(["teal", "violet", "sky", "amber", "rose"]);
export type CalendarTone = z.infer<typeof CalendarTone>;

export const CalendarSource = z
  .object({ id: z.string(), name: z.string(), tone: CalendarTone, visible: z.boolean().optional(), readOnly: z.boolean().optional() })
  .meta({ id: "CalendarSource" });
export type CalendarSource = z.infer<typeof CalendarSource>;

export const WeekEvent = z
  .object({
    id: z.string(),
    title: z.string(),
    /** The id of its calendar. */
    calendar: z.string(),
    /** The day, as YYYY-MM-DD. */
    date: z.string(),
    /** Minutes from midnight. */
    start: z.number().int().min(0).max(1440),
    end: z.number().int().min(0).max(1440),
    allDay: z.boolean().optional(),
    /** All-day events: how many days it spans. */
    days: z.number().int().min(1).optional(),
    location: z.string().optional(),
    /** A video-call link. */
    videoUrl: z.string().optional(),
    people: z.array(z.string()).optional(),
  })
  .meta({ id: "WeekEvent" });
export type WeekEvent = z.infer<typeof WeekEvent>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listCalendars: { method: "GET", path: "/calendars", summary: "The user's calendars", response: z.array(CalendarSource) },
  listEvents: { method: "GET", path: "/calendar/events", summary: "Events around the shown weeks", query: z.object({ from: z.string(), to: z.string() }), response: z.array(WeekEvent) },
  saveEvent: { method: "PUT", path: "/calendar/events/{id}", summary: "Create or update an event; returns it with its saved id", params: z.object({ id: z.string() }), body: WeekEvent, response: WeekEvent },
  deleteEvent: { method: "DELETE", path: "/calendar/events/{id}", summary: "Delete an event", params: z.object({ id: z.string() }) },
});

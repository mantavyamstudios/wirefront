// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const AgendaEvent = z
  .object({
    id: z.string(),
    title: z.string(),
    /** ISO 8601 date-time. */
    start: z.string(),
    end: z.string(),
    location: z.string().optional(),
    /** A video call rather than a place. */
    online: z.boolean().optional(),
    detail: z.string().optional(),
    color: z.enum(["indigo", "teal", "amber", "rose", "violet"]),
    attendees: z.array(z.string()),
  })
  .meta({ id: "AgendaEvent" });
export type AgendaEvent = z.infer<typeof AgendaEvent>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listAgenda: { method: "GET", path: "/calendar/agenda", summary: "Events for today and tomorrow, in order", response: z.array(AgendaEvent) },
});

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const UpcomingEvent = z
  .object({
    id: z.string(),
    title: z.string(),
    blurb: z.string().optional(),
    startsAt: z.iso.datetime(),
    endsAt: z.iso.datetime(),
    location: z.string(),
    /** A video call link; shown as "Join" while the event is on. */
    joinUrl: z.url().optional(),
    attendees: z.array(z.object({ id: z.string(), name: z.string() })),
    /** The signed-in user's answer so far. */
    response: z.enum(["accepted", "declined", "pending"]),
  })
  .meta({ id: "UpcomingEvent" });
export type UpcomingEvent = z.infer<typeof UpcomingEvent>;

export const RsvpInput = z.object({ eventId: z.string(), response: z.enum(["accepted", "declined"]) }).meta({ id: "RsvpInput" });
export type RsvpInput = z.infer<typeof RsvpInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listUpcomingEvents: { method: "GET", path: "/me/events/upcoming", summary: "The next events on the user's calendar", response: z.array(UpcomingEvent) },
  rsvp: { method: "PUT", path: "/events/{eventId}/rsvp", summary: "Accept or decline an event", params: z.object({ eventId: z.string() }), body: RsvpInput.pick({ response: true }) },
});

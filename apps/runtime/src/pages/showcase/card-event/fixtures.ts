// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { UpcomingEvent } from "./schema";

/** The demo's clock: the platform weekly is on now. */
export const now = "2026-04-25T14:10:00Z";

const people = (...names: string[]) =>
  names.map((name) => ({ id: name.toLowerCase().replace(/\s+/g, "-"), name }));

/** What the mocks return for `listUpcomingEvents`. Demo data for the showcase and tests. */
export const listUpcomingEvents: UpcomingEvent[] = [
  {
    id: "weekly-sync",
    title: "Platform weekly",
    blurb: "Standing engineering sync.",
    startsAt: "2026-04-25T14:00:00Z",
    endsAt: "2026-04-25T14:30:00Z",
    location: "Video call",
    joinUrl: "https://meet.example.com/platform-weekly",
    attendees: people("Lina Rodrigues", "Marco Kim", "Priya Joshi"),
    response: "accepted",
  },
  {
    id: "kickoff",
    title: "Q2 kickoff",
    blurb: "Org-wide goals & roadmap review.",
    startsAt: "2026-04-29T10:00:00Z",
    endsAt: "2026-04-29T11:30:00Z",
    location: "Main hall, 3F",
    attendees: people(
      "Lina Rodrigues",
      "Marco Kim",
      "Priya Joshi",
      "Sam Chen",
      "Ana Bell",
      "Tom Grey"
    ),
    response: "pending",
  },
  {
    id: "design-crit",
    title: "Design critique",
    blurb: "Friday review of in-flight surfaces.",
    startsAt: "2026-05-02T16:00:00Z",
    endsAt: "2026-05-02T17:00:00Z",
    location: "Studio",
    attendees: people("Priya Joshi", "Ana Bell"),
    response: "pending",
  },
];

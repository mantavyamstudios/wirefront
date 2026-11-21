// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { TimedEvent } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-27T09:30:00Z";
export const weekStart = "2026-04-27";

export const listWeekEvents: TimedEvent[] = [
  { id: "w1", title: "Eng standup", start: "2026-04-27T08:00:00Z", end: "2026-04-27T08:30:00Z", color: "indigo" },
  { id: "w2", title: "1:1 Maya", start: "2026-04-27T09:30:00Z", end: "2026-04-27T10:30:00Z", color: "amber" },
  { id: "w3", title: "Design crit", start: "2026-04-27T12:00:00Z", end: "2026-04-27T13:30:00Z", color: "rose", attendees: 6 },
  { id: "w4", title: "Q2 planning", start: "2026-04-28T09:00:00Z", end: "2026-04-28T09:45:00Z", color: "violet" },
  { id: "w5", title: "BigCorp call", start: "2026-04-28T11:00:00Z", end: "2026-04-28T12:00:00Z", color: "teal" },
  { id: "w6", title: "Riya · sync", start: "2026-04-28T11:00:00Z", end: "2026-04-28T12:00:00Z", color: "sky" },
  { id: "w7", title: "Eng standup", start: "2026-04-29T08:00:00Z", end: "2026-04-29T08:30:00Z", color: "indigo" },
  { id: "w8", title: "Audit log review", start: "2026-04-29T10:00:00Z", end: "2026-04-29T11:00:00Z", color: "violet", attendees: 4 },
  { id: "w9", title: "Lunch w/ Riya", start: "2026-04-29T14:00:00Z", end: "2026-04-29T15:00:00Z", color: "amber" },
  { id: "w10", title: "Sales review", start: "2026-04-30T08:30:00Z", end: "2026-04-30T09:30:00Z", color: "teal" },
  { id: "w11", title: "Sprint demo", start: "2026-04-30T11:00:00Z", end: "2026-04-30T12:30:00Z", color: "rose", attendees: 12 },
  { id: "w12", title: "Eng standup", start: "2026-05-01T08:00:00Z", end: "2026-05-01T08:30:00Z", color: "indigo" },
  { id: "w13", title: "Roadmap", start: "2026-05-01T09:00:00Z", end: "2026-05-01T10:30:00Z", color: "violet" },
  { id: "w14", title: "AMA", start: "2026-05-01T13:00:00Z", end: "2026-05-01T14:00:00Z", color: "sky", attendees: 32 },
];

// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { AgendaEvent } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-25T07:00:00Z";

export const listAgenda: AgendaEvent[] = [
  { id: "a1", title: "Eng standup", start: "2026-04-25T08:30:00Z", end: "2026-04-25T09:00:00Z", location: "Zoom · daily", online: true, color: "indigo", attendees: ["Maya Okafor", "James Lin", "Riya Patel"] },
  { id: "a2", title: "1:1 with Maya", start: "2026-04-25T09:30:00Z", end: "2026-04-25T10:30:00Z", location: "Studio · 4F window", color: "amber", attendees: ["Maya Okafor"] },
  { id: "a3", title: "BigCorp customer call", start: "2026-04-25T10:50:00Z", end: "2026-04-25T11:50:00Z", location: "Off-site · Soho House", color: "teal", attendees: ["James Lin", "Mantavyam"], detail: "Renewal discussion · v3.4 walkthrough" },
  { id: "a4", title: "Design crit", start: "2026-04-25T13:00:00Z", end: "2026-04-25T14:30:00Z", location: "Zoom + Studio", online: true, color: "rose", attendees: ["Dani Kim", "James Lin", "Riya Patel", "Maya Okafor", "Mantavyam"], detail: "Onboarding particle field & inset login" },
  { id: "a5", title: "Audit log review", start: "2026-04-25T16:00:00Z", end: "2026-04-25T16:30:00Z", location: "Workspace #design", color: "violet", attendees: ["Maya Okafor", "James Lin"] },
  { id: "a6", title: "Q2 roadmap planning", start: "2026-04-26T09:00:00Z", end: "2026-04-26T10:00:00Z", location: "Studio", color: "violet", attendees: ["Maya Okafor", "James Lin", "Riya Patel", "Mantavyam"] },
  { id: "a7", title: "Sales review", start: "2026-04-26T11:00:00Z", end: "2026-04-26T12:00:00Z", location: "Zoom", online: true, color: "teal", attendees: ["Alex Tran"] },
  { id: "a8", title: "Sprint demo", start: "2026-04-26T15:00:00Z", end: "2026-04-26T16:30:00Z", location: "All-hands", color: "rose", attendees: ["Maya Okafor", "James Lin", "Riya Patel", "Dani Kim", "Mantavyam", "Alex Tran"] },
];

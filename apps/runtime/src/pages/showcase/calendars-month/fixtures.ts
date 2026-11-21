// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { CalendarEvent } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-26T10:00:00Z";
export const month = "2026-04";

export const listMonthEvents: CalendarEvent[] = [
  { id: "e1", title: "Q2 kickoff", start: "2026-04-01", color: "indigo" },
  { id: "e2", title: "Eng offsite", start: "2026-04-03", end: "2026-04-05", color: "violet" },
  { id: "e3", title: "1:1 Maya", start: "2026-04-07", color: "amber" },
  { id: "e4", title: "Sales review", start: "2026-04-09", color: "teal" },
  { id: "e5", title: "Design crit", start: "2026-04-12", color: "rose" },
  { id: "e6", title: "Launch v3.4", start: "2026-04-14", color: "indigo" },
  { id: "e7", title: "AMA", start: "2026-04-15", color: "sky" },
  { id: "e8", title: "Vacation", start: "2026-04-18", end: "2026-04-22", color: "teal" },
  { id: "e9", title: "Board meeting", start: "2026-04-22", color: "violet" },
  { id: "e10", title: "Customer call · BigCorp", start: "2026-04-24", color: "amber" },
  { id: "e11", title: "Sprint demo", start: "2026-04-26", color: "indigo" },
  { id: "e12", title: "Coffee w/ Riya", start: "2026-04-26", color: "rose" },
  { id: "e13", title: "Audit log review", start: "2026-04-26", color: "teal" },
  { id: "e14", title: "Retro", start: "2026-04-28", color: "sky" },
  { id: "e15", title: "Q3 planning", start: "2026-04-30", color: "violet" },
];

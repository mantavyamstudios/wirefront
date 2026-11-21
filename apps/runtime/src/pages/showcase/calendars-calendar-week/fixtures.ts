// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { CalendarSource, WeekEvent } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-10-22T10:40:00Z";

function addDays(date: string, n: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const listCalendars: CalendarSource[] = [
  { id: "me", name: "Maya Okafor", tone: "teal", visible: true },
  { id: "team", name: "Team", tone: "violet", visible: true },
  { id: "product", name: "Product reviews", tone: "sky", visible: true },
  { id: "launches", name: "Launches", tone: "amber", visible: true },
  { id: "holidays", name: "Holidays", tone: "rose", visible: true },
];

function buildEvents(): WeekEvent[] {
  const wk = "2026-10-19";
  const d = (n: number) => addDays(wk, n);
  const t = (h: number, m = 0) => h * 60 + m;
  const standups: WeekEvent[] = [];
  for (let w = -1; w <= 1; w++) {
    for (let i = 0; i < 5; i++) {
      standups.push({
        id: `standup-${w}-${i}`,
        title: "Standup",
        calendar: "team",
        date: addDays(wk, w * 7 + i),
        start: t(9),
        end: t(9, 30),
        videoUrl: "https://meet.example.com/standup",
      });
    }
  }
  return [
    ...standups,
    { id: "e1", title: "Pricing model review", calendar: "me", date: d(0), start: t(11), end: t(12), location: "Room Atlas", people: ["Jonas Weber", "Priya Raman"] },
    { id: "e2", title: "Onboarding v3 working session", calendar: "product", date: d(0), start: t(14), end: t(15, 30), videoUrl: "https://meet.example.com/e2", people: ["Priya Raman", "Leo Marchetti"] },
    { id: "e3", title: "1:1 Jonas", calendar: "me", date: d(0), start: t(16), end: t(16, 30), videoUrl: "https://meet.example.com/e3", people: ["Jonas Weber"] },
    { id: "e4", title: "Research readout", calendar: "team", date: d(1), start: t(10), end: t(11), location: "Big room", people: ["Ana Sousa"] },
    { id: "e5", title: "Lunch with Ellie", calendar: "me", date: d(1), start: t(12, 30), end: t(13, 30), location: "Canal Café" },
    { id: "e6", title: "Interview: Staff Engineer", calendar: "me", date: d(1), start: t(15), end: t(16), videoUrl: "https://meet.example.com/e6", people: ["Sam Whitfield"] },
    { id: "e7", title: "Hiring sync", calendar: "team", date: d(1), start: t(15, 30), end: t(16, 15), people: ["Ana Sousa", "Sam Whitfield"] },
    { id: "e8", title: "Incident review: webhooks", calendar: "team", date: d(2), start: t(13), end: t(14), videoUrl: "https://meet.example.com/e8", people: ["Sam Whitfield"] },
    { id: "e9", title: "Board prep", calendar: "me", date: d(2), start: t(16), end: t(17, 30), location: "Room Atlas" },
    { id: "e10", title: "Q4 pricing decision", calendar: "me", date: d(3), start: t(10), end: t(10, 45), videoUrl: "https://meet.example.com/e10", people: ["Jonas Weber", "Priya Raman"] },
    { id: "e11", title: "Customer call: Fieldnote", calendar: "me", date: d(3), start: t(11, 30), end: t(12), videoUrl: "https://meet.example.com/e11", people: ["Noor Haddad"] },
    { id: "e12", title: "Design crit", calendar: "product", date: d(3), start: t(14), end: t(15), location: "Studio", people: ["Priya Raman", "Leo Marchetti", "Ana Sousa"] },
    { id: "e13", title: "Release notes review", calendar: "launches", date: d(3), start: t(14, 30), end: t(15), people: ["Jonas Weber"] },
    { id: "e14", title: "Climbing", calendar: "me", date: d(3), start: t(18), end: t(19, 30), location: "Boulder Hall" },
    { id: "e15", title: "Focus: Q4 plan", calendar: "me", date: d(4), start: t(10), end: t(12) },
    { id: "e16", title: "Starter pricing goes live", calendar: "launches", date: d(4), start: t(15), end: t(15, 30) },
    { id: "e17", title: "Team drinks", calendar: "team", date: d(4), start: t(17), end: t(18, 30), location: "The Lantern" },
    { id: "e18", title: "Run club", calendar: "me", date: d(5), start: t(9), end: t(10) },
    { id: "a1", title: "Leo out", calendar: "team", date: d(3), start: 0, end: 0, allDay: true, days: 2 },
    { id: "a2", title: "Clocks go back", calendar: "holidays", date: d(6), start: 0, end: 0, allDay: true },
    { id: "n1", title: "Roadmap sync", calendar: "product", date: addDays(wk, 7), start: t(11), end: t(12), videoUrl: "https://meet.example.com/n1" },
    { id: "n2", title: "Lisbon offsite", calendar: "team", date: addDays(wk, 9), start: 0, end: 0, allDay: true, days: 2 },
    { id: "p1", title: "Quarterly planning", calendar: "product", date: addDays(wk, -5), start: t(13), end: t(16) },
  ];
}

export const listEvents: WeekEvent[] = buildEvents();

export const saveEvent: WeekEvent = listEvents[0] as WeekEvent;

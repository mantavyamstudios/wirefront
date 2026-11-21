// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Today } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-25T08:30:00Z";
export const userName = "Mantavyam";

export const getToday: Today = {
  tasks: [
    { id: "t1", title: "Review Maya's audit log PR", project: "API", due: "2026-04-25", done: false },
    { id: "t2", title: "Sketch onboarding step 2", project: "Onboarding", due: "2026-04-25", done: false },
    { id: "t3", title: "Reply to Riya about the bouncing invites", project: "Inbox", due: "2026-04-25", done: false },
    { id: "t4", title: "Approve Q3 budget request", project: "Ops", due: "2026-04-26", done: false },
    { id: "t5", title: "Push Tuesday's release notes", project: "Marketing", due: "2026-04-26", done: true },
  ],
  events: [
    { id: "e1", start: "2026-04-25T10:00:00Z", title: "Eng standup", detail: "Daily · 15m", category: 2 },
    { id: "e2", start: "2026-04-25T11:30:00Z", title: "1:1 with Maya", detail: "Weekly · 30m", category: 3 },
    { id: "e3", start: "2026-04-25T14:00:00Z", title: "Design crit", detail: "Squad · 45m", category: 5 },
    { id: "e4", start: "2026-04-25T16:00:00Z", title: "Customer call: BigCorp", detail: "Sales · 30m", category: 1 },
  ],
};

export const emptyToday: Today = { tasks: [], events: [] };

export const stats = [
  { label: "Streak", value: "14 days", detail: "without dropping a ball" },
  { label: "Focus", value: "3h 12m", detail: "deep work · this week" },
  { label: "Inbox", value: "3 unread", detail: "last cleared 2h ago" },
];

export const shortcuts = [
  { label: "New project", href: "#new-project" },
  { label: "Invite teammate", href: "#invite" },
  { label: "Open API key", href: "#api-keys" },
  { label: "Recent activity", href: "#activity" },
];

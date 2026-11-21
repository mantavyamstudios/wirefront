// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { InboxThread } from "./schema";

/** The demo's clock; times are relative to it. */
export const now = "2026-04-28T12:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const threads: InboxThread[] = [
  { id: "1", from: { name: "Maya Okafor" }, color: 2, preview: "I rewrote the audit log query — should we land it tonight or…", at: "2026-04-28T11:58:00Z", unread: true },
  { id: "2", from: { name: "James Lin" }, color: 3, preview: "Wrapped the migration. Feel free to merge whenever.", at: "2026-04-28T11:46:00Z", unread: true },
  { id: "3", from: { name: "Riya Patel" }, color: 5, preview: "Heads up — invite emails are bouncing for big-corp.com", at: "2026-04-28T11:00:00Z", unread: true },
  { id: "4", from: { name: "Dani Kim" }, color: 1, preview: "Bookmarked your sidebar design from yesterday, super clean.", at: "2026-04-28T09:00:00Z", unread: false },
  { id: "5", from: { name: "Alex Tran" }, color: 4, preview: "Pricing page copy is ready for your eyes.", at: "2026-04-27T15:00:00Z", unread: false },
  { id: "6", from: { name: "Ben Flores" }, color: 7, preview: "Approved the new permission scopes — see you on standup.", at: "2026-04-26T10:00:00Z", unread: false },
  { id: "7", from: { name: "Sara Quinn" }, color: 6, preview: "We should chat about the empty-state copy direction.", at: "2026-04-26T09:00:00Z", unread: false },
];

/** What the mocks return for `listThreads` (filter "all"). */
export const listThreads = { items: threads, unread: 3 };

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { NotificationPreferences } from "./schema";
import type { NotificationSection } from "./view";

/** Demo data for the showcase, the generated mocks and tests. */
export const sections: NotificationSection[] = [
  {
    id: "activity",
    title: "Activity",
    description: "Things happening in projects you follow.",
    preferences: [
      { key: "comments", title: "Comments and replies", description: "When someone replies to a thread you’re in." },
      { key: "mentions", title: "@mentions", description: "When you’re called out specifically." },
      { key: "assignments", title: "Assignments", description: "When something is assigned to you." },
    ],
  },
  {
    id: "workspace",
    title: "Workspace",
    description: "Membership, billing, and admin events.",
    preferences: [
      { key: "invites", title: "New members", description: "Someone joins or accepts an invite." },
      { key: "billing", title: "Billing receipts", description: "Monthly invoices and payment failures." },
    ],
  },
  {
    id: "product",
    title: "Product updates",
    description: "Newsletters and what’s new.",
    preferences: [
      { key: "weekly", title: "Weekly digest", description: "A short Monday summary of activity." },
      { key: "changelog", title: "Changelog highlights", description: "Major shipments, about once a month." },
    ],
  },
];

/** What the mocks return for `getPreferences`. */
export const getPreferences: NotificationPreferences = {
  comments: { email: true, push: true },
  mentions: { email: true, push: true },
  assignments: { email: true, push: false },
  invites: { email: false, push: false },
  billing: { email: true, push: false },
  weekly: { email: true, push: false },
  changelog: { email: false, push: false },
};

export const quietHours = { start: "22:00", end: "08:00" };

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ShellContext } from "./schema";

/** What the mocks return for `getShellContext`. */
export const getShellContext: ShellContext = {
  user: { name: "Mantavyam", email: "hello@mantavyam.com" },
  workspace: { id: "ws_acme", name: "Acme Inc." },
  unread: 4,
};

/** Demo projects and teams the showcase turns into nav items. */
export const projects = [
  { id: "onboarding", name: "Onboarding redesign", color: "#10b981", open: 23 },
  { id: "q3", name: "Q3 planning", color: "#f59e0b", open: 12 },
  { id: "marketing", name: "Marketing site", color: "#8b5cf6", open: 7 },
  { id: "dust", name: "Dust storm", color: "#0ea5e9", open: 31 },
];
export const teams = ["design", "engineering", "growth"];

/** Demo content for the page inside the shell. */
export const stats = [
  { label: "Unread", value: 12, note: "+3 today" },
  { label: "Mentions", value: 3, note: "+1 today" },
  { label: "Following", value: 8, note: "2 active" },
];
export const activity = [
  { id: "a1", name: "Maya Chen", action: "commented on Onboarding redesign", at: "2026-04-20T11:58:00.000Z" },
  { id: "a2", name: "Riya Patel", action: "assigned you to Q3 planning", at: "2026-04-20T11:46:00.000Z" },
  { id: "a3", name: "Tomás García", action: "mentioned you in Dust storm", at: "2026-04-20T11:00:00.000Z" },
  { id: "a4", name: "Jules Wren", action: "merged a PR in Marketing site", at: "2026-04-20T09:00:00.000Z" },
  { id: "a5", name: "Priya Shah", action: "shared a doc with Inbox", at: "2026-04-19T12:00:00.000Z" },
];
export const now = "2026-04-20T12:00:00.000Z";

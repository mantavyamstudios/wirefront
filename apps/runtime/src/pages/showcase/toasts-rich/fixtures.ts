// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ActivityToast } from "./view";

/** Demo data for the showcase and tests, oldest first. */
export const now = "2026-04-26T12:00:00Z";

export const activity: ActivityToast[] = [
  {
    id: "reply",
    kind: "reply",
    title: "Riya replied",
    description:
      "@mantavyam — same — let’s pair on the bouncing invites tomorrow morning.",
    at: "2026-04-26T11:48:00Z",
    actor: "Riya Patel",
    actions: [{ label: "Reply" }],
  },
  {
    id: "pr",
    kind: "review",
    title: "PR #128 ready for review",
    description: "James moved “audit log query rewrite” to ready.",
    at: "2026-04-26T11:58:00Z",
    actor: "James Lin",
    actions: [{ label: "Snooze" }, { label: "Review", primary: true }],
  },
  {
    id: "joined",
    kind: "join",
    title: "Maya joined the workspace",
    description:
      "Auto-joined via @acme.com domain rule. Say hi or assign a project.",
    at: "2026-04-26T12:00:00Z",
    actor: "Maya Okafor",
    actions: [{ label: "Assign" }, { label: "Welcome", primary: true }],
  },
];

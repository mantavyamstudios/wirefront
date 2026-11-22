// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Notification } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-14T17:00:00Z";

export const listNotifications: Notification[] = [
  {
    id: "n1",
    actor: "Maya Okafor",
    verb: "mentioned you in",
    context: "Onboarding handbook v3",
    kind: "mention",
    at: "2026-04-14T16:58:00Z",
    read: false,
    href: "#doc",
  },
  {
    id: "n2",
    actor: "James Lin",
    verb: "requested your review on",
    context: "PR #128 — audit log",
    kind: "review",
    at: "2026-04-14T16:42:00Z",
    read: false,
    href: "#pr-128",
  },
  {
    id: "n3",
    actor: "Riya Patel",
    verb: "replied to your comment on",
    context: "“Should we keep the rounded variant?”",
    kind: "reply",
    at: "2026-04-14T16:00:00Z",
    read: true,
    href: "#thread",
  },
  {
    id: "n4",
    actor: "Dani Kim",
    verb: "reacted ❤️ to your post in",
    context: "#design-crit",
    kind: "reaction",
    at: "2026-04-13T15:00:00Z",
    read: true,
  },
  {
    id: "n5",
    actor: "Workspace",
    verb: "billing settings were updated by",
    context: "Mantavyam",
    kind: "settings",
    at: "2026-04-12T10:00:00Z",
    read: true,
  },
  {
    id: "n6",
    actor: "Alex Tran",
    verb: "deployed",
    context: "main → production",
    kind: "deploy",
    at: "2026-04-11T10:00:00Z",
    read: true,
  },
];

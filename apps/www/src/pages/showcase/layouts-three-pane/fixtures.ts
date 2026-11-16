// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ChatChannel, ChatDirect, ChatMessage, ChatWorkspaceSummary } from "./schema";

/** The demo's clock. */
export const now = "2026-04-28T13:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const workspaces: ChatWorkspaceSummary[] = [
  { id: "acme", name: "Acme", color: 5 },
  { id: "moss", name: "Moss", color: 2 },
  { id: "north", name: "North", color: 3 },
  { id: "violet", name: "Violet", color: 8 },
];

export const channels: ChatChannel[] = [
  { id: "general", name: "general", unread: false, memberCount: 16 },
  { id: "design", name: "design", topic: "Where the design team hangs out", unread: false, memberCount: 12 },
  { id: "engineering", name: "engineering", unread: true, memberCount: 14 },
  { id: "random", name: "random", unread: false, memberCount: 16 },
  { id: "growth", name: "growth", unread: true, memberCount: 6 },
];

export const directs: ChatDirect[] = [
  { id: "lina", name: "Lina Park", presence: "online", unread: 2 },
  { id: "marc", name: "Marc Webber", presence: "away", unread: 0 },
  { id: "priya", name: "Priya Shah", presence: "online", unread: 0 },
  { id: "ada", name: "Ada Okafor", presence: "offline", unread: 5 },
];

const lina = { name: "Lina Park", color: 2 };
const marc = { name: "Marc Webber", color: 1 };
const priya = { name: "Priya Shah", color: 3 };
const ada = { name: "Ada Okafor", color: 5 };

/** What the mocks return for `listMessages` (#design). */
export const listMessages: ChatMessage[] = [
  { id: "m1", author: lina, at: "2026-04-27T09:14:00Z", body: "Pushed the new spacing tokens to the design system branch. Let me know if anything looks off in the audit doc — I tried to keep the migration story tight." },
  { id: "m2", author: marc, at: "2026-04-27T09:21:00Z", body: "Quick heads-up: the navigation prototype is on staging now. Could use some eyes on the mobile breakpoint before the review at 2.\nFiled two small follow-ups in the tracker." },
  { id: "m3", author: priya, at: "2026-04-27T10:02:00Z", body: "Loving the new icon set. The 16px variants finally feel balanced against our type ramp." },
  { id: "m4", author: ada, at: "2026-04-28T11:40:00Z", body: "Posting the usability test recordings here once they’re trimmed. Three of five participants stalled on the empty state — worth a session next week?" },
  {
    id: "m5",
    author: lina,
    at: "2026-04-28T12:08:00Z",
    body: "Yes please. I’ll prep a couple of quick directions tomorrow morning so we have something to react to.",
    thread: { replies: 3, lastReplyAt: "2026-04-28T11:00:00Z" },
  },
  { id: "m6", author: marc, at: "2026-04-28T12:31:00Z", body: "Heads up — pulling the staging deploy briefly to swap the analytics key. Back in five." },
  { id: "m7", author: priya, at: "2026-04-28T12:47:00Z", body: "Settings rework is ready for review. Tried the segmented header pattern we sketched — feels a lot calmer." },
];

/** What the mocks return for `listChannels`. */
export const listChannels = { channels, directs, memberCount: 16 };

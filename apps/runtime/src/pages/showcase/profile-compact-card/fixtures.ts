// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Roster } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-26T12:00:00Z";

export const listRoster: Roster = {
  total: 28,
  members: [
    { id: "maya", name: "Maya Okafor", handle: "maya", email: "maya@acme.dev", team: "Engineering", presence: "online", customStatus: "🛠 Heads down on audit log", permission: "owner", lastActiveAt: "2026-04-26T11:59:00Z" },
    { id: "james", name: "James Lin", handle: "james", email: "james@acme.dev", team: "Engineering", presence: "dnd", customStatus: "🤫 Do not disturb until 5", permission: "admin", lastActiveAt: "2026-04-26T11:48:00Z" },
    { id: "riya", name: "Riya Patel", handle: "riya", email: "riya@acme.dev", team: "Billing", presence: "away", customStatus: "🚂 Commuting", permission: "member", lastActiveAt: "2026-04-26T10:00:00Z" },
    { id: "dani", name: "Dani Kim", handle: "dani", email: "dani@acme.dev", team: "Design", presence: "online", permission: "member", lastActiveAt: "2026-04-26T11:58:00Z" },
    { id: "alex", name: "Alex Tran", handle: "alex", email: "alex@acme.dev", team: "Front-end", presence: "off", customStatus: "Out — back Monday", permission: "viewer", lastActiveAt: "2026-04-23T12:00:00Z" },
  ],
};

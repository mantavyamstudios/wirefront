// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ActivityEvent } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-24T15:00:00Z";

export const listActivity: { events: ActivityEvent[]; hasMore: boolean } = {
  hasMore: true,
  events: [
    { id: "a1", actor: "Maya Okafor", verb: "shipped", context: "feat: 1y audit log retention", kind: "ship", at: "2026-04-24T14:48:00Z", meta: "v3.4.0 → production" },
    { id: "a2", actor: "Riya Patel", verb: "completed", context: "All onboarding tasks for Q2 prep", kind: "complete", at: "2026-04-24T14:00:00Z" },
    { id: "a3", actor: "James Lin", verb: "commented on", context: "“Consider memoising the row renderer”", kind: "comment", at: "2026-04-24T13:00:00Z" },
    { id: "a4", actor: "Dani Kim", verb: "updated the design tokens", context: "tighter focus rings, +1 weight on heading", kind: "design", at: "2026-04-23T16:00:00Z" },
    { id: "a5", actor: "Mantavyam", verb: "invited 8 members to", context: "Marketing workspace", kind: "invite", at: "2026-04-23T11:00:00Z" },
    { id: "a6", actor: "Alex Tran", verb: "pushed", context: "12 commits to feat/billing-v3", kind: "commit", at: "2026-04-23T09:00:00Z" },
    { id: "a7", actor: "Maya Okafor", verb: "reacted ❤️ to", context: "Riya’s Q2 plan recap", kind: "reaction", at: "2026-04-22T10:00:00Z" },
    { id: "a8", actor: "Riya Patel", verb: "merged", context: "PR #122 — workspace billing migration", kind: "merge", at: "2026-04-21T10:00:00Z" },
  ],
};

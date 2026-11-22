// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Comment } from "./schema";

/** The demo clock; comment times are relative to it. */
export const now = "2026-04-24T15:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const listComments: Comment[] = [
  {
    id: "c1",
    author: { name: "Maya Okafor" },
    createdAt: "2026-04-24T13:00:00Z",
    body: "Pushed the new audit log query. The aggregate over the last 30 days comes back in `~120ms` on the prod replica — I think we can ship.",
    reactions: [
      { emoji: "🚀", count: 4, mine: true },
      { emoji: "👀", count: 2 },
      { emoji: "💯", count: 1 },
    ],
    replyCount: 3,
  },
  {
    id: "c2",
    author: { name: "James Lin" },
    createdAt: "2026-04-24T14:00:00Z",
    editedAt: "2026-04-24T14:05:00Z",
    body: "Nice. Can you also paste the query plan? Want to make sure it’s still using the `(workspace_id, created_at)` index.",
    reactions: [{ emoji: "👍", count: 1, mine: true }],
    replyCount: 1,
  },
  {
    id: "c3",
    author: { name: "Riya Patel" },
    createdAt: "2026-04-24T14:13:00Z",
    body: "Tagging @sam — heads up, this rolls in tonight if we get a thumbs up from review.",
    reactions: [],
    replyCount: 0,
  },
];

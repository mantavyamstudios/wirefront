// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ThreadComment } from "./schema";

/** The demo clock; comment times are relative to it. */
export const now = "2026-04-24T15:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const listThreadComments: ThreadComment[] = [
  {
    id: "c1",
    author: { name: "Maya Okafor" },
    createdAt: "2026-04-24T14:50:00Z",
    body: "Should we keep this paragraph? It’s nicely written but covers the same ground as the diagram below.",
  },
  {
    id: "c2",
    author: { name: "James Lin" },
    createdAt: "2026-04-24T14:52:00Z",
    body: "I’d keep it. New readers don’t always parse the diagram on first pass — the prose is the safety net.",
  },
];

export const replyToThread: ThreadComment = {
  id: "c3",
  author: { name: "You" },
  createdAt: now,
  body: "Agreed, keeping it.",
};

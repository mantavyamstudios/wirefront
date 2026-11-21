// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ResolvedThread } from "./schema";

/** The demo clock; thread times are relative to it. */
export const now = "2026-04-24T15:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const listResolvedThreads: { threads: ResolvedThread[]; openCount: number } = {
  openCount: 4,
  threads: [
    { id: "t1", author: { name: "Maya Okafor" }, createdAt: "2026-04-23T11:00:00Z", preview: "Should we keep this paragraph? It’s nicely written but covers the same ground as the diagram below.", resolvedBy: { name: "James Lin" }, replyCount: 3 },
    { id: "t2", author: { name: "Riya Patel" }, createdAt: "2026-04-20T09:30:00Z", preview: "+1 from me. Also: can you tag the migration with audit-q3 so we can roll back cleanly if needed?", resolvedBy: { name: "Maya Okafor" }, replyCount: 1 },
    { id: "t3", author: { name: "Dani Kim" }, createdAt: "2026-04-14T16:00:00Z", preview: "Tightened the corner radius on the empty-state cards — I think it reads better now.", resolvedBy: { name: "Dani Kim" }, replyCount: 0 },
  ],
};

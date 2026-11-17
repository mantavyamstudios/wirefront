// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Conversation } from "./schema";

/** The demo clock; comment times are relative to it. */
export const now = "2026-04-24T15:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const getConversation: Conversation = {
  id: "eng-128",
  subject: "API audit log query",
  subscribed: true,
  comments: [
    { id: "c1", author: { name: "Maya Okafor" }, createdAt: "2026-04-24T14:00:00Z", body: "I rewrote the audit log query — should we land it tonight or wait for the freeze to lift on Tuesday?", reactions: [ { emoji: "👀", count: 3 }, { emoji: "🚀", count: 2, mine: true } ] },
    { id: "c2", author: { name: "James Lin" }, createdAt: "2026-04-24T14:08:00Z", body: "Tonight if it’s idempotent. Otherwise I’d wait — I don’t want to chase down a partial backfill on Saturday." },
    { id: "c3", author: { name: "Maya Okafor" }, createdAt: "2026-04-24T14:16:00Z", body: "Idempotent — re-runs will skip seen entries. Tested against staging this morning." },
    { id: "c4", author: { name: "Riya Patel" }, createdAt: "2026-04-24T14:21:00Z", body: "+1 from me. Also: can you tag the migration with `audit-q3` so we can roll back cleanly if needed? @maya", reactions: [{ emoji: "👍", count: 2, mine: true }] },
  ],
};

export const replyToConversation = { id: "c5", author: { name: "You" }, createdAt: now, body: "Tagged and landing tonight." };

// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Attachment, ReplyTarget } from "./schema";

/** The demo clock; the reply target's time is relative to it. */
export const now = "2026-04-24T15:00:00Z";

/** Demo data for the showcase, the generated mocks and tests. */
export const uploadAttachment: Attachment = { id: "a1", name: "migration-plan.md" };
export const replyingTo: ReplyTarget = { name: "Maya", createdAt: "2026-04-24T13:00:00Z" };
export const draft = "Sounds good. I’ll land it tonight after CI passes — should be a clean migration.";

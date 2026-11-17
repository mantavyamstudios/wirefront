// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Notification = z
  .object({
    id: z.string(),
    /** Who or what it's from. */
    actor: z.string(),
    /** What happened, e.g. "mentioned you in". */
    verb: z.string(),
    /** What it happened to, e.g. a doc title. */
    context: z.string().optional(),
    /** Picks the badge icon; "mention" also feeds the Mentions filter. */
    kind: z.enum(["mention", "review", "reply", "reaction", "settings", "deploy", "other"]),
    /** When it happened (ISO 8601). */
    at: z.string(),
    read: z.boolean(),
    /** Where it opens. */
    href: z.string().optional(),
  })
  .meta({ id: "Notification" });
export type Notification = z.infer<typeof Notification>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listNotifications: { method: "GET", path: "/notifications", summary: "Recent notifications, newest first", response: z.array(Notification) },
  markAllNotificationsRead: { method: "POST", path: "/notifications/read-all", summary: "Mark every notification read" },
});

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ChannelId = z.enum(["desktop", "mobile", "email", "chat"]).meta({ id: "NotifyChannelId" });
export type ChannelId = z.infer<typeof ChannelId>;
export const ChannelMode = z.enum(["all", "mentions", "off"]).meta({ id: "NotifyChannelMode" });
export type ChannelMode = z.infer<typeof ChannelMode>;
export const Medium = z.enum(["email", "push", "chat"]).meta({ id: "NotifyMedium" });
export type Medium = z.infer<typeof Medium>;
export const DigestFrequency = z.enum(["off", "daily", "weekly"]).meta({ id: "DigestFrequency" });
export type DigestFrequency = z.infer<typeof DigestFrequency>;

export const NotifyEvent = z
  .object({
    id: z.string(),
    label: z.string(),
    hint: z.string(),
    media: z.array(Medium),
    /** Items of this kind waiting for the next digest. */
    pending: z.int().min(0),
    /** A mention: still sent when a channel is set to "Mentions only". */
    mention: z.boolean().optional(),
  })
  .meta({ id: "NotifyEvent" });

export const NotifySection = z
  .object({ id: z.string(), label: z.string(), description: z.string(), enabled: z.boolean(), events: z.array(NotifyEvent) })
  .meta({ id: "NotifySection" });

export const NotificationPreferences = z
  .object({
    channels: z.record(ChannelId, ChannelMode),
    sections: z.array(NotifySection),
    /** Hours 0–23; may wrap past midnight (22 → 8). */
    quietHours: z.object({ enabled: z.boolean(), from: z.int().min(0).max(23), to: z.int().min(0).max(23) }),
    digest: DigestFrequency,
  })
  .meta({ id: "NotificationPreferences" });
export type NotificationPreferences = z.infer<typeof NotificationPreferences>;

export const NotificationSettingsData = z
  .object({
    preferences: NotificationPreferences,
    /** What "Restore defaults" goes back to. */
    defaults: NotificationPreferences,
    /** One line per channel, e.g. "Sent to ada@ridgeline.app." */
    channelDetails: z.record(ChannelId, z.string()),
    /** When the next digest goes out; null when digests are off. */
    nextDigestAt: z.iso.datetime().nullable(),
  })
  .meta({ id: "NotificationSettingsData" });
export type NotificationSettingsData = z.infer<typeof NotificationSettingsData>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getNotificationSettings: {
    method: "GET",
    path: "/me/notifications",
    summary: "The user's notification preferences, the defaults and channel details",
    response: NotificationSettingsData,
  },
  saveNotificationPreferences: {
    method: "PUT",
    path: "/me/notifications",
    summary: "Replace the user's notification preferences (sent after every change)",
    body: NotificationPreferences,
  },
});

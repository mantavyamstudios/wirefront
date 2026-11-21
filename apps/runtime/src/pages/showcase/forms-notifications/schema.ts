// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** Where a notification can be delivered. */
export const NotificationChannel = z.enum(["email", "push"]).meta({ id: "NotificationChannel" });
export type NotificationChannel = z.infer<typeof NotificationChannel>;

/** One preference's state on each channel. */
export const ChannelState = z.object({ email: z.boolean(), push: z.boolean() }).meta({ id: "ChannelState" });
export type ChannelState = z.infer<typeof ChannelState>;

/** Every preference, keyed by its key. */
export const NotificationPreferences = z.record(z.string(), ChannelState).meta({ id: "NotificationPreferences" });
export type NotificationPreferences = z.infer<typeof NotificationPreferences>;

/** What flipping one switch sends. */
export const PreferenceChange = z
  .object({ key: z.string(), channel: NotificationChannel, enabled: z.boolean() })
  .meta({ id: "PreferenceChange" });
export type PreferenceChange = z.infer<typeof PreferenceChange>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getPreferences: {
    method: "GET",
    path: "/me/notification-preferences",
    summary: "The user's notification preferences",
    response: NotificationPreferences,
  },
  updatePreference: {
    method: "PATCH",
    path: "/me/notification-preferences",
    summary: "Turn one notification on or off on one channel",
    body: PreferenceChange,
  },
});

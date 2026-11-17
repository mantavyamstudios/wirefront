// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const DeviceSession = z
  .object({
    id: z.string(),
    device: z.string(),
    kind: z.enum(["laptop", "phone", "tablet"]),
    /** Browser or app, e.g. "Arc 1.42". */
    client: z.string(),
    location: z.string(),
    ip: z.string(),
    /** When it was last active (ISO 8601). */
    lastActiveAt: z.string(),
    current: z.boolean().optional(),
    trusted: z.boolean().optional(),
  })
  .meta({ id: "DeviceSession" });
export type DeviceSession = z.infer<typeof DeviceSession>;

export const SecurityKey = z.object({ id: z.string(), label: z.string(), addedAt: z.string(), lastUsedAt: z.string().optional() }).meta({ id: "SecurityKey" });
export type SecurityKey = z.infer<typeof SecurityKey>;

export const Credentials = z
  .object({
    twoFactor: z.boolean(),
    /** When recovery codes were last regenerated (ISO 8601). */
    recoveryRotatedAt: z.string().optional(),
    sessions: z.array(DeviceSession),
    keys: z.array(SecurityKey),
  })
  .meta({ id: "Credentials" });
export type Credentials = z.infer<typeof Credentials>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getCredentials: { method: "GET", path: "/me/credentials", summary: "Sign-in methods and active sessions", response: Credentials },
  signOutSession: { method: "DELETE", path: "/me/sessions/{id}", summary: "Sign out one device", params: z.object({ id: z.string() }) },
  signOutOtherSessions: { method: "DELETE", path: "/me/sessions", summary: "Sign out every device except this one" },
  removeSecurityKey: { method: "DELETE", path: "/me/keys/{id}", summary: "Remove a passkey or security key", params: z.object({ id: z.string() }) },
});

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const DeviceKind = z.enum(["laptop", "desktop", "phone", "tablet", "key"]).meta({ id: "DeviceKind" });
export type DeviceKind = z.infer<typeof DeviceKind>;

export const Passkey = z
  .object({ id: z.string(), name: z.string(), kind: DeviceKind, createdAt: z.iso.datetime(), lastUsedAt: z.iso.datetime().nullable() })
  .meta({ id: "Passkey" });
export type Passkey = z.infer<typeof Passkey>;

export const Session = z
  .object({
    id: z.string(),
    browser: z.string(),
    os: z.string(),
    kind: DeviceKind,
    /** Approximate, e.g. "Lisbon, PT". */
    location: z.string(),
    lastActiveAt: z.iso.datetime(),
    /** The session making this request. */
    current: z.boolean(),
  })
  .meta({ id: "Session" });
export type Session = z.infer<typeof Session>;

export const SecurityOverview = z
  .object({
    passwordChangedAt: z.iso.datetime().nullable(),
    twoFactor: z.object({
      enabled: z.boolean(),
      enabledAt: z.iso.datetime().nullable(),
      recoveryCodesLeft: z.int().min(0),
      recoveryCodesTotal: z.int().min(1),
      /** Whether the user has copied or downloaded their current codes. */
      recoveryCodesSaved: z.boolean(),
    }),
    passkeys: z.array(Passkey),
    sessions: z.array(Session),
  })
  .meta({ id: "SecurityOverview" });
export type SecurityOverview = z.infer<typeof SecurityOverview>;

export const PASSWORD_MIN_LENGTH = 12;

export const ChangePasswordInput = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`),
  })
  .meta({ id: "ChangePasswordInput" });
export type ChangePasswordInput = z.infer<typeof ChangePasswordInput>;

/** Recovery codes, each with whether it was used. Only the server generates them. */
export const RecoveryCodes = z.array(z.object({ code: z.string(), used: z.boolean() })).meta({ id: "RecoveryCodes" });
export type RecoveryCodes = z.infer<typeof RecoveryCodes>;

const IdParams = z.object({ id: z.string() });

/** The backend operations this screen calls. */
export const api = defineApi({
  getSecurity: { method: "GET", path: "/me/security", summary: "Password, two-factor, passkeys and sessions", response: SecurityOverview },
  changePassword: {
    method: "POST",
    path: "/me/password",
    summary: "Change the password; other sessions stay signed in",
    body: ChangePasswordInput,
    errors: { 400: "The current password is wrong or the new one is too weak" },
  },
  disableTwoFactor: { method: "DELETE", path: "/me/two-factor", summary: "Turn off two-factor authentication" },
  getRecoveryCodes: { method: "GET", path: "/me/two-factor/recovery-codes", summary: "The current recovery codes", response: RecoveryCodes },
  regenerateRecoveryCodes: {
    method: "POST",
    path: "/me/two-factor/recovery-codes",
    summary: "Replace the recovery codes; the old ones stop working",
    response: RecoveryCodes,
  },
  markRecoveryCodesSaved: { method: "POST", path: "/me/two-factor/recovery-codes/saved", summary: "Record that the user saved their codes" },
  addPasskey: {
    method: "POST",
    path: "/me/passkeys",
    summary: "Register a passkey from a WebAuthn attestation (run navigator.credentials.create first)",
    body: z.object({ attestation: z.unknown() }),
    response: Passkey,
  },
  renamePasskey: { method: "PATCH", path: "/me/passkeys/{id}", summary: "Rename a passkey", params: IdParams, body: z.object({ name: z.string().min(1).max(40) }) },
  removePasskey: { method: "DELETE", path: "/me/passkeys/{id}", summary: "Remove a passkey", params: IdParams },
  signOutSession: { method: "DELETE", path: "/me/sessions/{id}", summary: "Sign out one session", params: IdParams },
  signOutOtherSessions: { method: "DELETE", path: "/me/sessions", summary: "Sign out every session except this one" },
});

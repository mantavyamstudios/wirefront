// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Passkey = z
  .object({
    id: z.string(),
    name: z.string(),
    /** Sets the icon. */
    kind: z.enum(["computer", "phone", "security-key"]),
    /** e.g. "Chrome · macOS Sequoia". */
    detail: z.string(),
    lastUsedAt: z.iso.datetime({ offset: true }).nullable(),
  })
  .meta({ id: "Passkey" });
export type Passkey = z.infer<typeof Passkey>;

export const SignInSession = z
  .object({
    id: z.string(),
    location: z.string(),
    browser: z.string(),
    os: z.string(),
    kind: z.enum(["computer", "phone"]),
    ip: z.string(),
    lastActiveAt: z.iso.datetime({ offset: true }),
    /** The session this page was loaded in. */
    current: z.boolean(),
  })
  .meta({ id: "SignInSession" });
export type SignInSession = z.infer<typeof SignInSession>;

export const SecurityOverview = z
  .object({
    twoFactor: z.object({
      enabled: z.boolean(),
      /** e.g. "Authenticator app · paired with 1Password". */
      method: z.string(),
      lastVerifiedAt: z.iso.datetime({ offset: true }).nullable(),
    }),
    passkeys: z.array(Passkey),
    sessions: z.array(SignInSession),
    /** How many unused recovery codes are left. The codes themselves are only fetched on reveal. */
    recoveryCodesLeft: z.number().int().nonnegative(),
  })
  .meta({ id: "SecurityOverview" });
export type SecurityOverview = z.infer<typeof SecurityOverview>;

export const RecoveryCodes = z.array(z.string()).meta({ id: "RecoveryCodes" });

/** The backend operations this screen calls. */
export const api = defineApi({
  getSecurity: {
    method: "GET",
    path: "/me/security",
    summary: "Two-factor status, passkeys, sessions and recovery code count",
    response: SecurityOverview,
  },
  addPasskey: {
    method: "POST",
    path: "/me/passkeys",
    summary:
      "Register a passkey (WebAuthn attestation verified by the backend)",
    response: Passkey,
  },
  removePasskey: {
    method: "DELETE",
    path: "/me/passkeys/{id}",
    summary: "Remove a passkey",
    params: z.object({ id: z.string() }),
  },
  revokeSession: {
    method: "DELETE",
    path: "/me/sessions/{id}",
    summary: "Sign a session out",
    params: z.object({ id: z.string() }),
  },
  revokeOtherSessions: {
    method: "DELETE",
    path: "/me/sessions",
    summary: "Sign out every session except this one",
  },
  getRecoveryCodes: {
    method: "GET",
    path: "/me/recovery-codes",
    summary: "The unused recovery codes (ask for re-authentication first)",
    response: RecoveryCodes,
  },
  regenerateRecoveryCodes: {
    method: "POST",
    path: "/me/recovery-codes",
    summary: "Replace every recovery code with a new set",
    response: RecoveryCodes,
  },
});

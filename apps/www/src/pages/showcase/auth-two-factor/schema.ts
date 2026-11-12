// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** Digits in an authenticator code. The field and the schema both use it. */
export const CODE_LENGTH = 6;

/** A code from the authenticator app, or one of the user's recovery codes. */
export const TwoFactorInput = z
  .discriminatedUnion("method", [
    z.object({
      method: z.literal("totp"),
      code: z.string().regex(new RegExp(`^\\d{${CODE_LENGTH}}$`), `Enter the ${CODE_LENGTH}-digit code.`),
      /** Skip this step on this device for a while. */
      rememberDevice: z.boolean(),
    }),
    z.object({
      method: z.literal("recovery"),
      code: z.string().trim().min(8, "Recovery codes are at least 8 characters."),
    }),
  ])
  .meta({ id: "TwoFactorInput" });
export type TwoFactorInput = z.infer<typeof TwoFactorInput>;

/** What a successful sign-in returns. `redirectTo` lets the backend choose where to go next. */
export const Session = z.object({ userId: z.string(), redirectTo: z.string().optional() }).meta({ id: "Session" });
export type Session = z.infer<typeof Session>;

/** The backend operations this screen calls. */
export const api = defineApi({
  verifyTwoFactor: {
    method: "POST",
    path: "/auth/2fa/verify",
    summary: "Finish signing in with an authenticator or recovery code; a recovery code works once",
    body: TwoFactorInput,
    response: Session,
    errors: { 400: "The code is wrong", 429: "Too many attempts; try again later" },
  },
});

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** Digits in a one-time code. The field and the schema both use it. */
export const CODE_LENGTH = 6;

/** What the screen sends when the code is complete. */
export const OtpInput = z
  .object({ code: z.string().regex(new RegExp(`^\\d{${CODE_LENGTH}}$`), `Enter the ${CODE_LENGTH}-digit code.`) })
  .meta({ id: "OtpInput" });
export type OtpInput = z.infer<typeof OtpInput>;

/** What a successful sign-in returns. `redirectTo` lets the backend choose where to go next. */
export const Session = z.object({ userId: z.string(), redirectTo: z.string().optional() }).meta({ id: "Session" });
export type Session = z.infer<typeof Session>;

/** The backend operations this screen calls. */
export const api = defineApi({
  verifyOtp: {
    method: "POST",
    path: "/auth/otp/verify",
    summary: "Sign in with the one-time code emailed for this sign-in attempt",
    body: OtpInput,
    response: Session,
    errors: { 400: "The code is wrong", 410: "The code has expired; send a new one" },
  },
  resendOtp: {
    method: "POST",
    path: "/auth/otp/resend",
    summary: "Email a new one-time code",
    errors: { 429: "Too many codes requested; try again later" },
  },
});

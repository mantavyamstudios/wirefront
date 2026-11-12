// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** Digits in a verification code. The field and the schema both use it. */
export const CODE_LENGTH = 6;

/** What the screen sends when the code is complete. */
export const VerifyEmailInput = z
  .object({ code: z.string().regex(new RegExp(`^\\d{${CODE_LENGTH}}$`), `Enter the ${CODE_LENGTH}-digit code.`) })
  .meta({ id: "VerifyEmailInput" });
export type VerifyEmailInput = z.infer<typeof VerifyEmailInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  verifyEmail: {
    method: "POST",
    path: "/auth/verify-email",
    summary: "Confirm the signed-in user's email with the code they were sent",
    body: VerifyEmailInput,
    errors: { 400: "The code is wrong", 410: "The code has expired; send a new one" },
  },
  resendVerification: {
    method: "POST",
    path: "/auth/verify-email/resend",
    summary: "Send a new verification code",
    errors: { 429: "Too many codes requested; try again later" },
  },
});

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** What the server returns when two-factor enrolment starts. */
export const TotpEnrollment = z
  .object({
    /** The base32 secret, shown so people can type it in. */
    secret: z.string(),
    /** otpauth://totp/… — opened on phones, encoded in the QR code. */
    otpauthUrl: z.string().startsWith("otpauth://"),
    /** The QR code as an image URL (a data: URL works). The QR column hides without it. */
    qrCodeUrl: z.string().optional(),
    /** One-time recovery codes. */
    recoveryCodes: z.array(z.string()),
  })
  .meta({ id: "TotpEnrollment" });
export type TotpEnrollment = z.infer<typeof TotpEnrollment>;

export const VerifyTotpInput = z.object({ code: z.string().regex(/^\d{6}$/, "Enter all 6 digits.") }).meta({ id: "VerifyTotpInput" });
export type VerifyTotpInput = z.infer<typeof VerifyTotpInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  startTotpEnrollment: { method: "POST", path: "/me/two-factor/totp", summary: "Start TOTP enrolment: a new secret, QR code and recovery codes", response: TotpEnrollment },
  verifyTotp: {
    method: "POST",
    path: "/me/two-factor/totp/verify",
    summary: "Confirm enrolment with a code from the app",
    body: VerifyTotpInput,
    errors: { 400: "That code didn't match" },
  },
});

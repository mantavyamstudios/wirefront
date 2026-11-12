// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** What the form submits. Reuse it to validate the request on the server. */
export const ForgotPasswordInput = z
  .object({ email: z.email("Enter the email you signed up with.") })
  .meta({ id: "ForgotPasswordInput" });
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  requestPasswordReset: {
    method: "POST",
    path: "/auth/password-reset",
    summary:
      "Email a password reset link. Respond 204 whether or not the address has an account, so the form can't be used to find out who has one.",
    body: ForgotPasswordInput,
    errors: { 429: "Too many requests; try again later" },
  },
});

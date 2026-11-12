// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** The shortest password accepted. The form's hint and the schema both use it. */
export const PASSWORD_MIN_LENGTH = 8;

/** What the sign-up form submits. Reuse it to validate the request on the server. */
export const SignUpInput = z
  .object({
    name: z.string().trim().max(120),
    email: z.email("Enter a valid email address."),
    password: z.string().min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`),
  })
  .meta({ id: "SignUpInput" });
export type SignUpInput = z.infer<typeof SignUpInput>;

/** The new account. `redirectTo` lets the backend choose where to go next (e.g. a verify-email page). */
export const Account = z
  .object({
    userId: z.string(),
    redirectTo: z.string().optional(),
  })
  .meta({ id: "Account" });
export type Account = z.infer<typeof Account>;

/** The backend operations this screen calls. */
export const api = defineApi({
  signUp: {
    method: "POST",
    path: "/auth/sign-up",
    summary: "Create an account with email and password",
    body: SignUpInput,
    response: Account,
    errors: { 409: "An account with this email already exists", 429: "Too many attempts; try again later" },
  },
});

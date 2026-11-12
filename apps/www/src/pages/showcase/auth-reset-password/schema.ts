// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** The shortest password accepted. The form's hint and the schema both use it. */
export const PASSWORD_MIN_LENGTH = 8;

/** What the form checks before calling the backend: a new password, typed twice. */
export const NewPasswordForm = z
  .object({
    password: z.string().min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "The passwords don’t match.", path: ["confirm"] })
  .meta({ id: "NewPasswordForm" });

/** What the backend receives: the token from the reset link and the new password. */
export const ResetPasswordInput = z
  .object({
    token: z.string().min(1),
    password: z.string().min(PASSWORD_MIN_LENGTH),
  })
  .meta({ id: "ResetPasswordInput" });
export type ResetPasswordInput = z.infer<typeof ResetPasswordInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  resetPassword: {
    method: "POST",
    path: "/auth/password-reset/confirm",
    summary: "Set a new password with the token from a reset link; the token stops working once used",
    body: ResetPasswordInput,
    errors: { 400: "The password doesn't meet the rules", 410: "The link has expired or was already used" },
  },
});

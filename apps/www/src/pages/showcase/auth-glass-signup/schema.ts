// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** The shortest password accepted. The form's hint and the schema both use it. */
export const PASSWORD_MIN_LENGTH = 8;

/** What the sign-up form submits. Reuse it to validate the request on the server. */
export const SignUpInput = z
  .object({
    email: z.email("Enter a valid email address."),
    password: z.string().min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`),
  })
  .meta({ id: "SignUpInput" });
export type SignUpInput = z.infer<typeof SignUpInput>;

/** An OAuth provider's path parameter, e.g. "github" or "google". */
export const ProviderParams = z.object({ provider: z.string() }).meta({ id: "ProviderParams" });

/** Where to send the browser to continue with a provider. */
export const OAuthRedirect = z.object({ url: z.string() }).meta({ id: "OAuthRedirect" });

/** The backend operations this screen calls. */
export const api = defineApi({
  signUp: {
    method: "POST",
    path: "/auth/sign-up",
    summary: "Create an account with email and password",
    body: SignUpInput,
    errors: { 409: "An account with this email already exists", 429: "Too many attempts; try again later" },
  },
  startOAuth: {
    method: "POST",
    path: "/auth/oauth/{provider}",
    summary: "Start sign-up with an OAuth provider; the backend returns where to redirect",
    params: ProviderParams,
    response: OAuthRedirect,
  },
});

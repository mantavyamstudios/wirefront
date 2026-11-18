// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** What the sign-in form submits. Reuse it to validate the request on the server. */
export const SignInInput = z
  .object({
    email: z.email("Enter a valid email address."),
    password: z.string().min(1, "Enter your password."),
  })
  .meta({ id: "SignInInput" });
export type SignInInput = z.infer<typeof SignInInput>;

/** An OAuth provider's path parameter, e.g. "github" or "google". */
export const ProviderParams = z.object({ provider: z.string() }).meta({ id: "ProviderParams" });

/** Where to send the browser to continue with a provider. */
export const OAuthRedirect = z.object({ url: z.string() }).meta({ id: "OAuthRedirect" });

/** The backend operations this screen calls. */
export const api = defineApi({
  signIn: {
    method: "POST",
    path: "/auth/sign-in",
    summary: "Sign in with email and password",
    body: SignInInput,
    errors: { 401: "The email or password is wrong", 429: "Too many attempts; try again later" },
  },
  startOAuth: {
    method: "POST",
    path: "/auth/oauth/{provider}",
    summary: "Start sign-in with an OAuth provider; the backend returns where to redirect",
    params: ProviderParams,
    response: OAuthRedirect,
  },
});

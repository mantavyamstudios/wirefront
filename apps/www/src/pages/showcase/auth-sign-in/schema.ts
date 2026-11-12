// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** What the sign-in form submits. Reuse it to validate the request on the server. */
export const SignInInput = z
  .object({
    email: z.email("Enter a valid email address."),
    password: z.string().min(1, "Enter your password."),
  })
  .meta({ id: "SignInInput" });
export type SignInInput = z.infer<typeof SignInInput>;

/** What "Email me a sign-in link" submits. */
export const MagicLinkInput = SignInInput.pick({ email: true }).meta({ id: "MagicLinkInput" });
export type MagicLinkInput = z.infer<typeof MagicLinkInput>;

/** An OAuth provider's path parameter, e.g. "google" or "github". */
export const ProviderParams = z.object({ provider: z.string() }).meta({ id: "ProviderParams" });

/** What a successful sign-in returns. `redirectTo` lets the backend choose where to go next. */
export const Session = z
  .object({
    userId: z.string(),
    redirectTo: z.string().optional(),
  })
  .meta({ id: "Session" });
export type Session = z.infer<typeof Session>;

/** The backend operations this screen calls. */
export const api = defineApi({
  signIn: {
    method: "POST",
    path: "/auth/sign-in",
    summary: "Sign in with email and password",
    body: SignInInput,
    response: Session,
    errors: { 401: "The email or password is wrong", 429: "Too many attempts; try again later" },
  },
  signInWithPasskey: {
    method: "POST",
    path: "/auth/passkey",
    summary: "Sign in with a passkey (WebAuthn assertion verified by the backend)",
    response: Session,
    errors: { 401: "The passkey wasn't accepted" },
  },
  sendMagicLink: {
    method: "POST",
    path: "/auth/magic-link",
    summary: "Email a one-time sign-in link",
    body: MagicLinkInput,
    errors: { 429: "Too many links requested; try again later" },
  },
  startOAuth: {
    method: "POST",
    path: "/auth/oauth/{provider}",
    summary: "Start sign-in with an OAuth provider; the backend returns where to redirect",
    params: ProviderParams,
    response: Session,
  },
});

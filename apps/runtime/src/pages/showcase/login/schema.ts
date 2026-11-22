// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** What "Send sign-in link" submits. Reuse it to validate the request on the server. */
export const MagicLinkInput = z
  .object({ email: z.email("Enter a valid email address.") })
  .meta({ id: "MagicLinkInput" });
export type MagicLinkInput = z.infer<typeof MagicLinkInput>;

/** An OAuth provider's path parameter, e.g. "google" or "apple". */
export const ProviderParams = z
  .object({ provider: z.string() })
  .meta({ id: "ProviderParams" });

/** Where to send the browser to continue with a provider. */
export const OAuthRedirect = z
  .object({ url: z.string() })
  .meta({ id: "OAuthRedirect" });

/** The backend operations this screen calls. */
export const api = defineApi({
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
    summary:
      "Start sign-in with an OAuth provider; the backend returns where to redirect",
    params: ProviderParams,
    response: OAuthRedirect,
  },
});

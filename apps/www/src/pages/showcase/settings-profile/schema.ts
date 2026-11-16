// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** What the profile form saves. Reuse it to validate the request on the server. */
export const AccountProfileInput = z
  .object({
    displayName: z.string().trim().min(1, "Enter a display name.").max(48, "Keep it to 48 characters or fewer."),
    handle: z
      .string()
      .trim()
      .regex(/^[a-z0-9_]{2,24}$/, "Use 2–24 lowercase letters, numbers or underscores."),
    pronouns: z.string().trim().max(32),
    bio: z.string().trim().max(240, "Keep it to 240 characters or fewer."),
    /** A language code from the offered options, e.g. "en". */
    language: z.string(),
    /** An IANA time zone from the offered options, e.g. "America/New_York". */
    timeZone: z.string(),
  })
  .meta({ id: "AccountProfileInput" });
export type AccountProfileInput = z.infer<typeof AccountProfileInput>;

export const AccountProfile = AccountProfileInput.extend({
  /** Sign-in email; changed elsewhere. */
  email: z.email(),
  avatarUrl: z.string().nullable(),
}).meta({ id: "AccountProfile" });
export type AccountProfile = z.infer<typeof AccountProfile>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getAccountProfile: { method: "GET", path: "/me/profile", summary: "The signed-in user's profile", response: AccountProfile },
  saveAccountProfile: {
    method: "PATCH",
    path: "/me/profile",
    summary: "Save the profile",
    body: AccountProfileInput,
    errors: { 409: "That handle is taken" },
  },
  uploadAvatar: { method: "PUT", path: "/me/avatar", summary: "Replace the profile photo (multipart image upload)" },
  removeAvatar: { method: "DELETE", path: "/me/avatar", summary: "Remove the profile photo" },
});

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const AvatarPalette = z.enum(["dusk", "tide", "ember", "moss"]).meta({ id: "AvatarPalette" });
export type AvatarPalette = z.infer<typeof AvatarPalette>;

/** A generated avatar: a colour palette, framed by an offset and zoom. */
export const AvatarCrop = z
  .object({ palette: AvatarPalette, x: z.number(), y: z.number(), zoom: z.number().min(1).max(2.4) })
  .meta({ id: "AvatarCrop" });
export type AvatarCrop = z.infer<typeof AvatarCrop>;

export const Profile = z
  .object({
    fullName: z.string().trim().min(1).max(48),
    publicName: z.string().trim().max(32),
    username: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])$/),
    email: z.email(),
    bio: z.string().max(160),
    /** IANA time zone, e.g. "Europe/Stockholm". */
    timeZone: z.string(),
    avatar: AvatarCrop.nullable(),
  })
  .meta({ id: "Profile" });
export type Profile = z.infer<typeof Profile>;

export const ProfileZone = z.object({ id: z.string(), city: z.string() }).meta({ id: "ProfileZone" });
export type ProfileZone = z.infer<typeof ProfileZone>;

export const UsernameCheck = z.object({ available: z.boolean(), suggestions: z.array(z.string()).optional() }).meta({ id: "UsernameCheck" });

/** The backend operations this screen calls. */
export const api = defineApi({
  getProfile: { method: "GET", path: "/me/profile", summary: "The signed-in user's profile", response: Profile },
  saveProfile: {
    method: "PUT",
    path: "/me/profile",
    summary: "Save the profile; a changed email is confirmed by a link before it takes effect",
    body: Profile,
    errors: { 409: "The username was taken in the meantime" },
  },
  checkUsername: {
    method: "GET",
    path: "/usernames/availability",
    summary: "Whether a username is free, with suggestions when it isn't",
    query: z.object({ username: z.string() }),
    response: UsernameCheck,
  },
});

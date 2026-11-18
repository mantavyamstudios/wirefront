// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const DateFormat = z.enum(["ymd", "dmy", "mdy"]).meta({ id: "DateFormat" });
export type DateFormat = z.infer<typeof DateFormat>;

/** The General settings, as loaded and as "Save changes" sends them. */
export const GeneralSettings = z
  .object({
    name: z.string().trim().min(1, "Give the workspace a name.").max(60),
    slug: z
      .string()
      .min(2, "Use at least two characters.")
      .max(32)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes."),
    /** An IANA time zone, e.g. "America/New_York". */
    timeZone: z.string(),
    dateFormat: DateFormat,
    publicSignUp: z.boolean(),
    requireAdminTwoFactor: z.boolean(),
    showProjectIds: z.boolean(),
  })
  .meta({ id: "GeneralSettings" });
export type GeneralSettings = z.infer<typeof GeneralSettings>;

export const UploadedAvatar = z.object({ avatarUrl: z.url() }).meta({ id: "UploadedAvatar" });
export type UploadedAvatar = z.infer<typeof UploadedAvatar>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getGeneralSettings: { method: "GET", path: "/workspace/settings", summary: "The workspace's general settings", response: GeneralSettings },
  saveGeneralSettings: {
    method: "PUT",
    path: "/workspace/settings",
    summary: "Save the workspace's general settings",
    body: GeneralSettings,
    errors: { 409: "That slug is taken" },
  },
  uploadAvatar: {
    method: "POST",
    path: "/workspace/avatar",
    summary: "Upload the workspace avatar (multipart, field \"file\")",
    response: UploadedAvatar,
  },
});

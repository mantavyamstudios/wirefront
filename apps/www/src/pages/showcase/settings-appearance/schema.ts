// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const AppearancePrefs = z
  .object({
    mode: z.enum(["light", "dark", "system"]),
    palette: z.enum(["graphite", "indigo", "crimson", "sage", "amber", "violet"]),
    density: z.enum(["comfortable", "cozy", "compact"]),
    font: z.enum(["geist", "inter", "mono"]),
  })
  .meta({ id: "AppearancePrefs" });
export type AppearancePrefs = z.infer<typeof AppearancePrefs>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getAppearance: { method: "GET", path: "/me/appearance", summary: "The signed-in user's appearance preferences", response: AppearancePrefs },
  saveAppearance: { method: "PUT", path: "/me/appearance", summary: "Save appearance preferences", body: AppearancePrefs },
});

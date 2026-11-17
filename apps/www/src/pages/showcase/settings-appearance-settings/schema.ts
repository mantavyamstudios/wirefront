// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ThemePrefs = z
  .object({
    theme: z.enum(["system", "light", "dark"]),
    accent: z.enum(["indigo", "violet", "rose", "orange", "emerald", "sky"]),
    density: z.enum(["compact", "default", "comfortable"]),
    /** Base text size in px, 12–18. */
    textSize: z.number().int().min(12).max(18),
    reduceMotion: z.boolean(),
    sidebarIcons: z.boolean(),
  })
  .meta({ id: "ThemePrefs" });
export type ThemePrefs = z.infer<typeof ThemePrefs>;

/** A sample row for the live preview. */
export const PreviewTask = z
  .object({ id: z.string(), title: z.string(), owner: z.string(), due: z.string(), dueToday: z.boolean().optional(), done: z.boolean().optional() })
  .meta({ id: "PreviewTask" });
export type PreviewTask = z.infer<typeof PreviewTask>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getThemePrefs: { method: "GET", path: "/me/appearance", summary: "The signed-in user's appearance on this device", response: ThemePrefs },
  saveThemePrefs: { method: "PUT", path: "/me/appearance", summary: "Save appearance preferences", body: ThemePrefs },
});

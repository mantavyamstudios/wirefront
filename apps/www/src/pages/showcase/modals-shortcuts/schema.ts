// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Shortcut = z
  .object({
    /** The keys pressed together, e.g. ["⌘", "K"]. */
    keys: z.array(z.string()).min(1),
    label: z.string(),
  })
  .meta({ id: "Shortcut" });
export type Shortcut = z.infer<typeof Shortcut>;

export const ShortcutGroup = z.object({ name: z.string(), shortcuts: z.array(Shortcut) }).meta({ id: "ShortcutGroup" });
export type ShortcutGroup = z.infer<typeof ShortcutGroup>;

/** The backend operations this screen calls: none. Shortcuts usually ship with the app. */
export const api = defineApi({});

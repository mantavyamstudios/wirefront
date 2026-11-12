// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** Picks the entry's icon. */
export const CommandKind = z
  .enum(["action", "invite", "switch", "document", "project", "channel", "branch", "settings"])
  .meta({ id: "CommandKind" });
export type CommandKind = z.infer<typeof CommandKind>;

export const CommandEntry = z
  .object({
    /** Your id for it, passed back when it's chosen. */
    id: z.string(),
    label: z.string(),
    /** Small text after the label, e.g. "Project". */
    hint: z.string().optional(),
    kind: CommandKind,
    /** A keyboard shortcut to show, e.g. "⌘⇧W". Display only. */
    shortcut: z.string().optional(),
  })
  .meta({ id: "CommandEntry" });
export type CommandEntry = z.infer<typeof CommandEntry>;

export const CommandGroup = z
  .object({ id: z.string(), label: z.string(), items: z.array(CommandEntry) })
  .meta({ id: "CommandGroup" });
export type CommandGroup = z.infer<typeof CommandGroup>;

/** The backend operations this screen calls. */
export const api = defineApi({
  searchCommands: {
    method: "GET",
    path: "/search",
    summary: "Documents, projects, channels and other places that match what the user typed",
    query: z.object({ q: z.string() }),
    response: z.array(CommandGroup),
  },
});

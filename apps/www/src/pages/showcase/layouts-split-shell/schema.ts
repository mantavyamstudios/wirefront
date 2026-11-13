// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const SplitShellUser = z
  .object({ name: z.string(), subtitle: z.string().optional(), avatarUrl: z.url().optional() })
  .meta({ id: "SplitShellUser" });
export type SplitShellUser = z.infer<typeof SplitShellUser>;

/** A sidebar entry, e.g. an agent task. */
export const SplitShellItem = z
  .object({
    id: z.string(),
    title: z.string(),
    href: z.string(),
    state: z.enum(["running", "done", "idle"]),
    /** ISO 8601. */
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "SplitShellItem" });
export type SplitShellItem = z.infer<typeof SplitShellItem>;

/** The backend operations this screen calls. The panel and the thread are the builder's own screens. */
export const api = defineApi({
  listTasks: {
    method: "GET",
    path: "/tasks",
    summary: "The signed-in user's tasks for the sidebar, newest first",
    response: z.array(SplitShellItem),
  },
});

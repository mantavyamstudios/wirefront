// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const RailContext = z
  .object({
    workspace: z.object({ name: z.string(), /** e.g. "Pro · 24 members". */ detail: z.string().optional() }),
    user: z.object({ name: z.string(), avatarUrl: z.url().optional(), online: z.boolean().optional() }),
  })
  .meta({ id: "RailContext" });
export type RailContext = z.infer<typeof RailContext>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getRailContext: { method: "GET", path: "/me/shell", summary: "The current workspace and user for the sidebar", response: RailContext },
});

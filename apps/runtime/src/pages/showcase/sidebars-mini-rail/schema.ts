// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const RailWorkspace = z
  .object({ id: z.string(), name: z.string(), /** One of the eight category colours. */ color: z.int().min(1).max(8) })
  .meta({ id: "RailWorkspace" });
export type RailWorkspace = z.infer<typeof RailWorkspace>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listWorkspaces: { method: "GET", path: "/me/workspaces", summary: "Workspaces the user belongs to", response: z.array(RailWorkspace) },
});

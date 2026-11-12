// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** What the dialog needs to explain what will be lost. */
export const WorkspaceSummary = z
  .object({
    id: z.string(),
    /** Shown in the title and typed to confirm, e.g. "acme-prod". */
    slug: z.string(),
    projects: z.int().min(0),
    documents: z.int().min(0),
    members: z.int().min(0),
    /** Days backups are kept after deletion; 0 or absent means none. */
    backupDays: z.int().min(0).optional(),
  })
  .meta({ id: "WorkspaceSummary" });
export type WorkspaceSummary = z.infer<typeof WorkspaceSummary>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getWorkspaceSummary: {
    method: "GET",
    path: "/workspaces/{id}/summary",
    summary: "Counts of what deleting the workspace removes",
    params: z.object({ id: z.string() }),
    response: WorkspaceSummary,
  },
  deleteWorkspace: {
    method: "DELETE",
    path: "/workspaces/{id}",
    summary: "Delete the workspace and everything in it",
    params: z.object({ id: z.string() }),
    errors: { 403: "Only the owner can delete the workspace" },
  },
});

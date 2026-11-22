// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const FolderTone = z.enum([
  "orange",
  "yellow",
  "lime",
  "teal",
  "blue",
  "violet",
  "rose",
  "slate",
  "neutral",
]);
export type FolderTone = z.infer<typeof FolderTone>;

export const DriveMember = z
  .object({
    id: z.string(),
    name: z.string(),
    initials: z.string(),
    tone: FolderTone,
  })
  .meta({ id: "DriveMember" });
export type DriveMember = z.infer<typeof DriveMember>;

export const DriveFolder = z
  .object({
    id: z.string(),
    name: z.string(),
    files: z.number().int().min(0),
    /** Size in megabytes. */
    sizeMb: z.number().min(0),
    tone: FolderTone,
    /** ISO timestamp of the last edit. */
    editedAt: z.string(),
    /** Member ids it is shared with. */
    members: z.array(z.string()),
    shared: z.boolean().optional(),
    starred: z.boolean().optional(),
  })
  .meta({ id: "DriveFolder" });
export type DriveFolder = z.infer<typeof DriveFolder>;

export const DriveTemplate = z
  .object({
    id: z.string(),
    name: z.string(),
    kind: z.enum(["doc", "brief", "sheet", "roadmap", "board", "moodboard"]),
  })
  .meta({ id: "DriveTemplate" });
export type DriveTemplate = z.infer<typeof DriveTemplate>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listFolders: {
    method: "GET",
    path: "/drive/folders",
    summary: "Folders in the workspace",
    response: z.array(DriveFolder),
  },
  listTemplates: {
    method: "GET",
    path: "/drive/templates",
    summary: "Templates to start from",
    response: z.array(DriveTemplate),
  },
  getStorage: {
    method: "GET",
    path: "/drive/storage",
    summary: "Storage used and available",
    response: z.object({ usedGb: z.number(), totalGb: z.number() }),
  },
  createFolder: {
    method: "POST",
    path: "/drive/folders",
    summary: "Create an empty folder",
    response: DriveFolder,
  },
  setFolderStarred: {
    method: "PUT",
    path: "/drive/folders/{id}/starred",
    summary: "Star or unstar a folder",
    params: z.object({ id: z.string() }),
    body: z.object({ starred: z.boolean() }),
  },
});

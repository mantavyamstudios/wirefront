// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const FolderFileKind = z.enum(["doc", "sheet", "image", "slides", "pdf", "video"]);
export type FolderFileKind = z.infer<typeof FolderFileKind>;

export const FolderFile = z
  .object({
    id: z.string(),
    name: z.string(),
    kind: FolderFileKind,
    sizeBytes: z.number().min(0),
    /** Member id of the last editor. */
    editedBy: z.string(),
    /** ISO timestamp. */
    editedAt: z.string(),
    /** Which placeholder art an image preview uses. */
    art: z.enum(["logos", "moodboard", "photo"]).optional(),
  })
  .meta({ id: "FolderFile" });
export type FolderFile = z.infer<typeof FolderFile>;

export const SubFolder = z.object({ id: z.string(), name: z.string(), files: z.array(FolderFile) }).meta({ id: "SubFolder" });
export type SubFolder = z.infer<typeof SubFolder>;

export const FolderMember = z.object({ id: z.string(), name: z.string(), initials: z.string(), tone: z.enum(["orange", "teal", "blue", "violet", "rose", "lime"]) }).meta({ id: "FolderMember" });
export type FolderMember = z.infer<typeof FolderMember>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getFolder: { method: "GET", path: "/drive/folders/{id}", summary: "A folder, its files and subfolders", params: z.object({ id: z.string() }), response: z.object({ name: z.string(), files: z.array(FolderFile), folders: z.array(SubFolder), members: z.array(FolderMember) }) },
  createDoc: { method: "POST", path: "/drive/folders/{id}/docs", summary: "Start a blank doc in a folder", params: z.object({ id: z.string() }), response: FolderFile },
  trashFiles: { method: "POST", path: "/drive/folders/{id}/trash", summary: "Move files to the trash", params: z.object({ id: z.string() }), body: z.object({ ids: z.array(z.string()).min(1) }) },
});

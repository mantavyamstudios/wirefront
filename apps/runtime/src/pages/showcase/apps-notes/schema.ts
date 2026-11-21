// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const NoteBlockType = z.enum(["h1", "h2", "p", "todo", "bullet"]);
export type NoteBlockType = z.infer<typeof NoteBlockType>;

export const NoteBlock = z.object({ id: z.string(), type: NoteBlockType, text: z.string(), done: z.boolean().optional() }).meta({ id: "NoteBlock" });
export type NoteBlock = z.infer<typeof NoteBlock>;

export const NoteFolderTone = z.enum(["amber", "sky", "rose", "emerald", "violet"]);
export type NoteFolderTone = z.infer<typeof NoteFolderTone>;

export const NoteFolder = z.object({ id: z.string(), name: z.string(), tone: NoteFolderTone }).meta({ id: "NoteFolder" });
export type NoteFolder = z.infer<typeof NoteFolder>;

export const Note = z
  .object({ id: z.string(), title: z.string(), folderId: z.string(), /** ISO timestamp. */ updatedAt: z.string(), pinned: z.boolean().optional(), /** In Recently deleted. */ deleted: z.boolean().optional(), blocks: z.array(NoteBlock) })
  .meta({ id: "Note" });
export type Note = z.infer<typeof Note>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listNoteFolders: { method: "GET", path: "/notes/folders", summary: "Note folders", response: z.array(NoteFolder) },
  listNotes: { method: "GET", path: "/notes", summary: "Every note, including recently deleted", response: z.array(Note) },
  createNote: { method: "POST", path: "/notes", summary: "Start an empty note in a folder", body: z.object({ folderId: z.string() }), response: Note },
  saveNote: { method: "PUT", path: "/notes/{id}", summary: "Save a note (title, blocks, folder, pin or deleted)", params: z.object({ id: z.string() }), body: Note },
});

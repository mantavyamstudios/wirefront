// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const UploadState = z.enum(["uploading", "paused", "done", "failed"]).meta({ id: "UploadState" });
export type UploadState = z.infer<typeof UploadState>;

/** One file in the queue, as the builder's uploader reports it. */
export const UploadItem = z
  .object({
    id: z.string(),
    name: z.string(),
    /** In bytes. */
    size: z.int().min(0),
    /** 0–100. */
    progress: z.number().min(0).max(100),
    state: UploadState,
    /** Why it failed, when it did. */
    error: z.string().optional(),
  })
  .meta({ id: "UploadItem" });
export type UploadItem = z.infer<typeof UploadItem>;

/** The backend operations this screen calls. Uploads usually go straight to storage (e.g. presigned URLs); the screen only shows their progress. */
export const api = defineApi({
  createUpload: {
    method: "POST",
    path: "/uploads",
    summary: "Register a file and get where to upload it",
    body: z.object({ name: z.string(), size: z.int().min(0), type: z.string() }),
    response: z.object({ id: z.string(), uploadUrl: z.url() }),
  },
  cancelUpload: { method: "DELETE", path: "/uploads/{id}", summary: "Cancel an upload", params: z.object({ id: z.string() }) },
});

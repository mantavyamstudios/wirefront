// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Upload = z
  .object({
    id: z.string(),
    name: z.string(),
    bytes: z.number().int().nonnegative(),
    kind: z.enum(["image", "doc", "other"]),
    /** 0–1. */
    progress: z.number().min(0).max(1),
  })
  .meta({ id: "Upload" });
export type Upload = z.infer<typeof Upload>;

/** No backend operations of its own: your uploader reports progress and cancels. */
export const api = defineApi({});

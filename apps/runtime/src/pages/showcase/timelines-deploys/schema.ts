// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Deploy = z
  .object({
    id: z.string(),
    env: z.enum(["production", "staging", "preview"]),
    branch: z.string(),
    sha: z.string(),
    status: z.enum(["succeeded", "failed", "rolled-back", "in-progress"]),
    message: z.string(),
    author: z.string(),
    /** How long it took, or has run so far, in milliseconds. */
    durationMs: z.number().nonnegative(),
    /** When it started (ISO 8601). */
    at: z.string(),
  })
  .meta({ id: "Deploy" });
export type Deploy = z.infer<typeof Deploy>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listDeploys: { method: "GET", path: "/deploys", summary: "Recent deploys, newest first", response: z.array(Deploy) },
  rollBackTo: { method: "POST", path: "/deploys/{id}/rollback", summary: "Redeploy production at this deploy", params: z.object({ id: z.string() }) },
});

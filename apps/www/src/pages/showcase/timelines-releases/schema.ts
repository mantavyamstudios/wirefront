// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const PromotionStep = z
  .object({
    id: z.string(),
    name: z.string(),
    state: z.enum(["done", "active", "queued"]),
    detail: z.string(),
    /** How long a finished step took, in milliseconds. */
    durationMs: z.number().nonnegative().optional(),
    /** When the active step started (ISO 8601), to show how long it has run. */
    startedAt: z.string().optional(),
    /** The active step's rollout, 0–1. */
    progress: z.number().min(0).max(1).optional(),
    /** Regions, e.g. "iad, sfo". */
    region: z.string().optional(),
  })
  .meta({ id: "PromotionStep" });
export type PromotionStep = z.infer<typeof PromotionStep>;

export const Release = z
  .object({
    version: z.string(),
    triggeredBy: z.string(),
    startedAt: z.string(),
    commit: z.object({ sha: z.string(), message: z.string() }),
    steps: z.array(PromotionStep),
  })
  .meta({ id: "Release" });
export type Release = z.infer<typeof Release>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getRelease: { method: "GET", path: "/releases/{version}", summary: "A release and its promotion steps", params: z.object({ version: z.string() }), response: Release },
  pauseRelease: { method: "POST", path: "/releases/{version}/pause", summary: "Hold the rollout at its current step", params: z.object({ version: z.string() }) },
  rollBackRelease: { method: "POST", path: "/releases/{version}/rollback", summary: "Roll the release back everywhere it reached", params: z.object({ version: z.string() }) },
});

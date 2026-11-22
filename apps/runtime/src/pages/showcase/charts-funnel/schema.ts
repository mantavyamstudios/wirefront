// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const FunnelStage = z
  .object({
    id: z.string(),
    name: z.string(),
    /** A short name for the conversion cards, e.g. "Visit". */
    short: z.string().optional(),
    /** What counts as reaching it, e.g. "Page view". */
    kind: z.string().optional(),
    count: z.number().int().nonnegative(),
  })
  .meta({ id: "FunnelStage" });
export type FunnelStage = z.infer<typeof FunnelStage>;

/** A conversion between two stages to call out, with the rate you aim for (0–1). */
export const FunnelHighlight = z
  .object({
    from: z.string(),
    to: z.string(),
    target: z.number().min(0).max(1).optional(),
  })
  .meta({ id: "FunnelHighlight" });
export type FunnelHighlight = z.infer<typeof FunnelHighlight>;

export const Funnel = z
  .object({
    stages: z.array(FunnelStage),
    highlights: z.array(FunnelHighlight).optional(),
  })
  .meta({ id: "Funnel" });
export type Funnel = z.infer<typeof Funnel>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getFunnel: {
    method: "GET",
    path: "/reports/onboarding-funnel",
    summary:
      "How many people reached each onboarding stage in the last 30 days",
    response: Funnel,
  },
});

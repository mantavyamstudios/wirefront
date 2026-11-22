// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** The period the figures cover. */
export const VelocityRange = z
  .enum(["7d", "30d", "90d"])
  .meta({ id: "VelocityRange" });
export type VelocityRange = z.infer<typeof VelocityRange>;

/** DORA performance bands. */
export const DoraRating = z
  .enum(["elite", "high", "medium", "low"])
  .meta({ id: "DoraRating" });
export type DoraRating = z.infer<typeof DoraRating>;

export const DoraMetric = z
  .object({
    /** Deploys per day; seconds for lead time and time to restore; a fraction for change failure rate. */
    value: z.number().nonnegative(),
    /** Change against the previous period, as a fraction (-0.22 = 22% lower). */
    change: z.number(),
    rating: DoraRating,
    /** The value over the period, oldest first, in the same unit. */
    trend: z.array(z.number()),
  })
  .meta({ id: "DoraMetric" });
export type DoraMetric = z.infer<typeof DoraMetric>;

export const PrWeek = z
  .object({
    /** The Monday the week starts on (ISO date). */
    weekStart: z.iso.date(),
    merged: z.number().int().nonnegative(),
    open: z.number().int().nonnegative(),
    closed: z.number().int().nonnegative(),
  })
  .meta({ id: "PrWeek" });
export type PrWeek = z.infer<typeof PrWeek>;

export const Contributor = z
  .object({
    id: z.string(),
    name: z.string(),
    merged: z.number().int().nonnegative(),
    reviewed: z.number().int().nonnegative(),
    /** Median lead time for their PRs, in seconds. */
    leadTimeSeconds: z.number().nonnegative(),
  })
  .meta({ id: "Contributor" });
export type Contributor = z.infer<typeof Contributor>;

export const Velocity = z
  .object({
    dora: z.object({
      deployFrequency: DoraMetric,
      leadTime: DoraMetric,
      changeFailureRate: DoraMetric,
      timeToRestore: DoraMetric,
    }),
    /** Oldest first. */
    prWeeks: z.array(PrWeek),
    ci: z.object({
      /** Fractions (0.946 = 94.6%). */
      passRate: z.number().min(0).max(1),
      flakeRate: z.number().min(0).max(1),
      avgDurationSeconds: z.number().nonnegative(),
      totalRuns: z.number().int().nonnegative(),
      /** Slowest first. */
      slowestJobs: z.array(
        z.object({
          name: z.string(),
          durationSeconds: z.number().nonnegative(),
        })
      ),
    }),
    /** Ranked by merged PRs, most first. */
    contributors: z.array(Contributor),
  })
  .meta({ id: "Velocity" });
export type Velocity = z.infer<typeof Velocity>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getVelocity: {
    method: "GET",
    path: "/engineering/velocity",
    summary:
      "DORA metrics, PR throughput, CI health and top contributors for a period",
    query: z.object({ range: VelocityRange }),
    response: Velocity,
  },
});

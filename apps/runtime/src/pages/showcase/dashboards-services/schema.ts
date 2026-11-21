// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** How far back the per-service trends and rates look. */
export const HealthWindow = z.enum(["1h", "6h", "24h"]).meta({ id: "HealthWindow" });
export type HealthWindow = z.infer<typeof HealthWindow>;

export const ServiceHealthState = z.enum(["healthy", "degraded", "down", "deploying"]).meta({ id: "ServiceHealthState" });
export type ServiceHealthState = z.infer<typeof ServiceHealthState>;

export const ServiceStatus = z
  .object({
    id: z.string(),
    name: z.string(),
    region: z.string(),
    owner: z.string(),
    health: ServiceHealthState,
    /** Requests per second; null when the service isn't serving. */
    rps: z.number().nonnegative().nullable(),
    /** p99 latency in milliseconds; null when there's no traffic. */
    p99Ms: z.number().nonnegative().nullable(),
    /** Share of requests that failed, as a fraction (0.014 = 1.4%). */
    errorRate: z.number().min(0).max(1),
    /** Error rate over the window, oldest first, as fractions. */
    errorTrend: z.array(z.number().min(0).max(1)),
    /** Error budget left this SLO period, as a fraction. */
    sloBudget: z.number().min(0).max(1),
    /** Uptime over the last 30 days, as a fraction (0.9996). */
    uptime30d: z.number().min(0).max(1),
  })
  .meta({ id: "ServiceStatus" });
export type ServiceStatus = z.infer<typeof ServiceStatus>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listServiceHealth: {
    method: "GET",
    path: "/services/health",
    summary: "Each service's health, traffic, errors and SLO budget over a window",
    query: z.object({ window: HealthWindow }),
    response: z.array(ServiceStatus),
  },
});

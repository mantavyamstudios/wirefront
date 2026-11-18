// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const IntegrationHealth = z.enum(["ok", "warn", "error"]).meta({ id: "IntegrationHealth" });
export type IntegrationHealth = z.infer<typeof IntegrationHealth>;

export const ConnectedService = z
  .object({
    id: z.string(),
    name: z.string(),
    iconUrl: z.url().optional(),
    blurb: z.string(),
    enabled: z.boolean(),
    health: IntegrationHealth,
    /** What it's connected to, e.g. channels or repositories. */
    scopes: z.array(z.string()),
    lastSyncAt: z.iso.datetime().nullable(),
    /** Overrides the "synced …" line, e.g. "rate-limited · retrying". */
    note: z.string().optional(),
  })
  .meta({ id: "ConnectedService" });
export type ConnectedService = z.infer<typeof ConnectedService>;

export const ToggleServiceInput = z.object({ id: z.string(), enabled: z.boolean() }).meta({ id: "ToggleServiceInput" });
export type ToggleServiceInput = z.infer<typeof ToggleServiceInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listConnectedServices: { method: "GET", path: "/integrations", summary: "Integrations and their health", response: z.array(ConnectedService) },
  setServiceEnabled: { method: "PATCH", path: "/integrations/{id}", summary: "Turn an integration on or off", params: z.object({ id: z.string() }), body: ToggleServiceInput.pick({ enabled: true }) },
});

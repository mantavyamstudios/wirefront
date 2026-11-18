// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** A per-connection option, shown as a switch once the app is connected. */
export const ConnectorSetting = z
  .object({ id: z.string(), label: z.string(), hint: z.string().optional(), on: z.boolean() })
  .meta({ id: "ConnectorSetting" });
export type ConnectorSetting = z.infer<typeof ConnectorSetting>;

export const ConnectorApp = z
  .object({
    id: z.string(),
    name: z.string(),
    /** One line for the card. */
    blurb: z.string(),
    /** A paragraph for the details panel. */
    description: z.string(),
    /** Used for the category rail and grouping, e.g. "Communication". */
    category: z.string(),
    /** The colour of its icon tile. */
    tone: z.enum(["orange", "teal", "violet", "amber", "rose", "info", "success", "warning"]),
    tag: z.enum(["Popular", "New", "Beta"]).optional(),
    /** How many workspaces use it; drives "Most popular". */
    installs: z.number().int().nonnegative(),
    /** When it joined the directory (ISO date); drives "Newest". */
    addedAt: z.string(),
    connected: z.boolean(),
    /** What connecting lets it do, in plain words. */
    permissions: z.array(z.string()),
    settings: z.array(ConnectorSetting),
  })
  .meta({ id: "ConnectorApp" });
export type ConnectorApp = z.infer<typeof ConnectorApp>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listConnectorApps: { method: "GET", path: "/apps", summary: "Every app in the directory and whether it's connected", response: z.array(ConnectorApp) },
  connectApp: { method: "POST", path: "/apps/{id}/connect", summary: "Connect an app (after the user authorizes it)", params: z.object({ id: z.string() }) },
  disconnectApp: { method: "POST", path: "/apps/{id}/disconnect", summary: "Disconnect an app", params: z.object({ id: z.string() }) },
  updateConnectorSetting: {
    method: "PATCH",
    path: "/apps/{id}/settings/{settingId}",
    summary: "Turn one of a connected app's options on or off",
    params: z.object({ id: z.string(), settingId: z.string() }),
    body: z.object({ on: z.boolean() }),
  },
  requestApp: { method: "POST", path: "/app-requests", summary: "Ask for an app that isn't in the directory", body: z.object({ name: z.string() }) },
});

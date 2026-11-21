// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

/** A maintenance window, as ISO 8601 times. */
export const MaintenanceWindow = z
  .object({ startedAt: z.iso.datetime(), endsAt: z.iso.datetime() })
  .meta({ id: "MaintenanceWindow" });
export type MaintenanceWindow = z.infer<typeof MaintenanceWindow>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getMaintenance: { method: "GET", path: "/status/maintenance", summary: "The current maintenance window", response: MaintenanceWindow },
  subscribeToUpdates: { method: "POST", path: "/status/subscriptions", summary: "Email me when maintenance ends" },
});

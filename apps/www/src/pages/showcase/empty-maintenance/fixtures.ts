// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { MaintenanceWindow } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-10-24T12:06:00Z";

/** What the mocks return for `getMaintenance`. */
export const getMaintenance: MaintenanceWindow = { startedAt: "2026-10-24T12:00:00Z", endsAt: "2026-10-24T12:18:00Z" };

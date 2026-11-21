// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { DayRange } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-09T12:00:00Z";
/** The last 14 days up to `now`. */
export const defaultRange: DayRange = { from: "2026-03-27", to: "2026-04-09" };

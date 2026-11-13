// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ExportSection } from "./view";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-25T12:00:00Z";

export const sections: ExportSection[] = [
  { id: "summary", label: "Summary metrics", defaultIncluded: true },
  { id: "events", label: "All events", defaultIncluded: true },
  { id: "users", label: "User attributes" },
  { id: "raw", label: "Raw payloads" },
];

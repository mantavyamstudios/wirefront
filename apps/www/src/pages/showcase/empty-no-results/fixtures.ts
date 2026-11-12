// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ActiveFilter } from "./schema";

/** Demo data for the showcase and tests. */
export const query = "invoice 2024-Q4";
export const filters: ActiveFilter[] = [
  { id: "status", label: "status:open" },
  { id: "owner", label: "owner:me" },
  { id: "label", label: "label:billing" },
];

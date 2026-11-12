// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { WorkspaceSummary } from "./schema";

/** What the mocks return for `getWorkspaceSummary`. */
export const getWorkspaceSummary: WorkspaceSummary = {
  id: "ws_acme",
  slug: "acme-prod",
  projects: 12,
  documents: 84,
  members: 28,
  backupDays: 30,
};

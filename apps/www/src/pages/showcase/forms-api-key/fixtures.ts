// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { NewApiKey } from "./schema";
import type { ApiScopeGroup } from "./view";

/** Demo data for the showcase, the generated mocks and tests. */
export const scopeGroups: ApiScopeGroup[] = [
  {
    id: "read",
    label: "Read",
    scopes: [
      { id: "read:projects", description: "List and read project metadata." },
      { id: "read:members", description: "List members and their roles." },
      { id: "read:audit", description: "Read the last 90 days of activity." },
    ],
  },
  {
    id: "write",
    label: "Write",
    scopes: [
      { id: "write:projects", description: "Create, update, and archive projects." },
      { id: "write:members", description: "Invite, remove, and change roles.", destructive: true },
    ],
  },
];

export const defaultScopes = ["read:projects", "read:members"];

/** What the mocks return for `createApiKey`. */
export const createApiKey: NewApiKey = { id: "key_1", secret: "wf_live_8f4a2c91d0b7e635" };

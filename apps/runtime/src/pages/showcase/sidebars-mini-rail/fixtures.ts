// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { RailWorkspace } from "./schema";

/** What the mocks return for `listWorkspaces`. Demo data for the showcase and tests. */
export const listWorkspaces: RailWorkspace[] = [
  { id: "acme", name: "Acme inc.", color: 5 },
  { id: "bluefin", name: "Bluefin", color: 2 },
  { id: "moonbase", name: "Moonbase", color: 3 },
];

export const user = { name: "Sam Rivera" };

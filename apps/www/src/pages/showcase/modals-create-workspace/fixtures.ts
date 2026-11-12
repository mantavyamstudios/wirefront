// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Workspace } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const defaultName = "Acme studios";
export const urlPrefix = "acme.dev/";
export const teamDomain = "acme.dev";
export const takenSlugs = ["acme", "acme-prod"];

/** What the mocks return for `checkSlug`. */
export const checkSlug = { available: true };

/** What the mocks return for `createWorkspace`. */
export const createWorkspace: Workspace = { id: "ws_new", name: "Acme studios", slug: "acme-studios", visibility: "team" };

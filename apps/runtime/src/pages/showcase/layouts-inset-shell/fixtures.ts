// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import type { InsetShellContext } from "./schema";

/** What the mocks return for `getShellContext`. */
export const getShellContext: InsetShellContext = {
  user: { name: "Ines Moreau", email: "ines@northwind.dev" },
  workspace: { id: "northwind", name: "Northwind Labs", plan: "Team" },
  workspaces: [
    { id: "northwind", name: "Northwind Labs", plan: "Team" },
    { id: "fable", name: "Fable & Co", plan: "Free" },
    { id: "pilot", name: "Pilot Studio", plan: "Business" },
  ],
  unread: 4,
};


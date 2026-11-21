// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { HairlineProject, HairlineWorkspace } from "./schema";

/** What the mocks return for `getHairlineSidebar`. The sample issue tracker lives in demo.tsx. */
export const getHairlineSidebar: { workspaces: HairlineWorkspace[]; projects: HairlineProject[] } = {
  workspaces: [
    { id: "northwind", name: "Northwind", color: 1 },
    { id: "pilot", name: "Pilot Studio", color: 6 },
  ],
  projects: [
    { id: "billing", name: "Billing v2", href: "/projects/billing", color: 6, count: 12 },
    { id: "atlas", name: "Atlas redesign", href: "/projects/atlas", color: 7, count: 5 },
  ],
};

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const HairlineWorkspace = z.object({ id: z.string(), name: z.string(), /** One of the eight category colours. */ color: z.int().min(1).max(8) }).meta({ id: "HairlineWorkspace" });
export type HairlineWorkspace = z.infer<typeof HairlineWorkspace>;

export const HairlineProject = z
  .object({ id: z.string(), name: z.string(), href: z.string(), color: z.int().min(1).max(8), /** Open items, shown on the right. */ count: z.int().min(0).optional() })
  .meta({ id: "HairlineProject" });
export type HairlineProject = z.infer<typeof HairlineProject>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getHairlineSidebar: {
    method: "GET",
    path: "/me/sidebar",
    summary: "Workspaces and projects for the sidebar",
    response: z.object({ workspaces: z.array(HairlineWorkspace), projects: z.array(HairlineProject) }),
  },
});

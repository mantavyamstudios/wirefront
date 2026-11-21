// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Tip = z
  .object({ id: z.string(), title: z.string(), body: z.string(), /** Its place in the tip series, 1-based. */ position: z.number().int().min(1), total: z.number().int().min(1) })
  .meta({ id: "Tip" });
export type Tip = z.infer<typeof Tip>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getNextTip: { method: "GET", path: "/me/tips/next", summary: "The next tip to show, if any", response: Tip },
  dismissTip: { method: "POST", path: "/me/tips/{id}/dismiss", summary: "Hide a tip for good", params: z.object({ id: z.string() }) },
});

// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Announcement = z
  .object({ id: z.string(), title: z.string(), message: z.string(), tone: z.enum(["info", "warning"]), href: z.string().optional() })
  .meta({ id: "Announcement" });
export type Announcement = z.infer<typeof Announcement>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getAnnouncement: { method: "GET", path: "/announcements/current", summary: "The current system announcement, if any", response: Announcement },
  dismissAnnouncement: { method: "POST", path: "/announcements/{id}/dismiss", summary: "Hide an announcement for this user", params: z.object({ id: z.string() }) },
});

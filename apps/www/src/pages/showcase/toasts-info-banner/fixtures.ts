// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Announcement } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const getAnnouncement: Announcement = {
  id: "maint-0429",
  title: "Scheduled maintenance",
  message: "Tue Apr 29 from 2:00–2:30 UTC. Brief downtime expected.",
  tone: "warning",
  href: "#status",
};

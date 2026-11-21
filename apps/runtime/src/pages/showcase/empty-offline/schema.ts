// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { defineApi } from "@wirefront/ui/wirefront/api";

/** The backend operations this screen calls. */
export const api = defineApi({
  checkConnection: { method: "GET", path: "/health", summary: "Whether the app can reach the server again" },
});

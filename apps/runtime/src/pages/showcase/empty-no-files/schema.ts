// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { defineApi } from "@wirefront/ui/wirefront/api";

/** The backend operations this screen calls. */
export const api = defineApi({
  uploadFiles: {
    method: "POST",
    path: "/files",
    summary: "Upload files (multipart/form-data, one part per file)",
  },
});

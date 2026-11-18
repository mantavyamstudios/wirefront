// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ExportFormat = z.enum(["csv", "json", "pdf"]).meta({ id: "ExportFormat" });
export type ExportFormat = z.infer<typeof ExportFormat>;

/** What "Export" sends. */
export const ExportInput = z
  .object({
    format: ExportFormat,
    from: z.iso.datetime(),
    to: z.iso.datetime(),
    /** Ids of the sections to include. */
    include: z.array(z.string()).min(1, "Pick at least one thing to export."),
  })
  .meta({ id: "ExportInput" });
export type ExportInput = z.infer<typeof ExportInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  requestExport: { method: "POST", path: "/exports", summary: "Start an export; the download link is emailed when it's ready", body: ExportInput },
});

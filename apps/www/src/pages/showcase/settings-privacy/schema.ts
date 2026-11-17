// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { z } from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const ExportCategory = z
  .object({ id: z.string(), label: z.string(), hint: z.string(), bytes: z.number().int().nonnegative(), includedByDefault: z.boolean() })
  .meta({ id: "ExportCategory" });
export type ExportCategory = z.infer<typeof ExportCategory>;

export const DataExport = z
  .object({
    status: z.enum(["running", "ready"]),
    /** 0–100 while running. */
    progress: z.number().min(0).max(100),
    fileName: z.string(),
    /** Where to download it once ready. */
    downloadUrl: z.string().optional(),
    expiresAt: z.iso.datetime({ offset: true }).optional(),
  })
  .meta({ id: "DataExport" });
export type DataExport = z.infer<typeof DataExport>;

/** Days to keep something; null keeps it forever. */
export const RetentionDays = z.union([z.literal(30), z.literal(90), z.literal(180), z.literal(365), z.null()]).meta({ id: "RetentionDays" });
export type RetentionDays = z.infer<typeof RetentionDays>;

export const RetentionRule = z
  .object({
    id: z.string(),
    label: z.string(),
    /** Plural noun for the preview sentence, e.g. "Messages". */
    noun: z.string(),
    days: RetentionDays,
  })
  .meta({ id: "RetentionRule" });
export type RetentionRule = z.infer<typeof RetentionRule>;

export const PrivacySettings = z
  .object({
    /** Where the export link is emailed. */
    email: z.email(),
    categories: z.array(ExportCategory),
    /** The latest export, if one is running or ready. */
    latestExport: DataExport.nullable(),
    retention: z.array(RetentionRule),
    /** Set while the account is queued for deletion. */
    deletion: z.object({ requestedAt: z.iso.datetime({ offset: true }), scheduledFor: z.iso.datetime({ offset: true }) }).nullable(),
  })
  .meta({ id: "PrivacySettings" });
export type PrivacySettings = z.infer<typeof PrivacySettings>;

export const RequestExportInput = z.object({ categories: z.array(z.string()).min(1, "Choose at least one category.") }).meta({ id: "RequestExportInput" });
export type RequestExportInput = z.infer<typeof RequestExportInput>;

export const SetRetentionInput = z.object({ id: z.string(), days: RetentionDays }).meta({ id: "SetRetentionInput" });
export type SetRetentionInput = z.infer<typeof SetRetentionInput>;

/** The backend operations this screen calls. */
export const api = defineApi({
  getPrivacy: { method: "GET", path: "/me/privacy", summary: "Export options, the latest export, retention rules and deletion status", response: PrivacySettings },
  requestExport: { method: "POST", path: "/me/exports", summary: "Start building an archive of the chosen categories", body: RequestExportInput, response: DataExport },
  setRetention: {
    method: "PUT",
    path: "/me/retention/{id}",
    summary: "Change how long a kind of data is kept",
    params: z.object({ id: z.string() }),
    body: SetRetentionInput.pick({ days: true }),
    errors: { 403: "Your workspace requires a shorter period" },
  },
  requestDeletion: { method: "POST", path: "/me/deletion", summary: "Queue the account for deletion after the grace period" },
  cancelDeletion: { method: "DELETE", path: "/me/deletion", summary: "Cancel a queued deletion" },
});

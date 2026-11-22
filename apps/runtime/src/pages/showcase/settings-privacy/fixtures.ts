// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { DataExport, PrivacySettings } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const now = "2026-04-26T10:00:00Z";
const MB = 1024 * 1024;

export const getPrivacy: PrivacySettings = {
  email: "hello@example.com",
  categories: [
    {
      id: "messages",
      label: "Messages",
      hint: "Direct + channel",
      bytes: 412 * MB,
      includedByDefault: true,
    },
    {
      id: "files",
      label: "Files & uploads",
      hint: "Originals only",
      bytes: 1638 * MB,
      includedByDefault: true,
    },
    {
      id: "comments",
      label: "Comments",
      hint: "All threads",
      bytes: 38 * MB,
      includedByDefault: true,
    },
    {
      id: "activity",
      label: "Activity log",
      hint: "Last 12 months",
      bytes: 104 * MB,
      includedByDefault: false,
    },
    {
      id: "calendar",
      label: "Calendar events",
      hint: "ICS + metadata",
      bytes: 12 * MB,
      includedByDefault: false,
    },
  ],
  latestExport: null,
  retention: [
    { id: "dms", label: "Direct messages", noun: "Messages", days: 90 },
    {
      id: "activity",
      label: "Activity log",
      noun: "Activity entries",
      days: 180,
    },
    { id: "deleted", label: "Deleted items", noun: "Items in trash", days: 30 },
    { id: "audit", label: "Audit log", noun: "Audit events", days: 365 },
  ],
  deletion: null,
};

export const requestExport: DataExport = {
  status: "running",
  progress: 0,
  fileName: "export-2026-04-26.zip",
};
export const readyExport: DataExport = {
  status: "ready",
  progress: 100,
  fileName: "export-2026-04-26.zip",
  downloadUrl: "#download-export",
  expiresAt: "2026-04-27T10:00:00Z",
};
export const pendingDeletion = {
  requestedAt: "2026-04-19T10:00:00Z",
  scheduledFor: "2026-05-19T00:00:00Z",
};

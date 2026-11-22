// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { UploadItem } from "./schema";

/** Demo data for the showcase, the generated mocks and tests. */
export const uploads: UploadItem[] = [
  {
    id: "u1",
    name: "brand-system-2026.fig",
    size: 13_002_342,
    progress: 100,
    state: "done",
  },
  {
    id: "u2",
    name: "homepage-hero.png",
    size: 2_936_013,
    progress: 76,
    state: "uploading",
  },
  {
    id: "u3",
    name: "annual-report.pdf",
    size: 8_493_465,
    progress: 42,
    state: "uploading",
  },
  {
    id: "u4",
    name: "moodboard-04.zip",
    size: 150_994_944,
    progress: 12,
    state: "paused",
  },
];

/** What the mocks return for `createUpload`. */
export const createUpload = {
  id: "u5",
  uploadUrl: "https://storage.example.com/upload/u5",
};

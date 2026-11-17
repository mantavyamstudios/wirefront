// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { Upload } from "./schema";

/** Demo data for the showcase and tests. */
export const uploads: Upload[] = [
  { id: "u1", name: "preview-render-4k.png", bytes: 8_493_465, kind: "image", progress: 0.28 },
  { id: "u2", name: "Q3-roadmap.pdf", bytes: 700_416, kind: "doc", progress: 0.62 },
];

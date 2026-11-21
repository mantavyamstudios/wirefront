// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Adapted from the Enterprise UI Playground's lib/flows/source.ts (MIT).
import { loader } from "fumadocs-core/source";
import type { InferPageType } from "fumadocs-core/source";

import { screens } from "@/.source";

/** Screen pages: `content/screens/<group>/<kind>/<screen>.mdx` at `/<group>/<kind>/<screen>`. */
export const screensSource = loader({
  baseUrl: "/",
  source: screens.toFumadocsSource(),
});

export type ScreenDocPage = InferPageType<typeof screensSource>;

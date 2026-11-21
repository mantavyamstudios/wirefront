// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Adapted from the Enterprise UI Playground's lib/flows/source-files.ts (MIT).
import { readFileSync } from "node:fs";
import path from "node:path";

import { highlightCode } from "@/lib/shiki";

import manifestJson from "./screens.manifest.json";

/** One source file of a screen, highlighted for both themes. */
export interface ScreenSourceFile {
  code: string;
  html: string;
  /** Display path, relative to apps/runtime/src/pages/showcase. */
  path: string;
  /** Every file shown is the screen's own (what the registry installs). */
  scope: "flow" | "shared";
}

interface ManifestScreen {
  files: string[];
  slug: string;
}

const manifest = manifestJson as {
  groups: { kinds: { slug: string; screens: ManifestScreen[] }[] }[];
};

/** `apps/runtime/src/pages/showcase`, resolved from `apps/www` (the Next.js cwd). */
const SHOWCASE = path.resolve(process.cwd(), "../runtime/src/pages/showcase");

const languageOf = (file: string) => (file.endsWith(".tsx") ? "tsx" : "typescript");

/** The files a screen installs: view.tsx, schema.ts and fixtures.ts, or its single file. */
export async function getScreenSourceFiles(kind: string, screen: string): Promise<ScreenSourceFile[] | null> {
  const found = manifest.groups
    .flatMap((g) => g.kinds)
    .find((k) => k.slug === kind)
    ?.screens.find((s) => s.slug === screen);
  if (!found) {
    return null;
  }
  return Promise.all(
    found.files.map(async (file) => {
      const code = readFileSync(path.join(SHOWCASE, file), "utf-8");
      return { code, html: await highlightCode(code, languageOf(file)), path: file, scope: "flow" as const };
    }),
  );
}

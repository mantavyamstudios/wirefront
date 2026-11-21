// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Whether a screen is ready to wire: it lives in its own folder with a
 * view.tsx (SCREEN-CONTRACT.md), which the contract checker, the wiring tests
 * and the browser check hold to the definition of done. Everything else is a
 * preview. Derived from the files, so the badge can't drift from the code.
 */
import type { CategorySlug } from "./designs";
import { SOURCE_FILES } from "../pages/showcase/source-files";

const VIEWS = import.meta.glob("../pages/showcase/*/view.tsx");
const READY_FOLDERS = new Set(Object.keys(VIEWS).map((path) => path.split("/").at(-2)));

export type Readiness = "ready" | "preview";

export function readinessOf(category: CategorySlug, design: string): Readiness {
  const file = SOURCE_FILES[category]?.[design];
  return file && READY_FOLDERS.has(file) ? "ready" : "preview";
}

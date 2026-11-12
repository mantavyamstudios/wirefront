// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { ComponentType } from "react";
import type { CategorySlug } from "@/lib/designs";
import { SOURCE_FILES } from "./source-files";

type ShowcaseModule = Record<string, ComponentType>;

// Flat screens are ./<file>.tsx; ready-to-wire screens are folders whose
// showcase wiring lives in ./<file>/demo.tsx (see SCREEN-CONTRACT.md).
const MODULES = import.meta.glob<ShowcaseModule>(["./*.tsx", "./*/demo.tsx"], {
  eager: true,
}) as Record<string, ShowcaseModule>;

function pickShowcase(mod: ShowcaseModule | undefined): ComponentType | undefined {
  if (!mod) return undefined;
  for (const [name, value] of Object.entries(mod)) {
    if (name.endsWith("ShowcasePage") && typeof value === "function") {
      return value;
    }
  }
  return undefined;
}

type Showcase = Record<string, ComponentType>;

function buildShowcases(): Partial<Record<CategorySlug, Showcase>> {
  const out: Partial<Record<CategorySlug, Showcase>> = {};
  for (const [category, designs] of Object.entries(SOURCE_FILES) as Array<
    [CategorySlug, Record<string, string>]
  >) {
    if (!designs) continue;
    const entry: Showcase = {};
    for (const [designSlug, filename] of Object.entries(designs)) {
      // A sibling <file>.showcase.tsx holds showcase-only wiring (demo
      // assets, fixtures) that the registry doesn't ship; prefer it.
      const component =
        pickShowcase(MODULES[`./${filename}/demo.tsx`]) ??
        pickShowcase(MODULES[`./${filename}.showcase.tsx`]) ??
        pickShowcase(MODULES[`./${filename}.tsx`]);
      if (component) entry[designSlug] = component;
    }
    out[category] = entry;
  }
  return out;
}

export const SHOWCASES: Partial<Record<CategorySlug, Showcase>> = buildShowcases();

export function getShowcase(
  category: CategorySlug,
  design: string,
): ComponentType | undefined {
  return SHOWCASES[category]?.[design];
}

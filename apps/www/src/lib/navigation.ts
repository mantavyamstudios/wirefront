// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import { CATEGORIES } from "@/lib/designs";
import { getShowcase } from "@/pages/showcase/registry";

/** A design's address: `/c/<category>/<design>`. */
export type DesignTarget = { category: string; design: string };

/** Any other design that has a showcase, chosen at random (the R key). */
export function pickRandomDesign(
  current: DesignTarget,
  random: () => number = Math.random,
): DesignTarget | null {
  const all = CATEGORIES.flatMap((c) =>
    c.designs
      .filter((d) => !!getShowcase(c.slug, d.slug))
      .map((d) => ({ category: c.slug, design: d.slug })),
  );
  const others = all.filter(
    (d) => !(d.category === current.category && d.design === current.design),
  );
  if (others.length === 0) return null;
  return others[Math.floor(random() * others.length)] ?? null;
}

/** The previous or next design in the same category, wrapping around (← →). */
export function siblingDesign(
  current: DesignTarget,
  delta: 1 | -1,
): DesignTarget | null {
  const cat = CATEGORIES.find((c) => c.slug === current.category);
  if (!cat) return null;
  const designs = cat.designs.filter((d) => !!getShowcase(cat.slug, d.slug));
  if (designs.length === 0) return null;
  const idx = designs.findIndex((d) => d.slug === current.design);
  if (idx === -1) return null;
  const nextIdx = (idx + delta + designs.length) % designs.length;
  const next = designs[nextIdx];
  return next ? { category: cat.slug, design: next.slug } : null;
}

/** The first design of the previous or next category, wrapping around (↑ ↓). */
export function siblingCategory(
  current: DesignTarget,
  delta: 1 | -1,
): DesignTarget | null {
  const populated = CATEGORIES.filter((c) =>
    c.designs.some((d) => !!getShowcase(c.slug, d.slug)),
  );
  if (populated.length <= 1) return null;
  const idx = populated.findIndex((c) => c.slug === current.category);
  if (idx === -1) return null;
  const nextIdx = (idx + delta + populated.length) % populated.length;
  const nextCat = populated[nextIdx];
  if (!nextCat) return null;
  const firstDesign = nextCat.designs.find(
    (d) => !!getShowcase(nextCat.slug, d.slug),
  );
  return firstDesign
    ? { category: nextCat.slug, design: firstDesign.slug }
    : null;
}

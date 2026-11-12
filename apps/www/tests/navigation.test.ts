// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/** The interaction panel's previous/next, group and random navigation. */
import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/designs";
import { must } from "./must";
import { type DesignTarget, pickRandomDesign, siblingCategory, siblingDesign } from "@/lib/navigation";

const first = must(CATEGORIES[0], "a category");
const last = must(CATEGORIES.at(-1), "a category");
const at = (c: (typeof CATEGORIES)[number], i: number): DesignTarget => ({ category: c.slug, design: must(c.designs.at(i), `design ${i} in ${c.slug}`).slug });

describe("siblingDesign (← →)", () => {
  it("moves to the next and previous design in the category", () => {
    expect(siblingDesign(at(first, 0), 1)).toEqual(at(first, 1));
    expect(siblingDesign(at(first, 1), -1)).toEqual(at(first, 0));
  });

  it("wraps around at both ends", () => {
    expect(siblingDesign(at(first, -1), 1)).toEqual(at(first, 0));
    expect(siblingDesign(at(first, 0), -1)).toEqual(at(first, -1));
  });

  it("visits every design in a category exactly once per cycle", () => {
    for (const c of CATEGORIES) {
      const seen = new Set<string>();
      let cur = at(c, 0);
      for (let i = 0; i < c.designs.length; i++) {
        seen.add(cur.design);
        cur = must(siblingDesign(cur, 1), "a next design");
      }
      expect(seen.size, c.slug).toBe(c.designs.length);
      expect(cur, c.slug).toEqual(at(c, 0));
    }
  });

  it("returns null for an unknown category or design", () => {
    expect(siblingDesign({ category: "nope", design: "x" }, 1)).toBeNull();
    expect(siblingDesign({ category: first.slug, design: "nope" }, 1)).toBeNull();
  });
});

describe("siblingCategory (↑ ↓)", () => {
  it("lands on the first design of the next and previous category", () => {
    const second = must(CATEGORIES[1], "a second category");
    expect(siblingCategory(at(first, 2), 1)).toEqual(at(second, 0));
    expect(siblingCategory(at(second, 0), -1)).toEqual(at(first, 0));
  });

  it("wraps around at both ends", () => {
    expect(siblingCategory(at(last, 0), 1)).toEqual(at(first, 0));
    expect(siblingCategory(at(first, 0), -1)).toEqual(at(last, 0));
  });

  it("returns null for an unknown category", () => {
    expect(siblingCategory({ category: "nope", design: "x" }, 1)).toBeNull();
  });
});

describe("pickRandomDesign (R)", () => {
  it("never returns the current design", () => {
    const current = at(first, 0);
    for (const r of [0, 0.25, 0.5, 0.75, 0.999999]) {
      expect(pickRandomDesign(current, () => r)).not.toEqual(current);
    }
  });

  it("can reach every other design", () => {
    const total = CATEGORIES.reduce((n, c) => n + c.designs.length, 0);
    const current = at(first, 0);
    const seen = new Set<string>();
    for (let i = 0; i < total - 1; i++) {
      const pick = must(pickRandomDesign(current, () => (i + 0.5) / (total - 1)), "a random design");
      seen.add(`${pick.category}/${pick.design}`);
    }
    expect(seen.size).toBe(total - 1);
  });
});

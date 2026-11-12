// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/** The registry builder reads designs.ts as text; it must see exactly the real catalogue. */
import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/designs";
import { readDesignMeta, readTokenValues, tokensUsed, WIREFRONT_TOKENS } from "../../../scripts/lib/registry-meta";

describe("registry metadata", () => {
  it("parses every design's slug, title, blurb and states from designs.ts", () => {
    const real = CATEGORIES.flatMap((c) =>
      c.designs.map((d) => ({ category: c.slug, slug: d.slug, title: d.title, blurb: d.blurb, ...(d.states ? { states: d.states } : {}) })),
    );
    expect(readDesignMeta()).toEqual(real);
  });

  it("reads a light value for every Wirefront token from styles.css", () => {
    const { light } = readTokenValues();
    expect(WIREFRONT_TOKENS.filter((t) => !light[t])).toEqual([]);
  });

  it("detects token use in class names and CSS variables", () => {
    expect(tokensUsed('className="bg-success/8 text-success-foreground ring-info" style={{ color: "var(--brand-ink)" }}')).toEqual([
      "brand-ink",
      "info",
      "success",
      "success-foreground",
    ]);
    expect(tokensUsed('className="bg-emerald-500 text-successful"')).toEqual([]);
  });
});

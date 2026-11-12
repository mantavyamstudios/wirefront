// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/** The state switcher's URL handling (apps/www/src/lib/showcase-state.tsx). */
import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/designs";
import { nextScreenState, parseScreenState, SCREEN_STATES } from "@/lib/showcase-state";

describe("screen states", () => {
  it("accepts only states the design supports, otherwise ready", () => {
    expect(parseScreenState("loading", ["ready", "loading"])).toBe("loading");
    expect(parseScreenState("error", ["ready", "loading"])).toBe("ready");
    expect(parseScreenState("bogus", [...SCREEN_STATES])).toBe("ready");
    expect(parseScreenState(undefined, ["ready", "loading"])).toBe("ready");
    expect(parseScreenState("loading")).toBe("ready");
  });

  it("cycles through the supported states with S", () => {
    const states = ["ready", "loading", "empty"] as const;
    expect(nextScreenState("ready", states)).toBe("loading");
    expect(nextScreenState("empty", states)).toBe("ready");
    expect(nextScreenState("ready", [])).toBe("ready");
  });

  it("only lists known states in the catalogue, starting with ready", () => {
    for (const c of CATEGORIES)
      for (const d of c.designs) {
        if (!d.states) continue;
        expect(d.states.every((s) => (SCREEN_STATES as readonly string[]).includes(s)), `${c.slug}/${d.slug}`).toBe(true);
        expect(d.states[0], `${c.slug}/${d.slug}`).toBe("ready");
      }
  });
});

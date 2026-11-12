// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Every design page is server-rendered on each request (TanStack Start), so
 * every screen must render on the server without throwing, inside the same
 * ThemeProvider the app wraps it in.
 */
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@wirefront/ui/theme-provider";
import { CATEGORIES } from "@/lib/designs";
import { getShowcase } from "@/pages/showcase/registry";

const designs = CATEGORIES.flatMap((c) => c.designs.map((d) => [`${c.slug}/${d.slug}`, c.slug, d.slug] as const));

describe("server render", () => {
  it.each(designs)("%s renders", (_, category, slug) => {
    const Showcase = getShowcase(category, slug);
    if (!Showcase) throw new Error(`no showcase for ${category}/${slug}`);
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const html = renderToString(
        <ThemeProvider>
          <Showcase />
        </ThemeProvider>,
      );
      expect(html.length).toBeGreaterThan(0);
      // React reports render problems (bad keys, invalid nesting…) via console.error.
      expect(errors.mock.calls.map((args) => String(args[0]).slice(0, 300))).toEqual([]);
    } finally {
      errors.mockRestore();
    }
  });
});

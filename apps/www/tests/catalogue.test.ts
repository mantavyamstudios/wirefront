// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * The catalogue is three hand-maintained lists that must agree:
 * designs.ts (what the site lists), source-files.ts (which file renders it)
 * and the showcase files themselves. Previews are generated per design.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/designs";
import { getShowcase } from "@/pages/showcase/registry";
import { SOURCE_FILES } from "@/pages/showcase/source-files";
import { must } from "./must";

const WWW = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOWCASE_DIR = path.join(WWW, "src/pages/showcase");
const PREVIEWS_DIR = path.join(WWW, "public/previews");

const designs = CATEGORIES.flatMap((c) => c.designs.map((d) => ({ category: c.slug, ...d })));

describe("catalogue", () => {
  it("has unique category slugs", () => {
    const slugs = CATEGORIES.map((c) => c.slug);
    expect(slugs).toEqual([...new Set(slugs)]);
  });

  it.each(CATEGORIES.map((c) => [c.slug, c] as const))("%s: has unique design slugs, an icon and designs", (_, c) => {
    const slugs = c.designs.map((d) => d.slug);
    expect(slugs).toEqual([...new Set(slugs)]);
    expect(c.designs.length).toBeGreaterThan(0);
    expect(typeof c.Icon).toBe("function");
  });

  it("gives every design a title and a blurb", () => {
    const incomplete = designs.filter((d) => !d.title.trim() || !d.blurb.trim());
    expect(incomplete.map((d) => `${d.category}/${d.slug}`)).toEqual([]);
  });

  it("maps every listed design to an existing showcase file", () => {
    const problems: string[] = [];
    for (const d of designs) {
      const file = SOURCE_FILES[d.category]?.[d.slug];
      if (!file) problems.push(`${d.category}/${d.slug}: not in source-files.ts`);
      else if (!existsSync(path.join(SHOWCASE_DIR, `${file}.tsx`))) problems.push(`${d.category}/${d.slug}: ${file}.tsx missing`);
    }
    expect(problems).toEqual([]);
  });

  it("finds a *ShowcasePage component for every listed design", () => {
    const missing = designs.filter((d) => !getShowcase(d.category, d.slug));
    expect(missing.map((d) => `${d.category}/${d.slug}`)).toEqual([]);
  });

  it("lists every design that source-files.ts maps", () => {
    const listed = new Set(designs.map((d) => `${d.category}/${d.slug}`));
    const unlisted = Object.entries(SOURCE_FILES).flatMap(([category, map]) =>
      Object.keys(map ?? {})
        .map((slug) => `${category}/${slug}`)
        .filter((key) => !listed.has(key)),
    );
    expect(unlisted).toEqual([]);
  });

  it("has no showcase file that nothing maps to or imports", () => {
    const mapped = new Set(Object.values(SOURCE_FILES).flatMap((map) => Object.values(map ?? {})));
    // Shared helpers (e.g. auth-shell) are imported by screens rather than mapped.
    const imported = new Set(
      [...mapped].flatMap((f) =>
        [...readFileSync(path.join(SHOWCASE_DIR, `${f}.tsx`), "utf8").matchAll(/from\s+["']\.\/([\w-]+)["']/g)].map((m) => must(m[1], "an import name")),
      ),
    );
    const orphans = readdirSync(SHOWCASE_DIR)
      .filter((f) => f.endsWith(".tsx") && !f.startsWith("_") && f !== "registry.tsx")
      .map((f) => f.replace(/\.tsx$/, ""))
      .filter((f) => !mapped.has(f) && !imported.has(f));
    expect(orphans).toEqual([]);
  });

  it("has a light and a dark preview for every design", () => {
    const missing = designs.flatMap((d) =>
      (["light", "dark"] as const)
        .map((mode) => `${d.category}__${d.slug}--${mode}.png`)
        .filter((file) => !existsSync(path.join(PREVIEWS_DIR, file))),
    );
    expect(missing).toEqual([]);
  });

  it("has no preview for a design that no longer exists", () => {
    const expected = new Set(designs.flatMap((d) => [`${d.category}__${d.slug}--light.png`, `${d.category}__${d.slug}--dark.png`]));
    const stale = readdirSync(PREVIEWS_DIR).filter((f) => f.endsWith(".png") && !expected.has(f));
    expect(stale).toEqual([]);
  });
});

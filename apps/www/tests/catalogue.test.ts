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
import { componentName, getShowcase } from "@/pages/showcase/registry";
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
      // A flat screen is <file>.tsx; a ready-to-wire screen is a <file>/ folder.
      else if (!existsSync(path.join(SHOWCASE_DIR, `${file}.tsx`)) && !existsSync(path.join(SHOWCASE_DIR, file, "view.tsx")))
        problems.push(`${d.category}/${d.slug}: neither ${file}.tsx nor ${file}/view.tsx exists`);
    }
    expect(problems).toEqual([]);
  });

  it("ships each flat screen as a component named for it, keeping *ShowcasePage out of shipped files", () => {
    const problems: string[] = [];
    for (const map of Object.values(SOURCE_FILES)) {
      for (const file of Object.values(map ?? {})) {
        const flat = path.join(SHOWCASE_DIR, `${file}.tsx`);
        if (!existsSync(flat)) continue;
        const source = readFileSync(flat, "utf8");
        if (/\bexport\s+function\s+\w+ShowcasePage\b/.test(source)) problems.push(`${file}.tsx exports a *ShowcasePage`);
        const hasCompanion = existsSync(path.join(SHOWCASE_DIR, `${file}.showcase.tsx`));
        if (!hasCompanion && !new RegExp(`\\bexport\\s+function\\s+${componentName(file)}\\b`).test(source))
          problems.push(`${file}.tsx doesn't export ${componentName(file)}`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("respects prefers-reduced-motion: Motion screens check it, decorative CSS animations stop", () => {
    // animate-spin is allowed: a spinner conveys that something is loading (WCAG's "essential" case).
    const decorative = /(?<![\w:/-])animate-(?!spin\b|none\b|in\b|out\b)[\w[\]-]+/;
    const problems: string[] = [];
    for (const map of Object.values(SOURCE_FILES)) {
      for (const file of Object.values(map ?? {})) {
        for (const source of [path.join(SHOWCASE_DIR, `${file}.tsx`), path.join(SHOWCASE_DIR, file, "view.tsx")].filter((f) => existsSync(f))) {
          const code = readFileSync(source, "utf8");
          const where = path.relative(SHOWCASE_DIR, source);
          // shadcn's Skeleton pulses with no reduced-motion variant; screens pass one.
          for (const tag of code.matchAll(/<Skeleton\b[^>]*>/g))
            if (!tag[0].includes("motion-reduce:animate-none")) problems.push(`${where}: <Skeleton> without motion-reduce:animate-none`);
          if (/from\s+["']motion\/react["']/.test(code) && !/useReducedMotion|MotionConfig/.test(code))
            problems.push(`${where}: uses motion without useReducedMotion or MotionConfig`);
          for (const m of code.matchAll(/(["'`])((?:(?!\1)[^\\\n]|\\.)*)\1/g)) {
            const classes = m[2] ?? "";
            if (decorative.test(classes) && !/motion-(?:reduce|safe):/.test(classes)) problems.push(`${where}: "${classes.slice(0, 80)}"`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("uses logical direction classes so screens mirror in right-to-left languages", () => {
    // ms/me/ps/pe, start/end, text-start/end, border-s/e, rounded-s/e instead of their left/right forms.
    // A left/right offset paired with translate-x in the same class string stays physical: centring
    // (left-1/2 -translate-x-1/2) and slide-ins pair a side with a translate that doesn't mirror.
    const physical =
      /(?<![\w[\]/.-])-?(?:m[lr]|p[lr]|scroll-[mp][lr]|border-[lr]|rounded-(?:[lr]|tl|tr|bl|br)|text-(?:left|right)|float-(?:left|right))(?![\w])(?:-[\w[\]./%()#,]+)?(?![\w-])/;
    const side = /(?<![\w[\]/.-])-?(?:left|right)-(?!1\/2\b)[\w[\]./%()#,-]+/;
    const problems: string[] = [];
    for (const map of Object.values(SOURCE_FILES)) {
      for (const file of Object.values(map ?? {})) {
        for (const source of [path.join(SHOWCASE_DIR, `${file}.tsx`), path.join(SHOWCASE_DIR, file, "view.tsx")].filter((f) => existsSync(f))) {
          for (const m of withoutCodeSamples(readFileSync(source, "utf8")).matchAll(/(["`])((?:(?!\1)[^\\\n])*)\1/g)) {
            const classes = m[2] ?? "";
            const hit = classes.match(physical)?.[0] ?? (/translate-x/.test(classes) ? undefined : classes.match(side)?.[0]);
            if (hit) problems.push(`${path.relative(SHOWCASE_DIR, source)}: ${hit}`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("doesn't ship shadcn primitives that break the templates' typecheck", () => {
    // shadcn's scroll-area keeps an unused React import that fails the strict typecheck of shadcn's own
    // Vite and TanStack Start templates; use ScrollRegion (@wirefront/ui/wirefront/scroll-region) instead.
    const broken = ["scroll-area"];
    const problems: string[] = [];
    for (const map of Object.values(SOURCE_FILES)) {
      for (const file of Object.values(map ?? {})) {
        for (const source of [path.join(SHOWCASE_DIR, `${file}.tsx`), path.join(SHOWCASE_DIR, file, "view.tsx")].filter((f) => existsSync(f))) {
          for (const name of broken)
            if (readFileSync(source, "utf8").includes(`"@wirefront/ui/${name}"`)) problems.push(`${path.relative(SHOWCASE_DIR, source)}: ${name}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("strips only the text of multi-line code samples when scanning for clock reads", () => {
    const sample = "const code = `line one\nparkedAt: new Date(),`;";
    expect(withoutCodeSamples(sample)).not.toContain("new Date()");
    const open = "$" + "{"; // a template expression opener, spelt out so it reads as test input
    expect(withoutCodeSamples(`const id = \`m${open}Date.now()}\`;`)).toContain("Date.now()");
    expect(withoutCodeSamples(`const s = \`a\n${open}String(Date.now())}\nb\`;`)).toContain("Date.now()");
    expect(withoutCodeSamples("// `note`\nconst d = new Date();")).toContain("new Date()");
  });

  it("reads the clock only through the provider, never Date.now() or new Date() in a shipped screen", () => {
    // Screens take "now" from WirefrontProvider (useWirefront().now / useFormat) so tests, previews and
    // server renders can pin it. Multi-line template literals are code samples shown on screen, not code.
    const problems: string[] = [];
    for (const map of Object.values(SOURCE_FILES)) {
      for (const file of Object.values(map ?? {})) {
        const shipped = [path.join(SHOWCASE_DIR, `${file}.tsx`), path.join(SHOWCASE_DIR, file, "view.tsx")].filter((f) => existsSync(f));
        for (const source of shipped) {
          const code = withoutCodeSamples(readFileSync(source, "utf8"));
          for (const m of code.matchAll(/Date\.now\(\)|new Date\(\)/g)) problems.push(`${path.relative(SHOWCASE_DIR, source)}: ${m[0]}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it("finds a showcase component for every listed design", () => {
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
      [...mapped]
        .filter((f) => existsSync(path.join(SHOWCASE_DIR, `${f}.tsx`)))
        .flatMap((f) =>
        [...readFileSync(path.join(SHOWCASE_DIR, `${f}.tsx`), "utf8").matchAll(/from\s+["']\.\/([\w-]+)["']/g)].map((m) => must(m[1], "an import name")),
      ),
    );
    const orphans = readdirSync(SHOWCASE_DIR)
      .filter((f) => f.endsWith(".tsx") && !f.startsWith("_") && f !== "registry.tsx")
      // <file>.showcase.tsx is the showcase companion of a mapped <file>.tsx.
      .map((f) => f.replace(/(\.showcase)?\.tsx$/, ""))
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

/**
 * Blank out the literal text of multi-line template literals (code samples shown on screen), keeping
 * everything else, including ${...} expressions, comments and one-line templates.
 */
function withoutCodeSamples(source: string): string {
  let out = "";
  let i = 0;
  const copyQuoted = (quote: string) => {
    out += source[i++];
    while (i < source.length && source[i] !== quote) {
      if (source[i] === "\\") out += source[i++];
      out += source[i++];
    }
    out += source[i++] ?? "";
  };
  const template = (): void => {
    const start = i;
    let text = "";
    i++;
    let literal = "";
    const parts: string[] = [];
    while (i < source.length && source[i] !== "`") {
      if (source[i] === "\\") {
        literal += source[i] + (source[i + 1] ?? "");
        i += 2;
      } else if (source[i] === "$" && source[i + 1] === "{") {
        parts.push(literal);
        literal = "";
        const saved = out;
        out = "";
        i += 2;
        let depth = 1;
        while (i < source.length && depth > 0) {
          const c = source[i];
          if (c === "`") template();
          else if (c === '"' || c === "'") copyQuoted(c);
          else {
            if (c === "{") depth++;
            if (c === "}") depth--;
            if (depth > 0) out += c;
            i++;
          }
        }
        parts.push(`\${${out}}`);
        out = saved;
      } else literal += source[i++];
    }
    parts.push(literal);
    i++;
    text = source.slice(start, i);
    out += text.includes("\n") ? `\`${parts.filter((_, n) => n % 2 === 1).join("")}\`` : text;
  };
  while (i < source.length) {
    const c = source[i];
    if (c === "/" && source[i + 1] === "/") {
      const end = source.indexOf("\n", i);
      out += source.slice(i, end === -1 ? undefined : end);
      i = end === -1 ? source.length : end;
    } else if (c === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2) + 2;
      out += source.slice(i, end);
      i = end;
    } else if (c === "`") template();
    else if (c === '"' || c === "'") copyQuoted(c);
    else out += source[i++];
  }
  return out;
}

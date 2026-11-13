// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Metadata the registry builder needs from the app without importing React
 * code: each design's title and blurb (from designs.ts) and the CSS values
 * of Wirefront's own theme tokens (from packages/ui/src/styles.css).
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export interface DesignMeta {
  category: string;
  slug: string;
  title: string;
  blurb: string;
  /** The screen states it renders (designs.ts `states`); absent means only "ready". */
  states?: string[];
}

/**
 * Read every design's slug, title and blurb from designs.ts. The file is
 * parsed as text because it imports React icon components through the app's
 * `@/` alias; tests/registry-meta.test.ts checks this matches the real
 * CATEGORIES so the parser can't drift.
 */
export function readDesignMeta(source = readFileSync(resolve(ROOT, "apps/www/src/lib/designs.ts"), "utf8")): DesignMeta[] {
  const body = source.slice(source.indexOf("export const CATEGORIES"));
  const out: DesignMeta[] = [];
  // Each category: `slug: "x", title: "…", … designs: [ … ]`.
  const categoryRe = /\n {4}slug: "([a-z0-9-]+)",\s*\n {4}title: "[^"]*",[\s\S]*?designs: \[([\s\S]*?)\n {4}\],/g;
  for (const c of body.matchAll(categoryRe)) {
    const designRe = /\{\s*slug: "([a-z0-9-]+)",\s*title: "((?:[^"\\]|\\.)*)",\s*blurb:\s*"((?:[^"\\]|\\.)*)"/g;
    const designs = c[2] ?? "";
    for (const d of designs.matchAll(designRe)) {
      // The rest of this design's object, up to the next design.
      const rest = designs.slice((d.index ?? 0) + d[0].length).split(/\n\s*\},?\s*\n/)[0] ?? "";
      const states = rest.match(/\n\s*states: \[([^\]]*)\]/)?.[1]?.match(/"([a-z]+)"/g)?.map((s) => s.slice(1, -1));
      out.push({
        category: c[1] ?? "",
        slug: d[1] ?? "",
        title: JSON.parse(`"${d[2]}"`),
        blurb: JSON.parse(`"${d[3]}"`),
        ...(states ? { states } : {}),
      });
    }
  }
  return out;
}

/** Tokens Wirefront adds on top of a stock shadcn/ui theme. */
export const WIREFRONT_TOKENS = [
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "info",
  "info-foreground",
  "destructive-foreground",
  "brand",
  "brand-foreground",
  "brand-ink",
  "code",
  "code-foreground",
  "code-highlight",
  "category-1",
  "category-1-strong",
  "category-1-foreground",
  "category-2",
  "category-2-strong",
  "category-2-foreground",
  "category-3",
  "category-3-strong",
  "category-3-foreground",
  "category-4",
  "category-4-strong",
  "category-4-foreground",
  "category-5",
  "category-5-strong",
  "category-5-foreground",
  "category-6",
  "category-6-strong",
  "category-6-foreground",
  "category-7",
  "category-7-strong",
  "category-7-foreground",
  "category-8",
  "category-8-strong",
  "category-8-foreground",
] as const;
export type WirefrontToken = (typeof WIREFRONT_TOKENS)[number];

function block(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`styles.css has no ${selector} block`);
  let depth = 0;
  let end = start;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) {
      end = i;
      break;
    }
  }
  const vars: Record<string, string> = {};
  for (const m of css.slice(start, end).matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) vars[m[1] ?? ""] = (m[2] ?? "").trim();
  return vars;
}

/** Light and dark values of Wirefront's tokens, read from styles.css. */
export function readTokenValues(
  css = readFileSync(resolve(ROOT, "packages/ui/src/styles.css"), "utf8"),
): Record<"light" | "dark", Partial<Record<WirefrontToken, string>>> {
  const light = block(css, ":root");
  const dark = block(css, ".dark");
  const pick = (vars: Record<string, string>) =>
    Object.fromEntries(WIREFRONT_TOKENS.filter((t) => t in vars).map((t) => [t, vars[t]])) as Partial<Record<WirefrontToken, string>>;
  return { light: pick(light), dark: pick(dark) };
}

const TOKEN_USE = new RegExp(
  `(?:\\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|divide|shadow|accent|caret|placeholder)-(${WIREFRONT_TOKENS.join("|")})\\b(?!-)|var\\(--(${WIREFRONT_TOKENS.join("|")})\\))`,
  "g",
);

/** Wirefront tokens a piece of source code uses. */
export function tokensUsed(source: string): WirefrontToken[] {
  const used = new Set<WirefrontToken>();
  for (const m of source.matchAll(TOKEN_USE)) used.add((m[1] ?? m[2]) as WirefrontToken);
  return [...used].sort();
}

/**
 * shadcn `cssVars` for the tokens an item uses: `theme` maps the Tailwind
 * colour utilities, `light`/`dark` carry the values.
 */
export function cssVarsFor(tokens: WirefrontToken[], values = readTokenValues()) {
  if (tokens.length === 0) return undefined;
  const pick = (mode: "light" | "dark") =>
    Object.fromEntries(tokens.filter((t) => values[mode][t] !== undefined).map((t) => [t, values[mode][t] as string]));
  return {
    theme: Object.fromEntries(tokens.map((t) => [`color-${t}`, `var(--${t})`])),
    light: pick("light"),
    dark: pick("dark"),
  };
}

// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Contract checker (SCREEN-CONTRACT.md): every ready-to-wire screen is a
 * folder apps/www/src/pages/showcase/<screen>/ with view.tsx, schema.ts,
 * fixtures.ts and demo.tsx, and its view follows the contract's rules. Run by
 * tests/contract.test.ts on every push.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SHOWCASE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../../apps/www/src/pages/showcase");

export interface Violation {
  rule: string;
  line?: number;
  message: string;
}

const lineOf = (source: string, index: number) => source.slice(0, index).split("\n").length;

function each(source: string, re: RegExp, rule: string, message: (m: RegExpMatchArray) => string): Violation[] {
  return [...source.matchAll(re)].map((m) => ({ rule, line: lineOf(source, m.index ?? 0), message: message(m) }));
}

/** Remove comments so rules only look at code. Keeps line numbers. */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (c, p: string) => p + " ".repeat(c.length - p.length));
}

/** The contract's rules for a screen's view.tsx. */
export function checkView(source: string): Violation[] {
  const src = code(source);
  const v: Violation[] = [];
  if (!/^\s*["']use client["'];?/.test(src)) v.push({ rule: "use-client", line: 1, message: 'views start with "use client"' });
  if (!/SPDX-License-Identifier:/.test(source.split("\n").slice(0, 4).join("\n")))
    v.push({ rule: "licence", line: 1, message: "missing the SPDX licence header" });
  v.push(
    ...each(
      src,
      /from\s+["'](next(?:\/[\w/-]+)?|@tanstack\/react-router|react-router(?:-dom)?|@remix-run\/[\w-]+)["']/g,
      "framework",
      (m) => `imports ${m[1]}: links, routing and navigation go through WirefrontProvider and callbacks`,
    ),
    ...each(
      src,
      /\bfetch\s*\(|from\s+["'](axios|swr|@tanstack\/react-query)["']|\bXMLHttpRequest\b/g,
      "fetching",
      (m) => `${m[1] ?? m[0].trim()}: views receive data as props, the builder fetches it`,
    ),
    ...each(
      src,
      /new\s+Promise\s*\([^)]*\)?[\s\S]{0,120}?setTimeout/g,
      "fake-latency",
      () => "fakes latency with setTimeout: actions are the builder's Promises",
    ),
    ...each(
      src,
      /^(?:export\s+)?const\s+(\w+)(?:\s*:[^=\n]+)?\s*=\s*\[\s*\{/gm,
      "hard-coded-data",
      (m) => `${m[1]} is a top-level array of records: data comes in through props (fixtures.ts holds demo data)`,
    ),
    ...each(
      src,
      /\bMath\.random\s*\(|\bDate\.now\s*\(|\bnew\s+Date\s*\(\s*\)/g,
      "deterministic",
      (m) => `${m[0].replace(/\s+/g, "")} makes the render differ between server and browser: take time and randomness from props or useWirefront().now()`,
    ),
  );
  if (!/export\s+(?:interface|type)\s+\w+Props\b/.test(src))
    v.push({ rule: "props", message: "exports no …Props type: the screen's data and callbacks are its contract" });
  return v;
}

/** Folder-level rules for a ready-to-wire screen. */
export function checkScreenFolder(dir: string): Violation[] {
  const v: Violation[] = [];
  const read = (f: string) => (existsSync(join(dir, f)) ? readFileSync(join(dir, f), "utf8") : undefined);
  const view = read("view.tsx");
  const schema = read("schema.ts");
  const fixtures = read("fixtures.ts");
  const demo = read("demo.tsx");
  if (view === undefined) v.push({ rule: "folder", message: "view.tsx is missing" });
  else v.push(...checkView(view).map((x) => ({ ...x, message: `view.tsx: ${x.message}` })));
  if (schema === undefined) v.push({ rule: "folder", message: "schema.ts is missing" });
  else if (!/export\s+const\s+api\s*=\s*defineApi\s*\(/.test(schema))
    v.push({ rule: "api", message: "schema.ts: export the screen's API contract as `export const api = defineApi({…})`" });
  if (fixtures === undefined) v.push({ rule: "folder", message: "fixtures.ts is missing" });
  if (demo === undefined) v.push({ rule: "folder", message: "demo.tsx is missing" });
  else if (!/export\s+function\s+\w+ShowcasePage\b/.test(demo))
    v.push({ rule: "folder", message: "demo.tsx: export the showcase page as `export function <Name>ShowcasePage`" });
  return v;
}

/** Folders under the showcase directory that hold a ready-to-wire screen. */
export function readyScreens(root = SHOWCASE_DIR): string[] {
  return readdirSync(root)
    .filter((name) => statSync(join(root, name)).isDirectory() && existsSync(join(root, name, "view.tsx")))
    .sort();
}

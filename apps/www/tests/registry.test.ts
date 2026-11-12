// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * What a builder gets from `npx shadcn add`: build the registry, then check
 * that every item would install into a fresh project. Every import in a
 * shipped file must resolve to another shipped file, a declared registry
 * dependency, a declared npm dependency or the shadcn base (`@/lib/utils`).
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registryItemSchema, registrySchema } from "shadcn/schema";
import { beforeAll, describe, expect, it } from "vitest";
import { tokensUsed } from "../../../scripts/lib/registry-meta";
import { must } from "./must";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const OUT = path.join(ROOT, "apps/www/public/r");

interface Item {
  $schema?: string;
  name: string;
  type: string;
  title?: string;
  description?: string;
  cssVars?: { theme?: Record<string, string>; light?: Record<string, string>; dark?: Record<string, string> };
  files: { path: string; target?: string; type: string; content: string }[];
  registryDependencies?: string[];
  dependencies?: string[];
}

const ALWAYS_AVAILABLE = new Set(["react", "react-dom", "@/lib/utils"]);
const IMPORT = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']|(?:^|\n)\s*import\s+["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/g;

function packageName(spec: string): string {
  const parts = spec.split("/");
  return spec.startsWith("@") ? parts.slice(0, 2).join("/") : must(parts[0], "a package name");
}

const stripExt = (p: string) => p.replace(/\.(tsx?|jsx?)$/, "");

/** Problems that would stop this item installing or compiling in a fresh project. */
function unresolvedImports(item: Item): string[] {
  const shipped = new Set(item.files.map((f) => stripExt(f.path)));
  const shippedExact = new Set(item.files.map((f) => f.path));
  const registryDeps = new Set((item.registryDependencies ?? []).map((d) => must(d.split("/").pop(), "a dependency name")));
  const npmDeps = new Set((item.dependencies ?? []).map(packageName));
  const problems: string[] = [];

  for (const file of item.files) {
    // Ignore code shown as text inside template literals (e.g. a diff viewer).
    const code = file.content.replace(/`(?:\\.|[^`\\])*`/g, "``");
    for (const m of code.matchAll(IMPORT)) {
      const spec = must(m[1] ?? m[2] ?? m[3], "an import specifier");
      if (ALWAYS_AVAILABLE.has(spec)) continue;
      let ok: boolean;
      if (spec.startsWith(".")) {
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(file.path), spec));
        ok = shipped.has(stripExt(target)) || shippedExact.has(target) || shipped.has(`${target}/index`);
      } else if (spec.startsWith("@/components/ui/")) {
        const name = spec.slice("@/components/ui/".length);
        ok = registryDeps.has(name) || shipped.has(`components/ui/${name}`);
      } else if (spec.startsWith("@/")) {
        const target = spec.slice(2);
        ok = shipped.has(stripExt(target)) || shippedExact.has(target);
      } else if (spec.startsWith("@wirefront/")) {
        ok = false; // a workspace package, which doesn't exist in a builder's project
      } else {
        ok = npmDeps.has(packageName(spec));
      }
      if (!ok) problems.push(`${file.path}: "${spec}"`);
    }
  }
  return problems;
}

let items: Item[] = [];
let index: unknown;
const COMPONENTS = ["autocomplete", "checkbox-group", "command", "otp-field", "segmented-control"];

beforeAll(() => {
  execFileSync("npx", ["tsx", "scripts/build-registry.ts"], { cwd: ROOT, stdio: "pipe" });
  items = readdirSync(OUT)
    .filter((f) => f.endsWith(".json") && f !== "registry.json")
    .sort()
    .map((f) => JSON.parse(readFileSync(path.join(OUT, f), "utf8")) as Item);
  index = JSON.parse(readFileSync(path.join(OUT, "registry.json"), "utf8"));
});

describe("registry", () => {
  it("builds one flat item per design plus Wirefront's components", () => {
    expect(items.length).toBe(200 + COMPONENTS.length);
    for (const c of COMPONENTS) expect(items.some((i) => i.name === c && i.type === "registry:ui"), c).toBe(true);
  });

  it("serves each item at r/<name>.json, so a namespace like @wirefront/{name} resolves", () => {
    const misnamed = readdirSync(OUT)
      .filter((f) => f.endsWith(".json") && f !== "registry.json")
      .filter((f) => (JSON.parse(readFileSync(path.join(OUT, f), "utf8")) as Item).name !== f.replace(/\.json$/, ""));
    expect(misnamed).toEqual([]);
  });

  it("passes shadcn's own schema for every item and for the index", () => {
    const invalid = items.flatMap((i) => {
      const r = registryItemSchema.safeParse(i);
      return r.success ? [] : [`${i.name}: ${r.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join("; ")}`];
    });
    expect(invalid).toEqual([]);
    const r = registrySchema.safeParse(index);
    expect(r.success ? [] : r.error.issues.map((x) => `${x.path.join(".")} ${x.message}`)).toEqual([]);
  });

  it("lists every item in the index with a description", () => {
    const listed = (index as { items: Item[] }).items;
    expect(listed.map((i) => i.name).sort()).toEqual(items.map((i) => i.name).sort());
    expect(listed.filter((i) => !i.description?.trim()).map((i) => i.name)).toEqual([]);
  });

  it("marks every shipped component file as a client component", () => {
    const missing = items.flatMap((i) =>
      i.files
        .filter((f) => f.path.endsWith(".tsx") && !/^\s*(?:\/\/.*\n\s*)*["']use client["']/.test(f.content))
        .map((f) => `${i.name}: ${f.path}`),
    );
    expect(missing).toEqual([]);
  });

  it("ships the CSS variables for every Wirefront token an item uses", () => {
    const missing = items.flatMap((i) =>
      tokensUsed(i.files.map((f) => f.content).join("\n"))
        .filter((t) => !i.cssVars?.theme?.[`color-${t}`] || !i.cssVars?.light?.[t])
        .map((t) => `${i.name}: ${t}`),
    );
    expect(missing).toEqual([]);
  });

  it("installs every Wirefront file under a wirefront/ folder, never over a builder's own files", () => {
    const outside = items.flatMap((i) =>
      i.files
        .filter((f) => !/^@(components|hooks|lib)\/wirefront\//.test(f.target ?? "") || !f.path.includes("/wirefront/"))
        .map((f) => `${i.name}: ${f.path} → ${f.target ?? "(no target)"}`),
    );
    expect(outside).toEqual([]);
  });

  it("ships no showcase-only code (the devl.dev frame, .showcase companions)", () => {
    const leaked = items.flatMap((i) =>
      i.files.filter((f) => /_devl-frame|DevlFrame|\.showcase/.test(f.path + f.content)).map((f) => `${i.name}: ${f.path}`),
    );
    expect(leaked).toEqual([]);
  });

  it("gives every item a unique name", () => {
    const names = items.map((i) => i.name);
    expect(names).toEqual([...new Set(names)]);
  });

  it("gives every item a valid shape", () => {
    const invalid = items.filter(
      (i) =>
        i.$schema !== "https://ui.shadcn.com/schema/registry-item.json" ||
        !/^[a-z0-9-]+$/.test(i.name) ||
        !i.type.startsWith("registry:") ||
        !i.title ||
        i.files.length === 0 ||
        i.files.some((f) => !f.path || !f.type.startsWith("registry:") || !f.content.trim()),
    );
    expect(invalid.map((i) => i.name)).toEqual([]);
  });

  it("puts a licence header on every shipped file", () => {
    const missing = items.flatMap((i) =>
      i.files.filter((f) => !f.content.slice(0, 400).includes("SPDX-License-Identifier:")).map((f) => `${i.name}: ${f.path}`),
    );
    expect(missing).toEqual([]);
  });

  it("resolves every import in every item", () => {
    const broken = items.flatMap((i) => unresolvedImports(i).map((p) => `${i.name} → ${p}`));
    expect(broken).toEqual([]);
  });
});

#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Generate the shadcn registry into apps/www/public/r:
 * - one item per design at r/<category>-<design>.json (flat, so a namespace
 *   such as `@wirefront/{name}` resolves to it), with the design's blurb as
 *   its description and `cssVars` for any Wirefront theme tokens it uses;
 * - one item per Wirefront component (autocomplete, command, …) at
 *   r/<name>.json;
 * - the index at r/registry.json.
 *
 * Each item's source has its `@wirefront/ui/<name>` imports rewritten to
 * `@/components/ui/<name>`, and declares shadcn/ui registry deps (e.g. `button`)
 * so `shadcn add` pulls the primitives into the consumer's project.
 *
 * Some `@wirefront/ui` exports aren't shadcn/ui components
 * (see LOCAL_INLINES). For those, the source is recursively inlined into
 * the registry item along with any of its transitive imports inside the
 * `@wirefront/ui` package.
 */
import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { SOURCE_FILES } from "../apps/www/src/pages/showcase/source-files";
import { cssVarsFor, readDesignMeta, tokensUsed } from "./lib/registry-meta";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SHOWCASE_DIR = resolve(ROOT, "apps/www/src/pages/showcase");
// App-level components a showcase may import as `@/components/<name>`
// (e.g. the shared chart wrapper). Shipped alongside the screen.
const APP_COMPONENTS_DIR = resolve(ROOT, "apps/www/src/components");
const APP_PREFIX = "app:";
const UI_PKG_DIR = resolve(ROOT, "packages/ui/src");
const OUT_DIR = resolve(ROOT, "apps/www/public/r");

// Known external npm packages that show up in showcases. Anything not in
// this set is assumed to be a workspace/shadcn/local import we don't need
// to surface as a npm dependency.
const TRACKED_NPM_DEPS = new Set([
  "@base-ui/react",
  "class-variance-authority",
  "lucide-react",
  "motion",
  "prism-react-renderer",
  "react-day-picker",
  "recharts",
  "zod",
]);

// `@wirefront/ui/<name>` exports that aren't shadcn/ui components — their
// source is inlined into each registry item that uses them (along with
// transitive imports inside @wirefront/ui). Everything else under
// components/ui is a stock shadcn/ui (base-nova) component and becomes a
// plain registryDependency (e.g. "button"), resolved from the builder's own
// shadcn setup. The value is the path inside packages/ui/src.
const LOCAL_INLINES: Record<string, string> = {
  "auth-split-layout": "components/ui/auth-split-layout.tsx",
  autocomplete: "components/ui/autocomplete.tsx",
  "checkbox-group": "components/ui/checkbox-group.tsx",
  command: "components/ui/command.tsx",
  "otp-field": "components/ui/otp-field.tsx",
  "segmented-control": "components/ui/segmented-control.tsx",
  "particle-field": "components/particle-field.tsx",
  "theme-provider": "components/theme-provider.tsx",
};

interface RegistryFile {
  path: string;
  /** Where shadcn installs it: `@components/…`, `@hooks/…` or `@lib/…`, so
   * the builder's configured aliases (src/ or not) are respected. */
  target?: string;
  content: string;
  type: "registry:component" | "registry:lib";
}

interface RegistryItem {
  $schema: string;
  name: string;
  type: "registry:component" | "registry:ui";
  title: string;
  description?: string;
  registryDependencies?: string[];
  dependencies?: string[];
  cssVars?: ReturnType<typeof cssVarsFor>;
  files: RegistryFile[];
}

// Wirefront's own components, also published as standalone items.
const WIREFRONT_COMPONENTS = ["autocomplete", "checkbox-group", "command", "otp-field", "segmented-control"] as const;
const SITE_HOMEPAGE = "https://github.com/mantavyamstudios/wirefront";

interface InlinedFile {
  // Consumer-relative output path used as `files[].path`.
  outputPath: string;
  type: RegistryFile["type"];
  content: string;
}

interface CrawlResult {
  showcaseFiles: { name: string; content: string }[];
  inlined: InlinedFile[];
  registryDeps: Set<string>;
  npmDeps: Set<string>;
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((s) => (s ? s[0]!.toUpperCase() + s.slice(1) : s))
    .join(" ");
}

// Map an absolute path inside packages/ui/src to the consumer's
// corresponding `@/...` alias and the registry output path. Returns
// `output: null` when the consumer is expected to already have the file
// (e.g. `lib/utils.ts` is created by `shadcn init`).
function mapLibraryPath(absPath: string): {
  alias: string;
  // null when the consumer is expected to already have the file (e.g.
  // `lib/utils` from shadcn init) or when the file is satisfied via a
  // shadcn/ui registry dep (see `shadcnDep` below).
  output: string | null;
  type: RegistryFile["type"];
  // When set, emit this shadcn/ui registry dep instead of inlining the file.
  shadcnDep?: string;
} {
  const rel = relative(UI_PKG_DIR, absPath);

  if (rel === "lib/utils.ts") {
    return { alias: "@/lib/utils", output: null, type: "registry:lib" };
  }

  // packages/ui/src/components/ui/<x>.tsx — shadcn/ui primitive (button, card,
  // etc.) unless it's one of the local-only exports listed in
  // LOCAL_INLINES (e.g. auth-split-layout). Inlined files don't go under
  // components/ui/ since that path is reserved for shadcn/ui primitives
  // in the consumer.
  let m = rel.match(/^components\/ui\/([a-z0-9-]+)\.tsx$/);
  if (m) {
    const name = m[1]!;
    if (name in LOCAL_INLINES) {
      return {
        alias: `@/components/wirefront/${name}`,
        output: `components/wirefront/${name}.tsx`,
        type: "registry:component",
      };
    }
    return {
      alias: `@/components/ui/${name}`,
      output: null,
      type: "registry:component",
      shadcnDep: name,
    };
  }

  m = rel.match(/^components\/([a-z0-9-]+)\.tsx$/);
  if (m) {
    return {
      alias: `@/components/wirefront/${m[1]}`,
      output: `components/wirefront/${m[1]}.tsx`,
      type: "registry:component",
    };
  }

  // Contract helpers (packages/ui/src/wirefront): provider, form, … (.tsx)
  // and the server-safe types and api (.ts, no "use client").
  m = rel.match(/^wirefront\/([a-z0-9-]+)\.(tsx?)$/);
  if (m) {
    return {
      alias: `@/components/wirefront/${m[1]}`,
      output: `components/wirefront/${m[1]}.${m[2]}`,
      type: "registry:lib",
    };
  }

  m = rel.match(/^themes\/([a-z0-9-]+)\.ts$/);
  if (m) {
    return {
      alias: `@/lib/wirefront/themes/${m[1]}`,
      output: `lib/wirefront/themes/${m[1]}.ts`,
      type: "registry:lib",
    };
  }

  m = rel.match(/^hooks\/([a-z0-9-]+)\.ts$/);
  if (m) {
    return {
      alias: `@/hooks/wirefront/${m[1]}`,
      output: `hooks/wirefront/${m[1]}.ts`,
      type: "registry:lib",
    };
  }

  throw new Error(`unmapped library path: ${rel}`);
}

function rewriteShowcaseImports(source: string): string {
  let out = source.replace(
    /from\s+(["'])@wirefront\/ui\/lib\/utils\1/g,
    "from $1@/lib/utils$1",
  );
  // Contract helpers ship under components/wirefront (see crawl).
  out = out.replace(
    /from\s+(["'])@wirefront\/ui\/wirefront\/([a-z0-9-]+)\1/g,
    "from $1@/components/wirefront/$2$1",
  );
  // Hooks are inlined into the item (see crawl), under the consumer's
  // @/hooks/wirefront so they never collide with the builder's own hooks.
  out = out.replace(
    /from\s+(["'])@wirefront\/ui\/hooks\/([a-z0-9-]+)\1/g,
    "from $1@/hooks/wirefront/$2$1",
  );
  out = out.replace(
    /from\s+(["'])@wirefront\/ui\/([a-z0-9-]+)\1/g,
    (_match, q: string, name: string) => {
      const dir = name in LOCAL_INLINES ? "components/wirefront" : "components/ui";
      return `from ${q}@/${dir}/${name}${q}`;
    },
  );
  // App-level components (@/components/<name>) ship under components/wirefront.
  out = out.replace(
    /from\s+(["'])@\/components\/(?!ui\/|wirefront\/)([a-z0-9-]+)\1/g,
    "from $1@/components/wirefront/$2$1",
  );
  return out;
}

// Rewrite imports in a file being inlined from packages/ui. Returns the
// rewritten source plus the absolute paths of any further library files
// to follow, and the registry / npm deps it surfaces.
function rewriteLibraryFile(absPath: string, source: string): {
  rewritten: string;
  follow: string[];
  registryDeps: Set<string>;
  npmDeps: Set<string>;
} {
  const follow: string[] = [];
  const registryDeps = new Set<string>();
  const npmDeps = new Set<string>();

  // 1. Relative imports — resolve to an abs path, then map to alias.
  let out = source.replace(
    /from\s+(["'])(\.{1,2}\/[^"']+)\1/g,
    (_match, q: string, spec: string) => {
      const stripped = spec.replace(/\.tsx?$/, "");
      const candidates = [
        resolve(dirname(absPath), spec),
        resolve(dirname(absPath), `${stripped}.tsx`),
        resolve(dirname(absPath), `${stripped}.ts`),
      ];
      const target = candidates.find((p) => existsSync(p));
      if (!target) {
        throw new Error(
          `cannot resolve relative import "${spec}" from ${absPath}`,
        );
      }
      const { alias, output, shadcnDep } = mapLibraryPath(target);
      if (shadcnDep) registryDeps.add(shadcnDep);
      if (output) follow.push(target);
      return `from ${q}${alias}${q}`;
    },
  );

  // 2. @wirefront/ui/<name> imports — rewrite to consumer alias and either
  //    queue inlining (local-only) or emit a shadcn/ui registry dep.
  out = out.replace(
    /from\s+(["'])@wirefront\/ui\/([a-z0-9/-]+)\1/g,
    (_match, q: string, name: string) => {
      if (name === "lib/utils") return `from ${q}@/lib/utils${q}`;
      const baseName = name.split("/").pop()!;
      if (name.startsWith("hooks/")) {
        follow.push(resolve(UI_PKG_DIR, `${name}.ts`));
        return `from ${q}@/hooks/wirefront/${baseName}${q}`;
      }
      if (name.startsWith("wirefront/")) {
        const ts = resolve(UI_PKG_DIR, `${name}.ts`);
        follow.push(existsSync(ts) ? ts : resolve(UI_PKG_DIR, `${name}.tsx`));
        return `from ${q}@/components/wirefront/${baseName}${q}`;
      }
      if (LOCAL_INLINES[baseName]) {
        follow.push(resolve(UI_PKG_DIR, LOCAL_INLINES[baseName]!));
        return `from ${q}@/components/wirefront/${baseName}${q}`;
      }
      registryDeps.add(baseName);
      return `from ${q}@/components/ui/${baseName}${q}`;
    },
  );

  // 3. Track known npm deps (anything not relative and not @/ or @wirefront/).
  const importRe = /from\s+["']([^"']+)["']/g;
  for (const m of out.matchAll(importRe)) {
    const spec = m[1]!;
    // Match on the package name so subpath imports (motion/react) count too.
    const parts = spec.split("/");
    const pkg = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]!;
    if (TRACKED_NPM_DEPS.has(pkg)) npmDeps.add(pkg);
  }

  return { rewritten: out, follow, registryDeps, npmDeps };
}

// A ready-to-wire screen is a folder (SCREEN-CONTRACT.md); the registry ships
// its view, schema and fixtures. demo.tsx is showcase-only wiring.
const FOLDER_FILES = ["view", "schema", "fixtures"];

function isScreenFolder(filename: string): boolean {
  return existsSync(resolve(SHOWCASE_DIR, filename, "view.tsx"));
}

/** The file's source and its extension (folder screens mix .tsx and .ts). */
async function readShowcase(filename: string): Promise<{ raw: string; ext: string }> {
  if (filename.startsWith(APP_PREFIX)) {
    return { raw: await readFile(resolve(APP_COMPONENTS_DIR, `${filename.slice(APP_PREFIX.length)}.tsx`), "utf8"), ext: "tsx" };
  }
  for (const ext of filename.includes("/") ? ["tsx", "ts"] : ["tsx"]) {
    const path = resolve(SHOWCASE_DIR, `${filename}.${ext}`);
    if (existsSync(path)) return { raw: await readFile(path, "utf8"), ext };
  }
  throw new Error(`no showcase source for ${filename}`);
}

async function crawl(rootFilename: string): Promise<CrawlResult> {
  const visitedShowcase = new Set<string>();
  const visitedLib = new Set<string>();
  const showcaseFiles: { name: string; content: string }[] = [];
  const inlinedByOutput = new Map<string, InlinedFile>();
  const registryDeps = new Set<string>();
  const npmDeps = new Set<string>();
  const showcaseQueue: string[] = isScreenFolder(rootFilename)
    ? FOLDER_FILES.map((f) => `${rootFilename}/${f}`)
    : [rootFilename];
  const libQueue: string[] = [];

  const drainLibQueue = async () => {
    while (libQueue.length > 0) {
      const absPath = libQueue.shift()!;
      if (visitedLib.has(absPath)) continue;
      visitedLib.add(absPath);

      const { output, type } = mapLibraryPath(absPath);
      if (!output) continue;

      const raw = await readFile(absPath, "utf8");
      const { rewritten, follow, registryDeps: rDeps, npmDeps: nDeps } =
        rewriteLibraryFile(absPath, raw);

      for (const d of rDeps) registryDeps.add(d);
      for (const d of nDeps) npmDeps.add(d);
      for (const next of follow) libQueue.push(next);

      inlinedByOutput.set(output, { outputPath: output, type, content: rewritten });
    }
  };

  while (showcaseQueue.length > 0) {
    const fname = showcaseQueue.shift()!;
    if (visitedShowcase.has(fname)) continue;
    visitedShowcase.add(fname);

    let raw: string;
    let ext: string;
    try {
      ({ raw, ext } = await readShowcase(fname));
    } catch {
      continue;
    }

    // @wirefront/ui/<name> -> queue local inline OR add a shadcn/ui dep.
    const orbitRe = /from\s+["']@wirefront\/ui\/([a-z0-9/-]+)["']/g;
    for (const m of raw.matchAll(orbitRe)) {
      const importPath = m[1]!;
      if (importPath === "lib/utils") continue;
      const baseName = importPath.split("/").pop()!;
      if (importPath.startsWith("hooks/")) {
        libQueue.push(resolve(UI_PKG_DIR, `${importPath}.ts`));
      } else if (importPath.startsWith("wirefront/")) {
        const ts = resolve(UI_PKG_DIR, `${importPath}.ts`);
        libQueue.push(existsSync(ts) ? ts : resolve(UI_PKG_DIR, `${importPath}.tsx`));
      } else if (LOCAL_INLINES[baseName]) {
        libQueue.push(resolve(UI_PKG_DIR, LOCAL_INLINES[baseName]!));
      } else {
        registryDeps.add(baseName);
      }
    }

    // Sibling showcase imports (./foo).
    const relRe = /from\s+["']\.\/([a-z0-9_-]+)["']/g;
    for (const m of raw.matchAll(relRe)) {
      // Inside a screen folder, ./x is a file of that folder.
      const dir = fname.includes("/") && !fname.startsWith(APP_PREFIX) ? fname.slice(0, fname.lastIndexOf("/") + 1) : "";
      const sibling = `${dir}${m[1]!}`;
      if (!visitedShowcase.has(sibling)) showcaseQueue.push(sibling);
    }

    // App-level components (@/components/<name>, not @/components/ui/*).
    const appRe = /from\s+["']@\/components\/([a-z0-9-]+)["']/g;
    for (const m of raw.matchAll(appRe)) {
      const app = `${APP_PREFIX}${m[1]}`;
      if (!visitedShowcase.has(app)) showcaseQueue.push(app);
    }

    const importRe = /from\s+["']([^"']+)["']/g;
    for (const m of raw.matchAll(importRe)) {
      const spec = m[1]!;
      const parts = spec.split("/");
      const pkg = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0]!;
      if (TRACKED_NPM_DEPS.has(pkg)) npmDeps.add(pkg);
    }

    showcaseFiles.push({
      name: `${fname.startsWith(APP_PREFIX) ? fname.slice(APP_PREFIX.length) : fname}.${ext}`,
      content: rewriteShowcaseImports(raw),
    });

    await drainLibQueue();
  }

  await drainLibQueue();

  return {
    showcaseFiles,
    inlined: [...inlinedByOutput.values()],
    registryDeps,
    npmDeps,
  };
}

async function writeItem(item: RegistryItem): Promise<void> {
  await writeFile(resolve(OUT_DIR, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`);
}

// Everything Wirefront ships lives under a wirefront/ folder so it never
// overwrites a builder's own components, hooks or lib files.
function targetFor(path: string): string {
  const m = path.match(/^(components|hooks|lib)\/(wirefront\/.+)$/);
  if (!m) throw new Error(`unexpected registry file path: ${path}`);
  return `@${m[1]}/${m[2]}`;
}

function withDeps(item: RegistryItem, registryDeps: Set<string>, npmDeps: Set<string>): RegistryItem {
  item.files = item.files.map((f) => ({ path: f.path, target: targetFor(f.path), type: f.type, content: f.content }));
  if (registryDeps.size > 0) item.registryDependencies = [...registryDeps].sort();
  if (npmDeps.size > 0) item.dependencies = [...npmDeps].sort();
  const cssVars = cssVarsFor(tokensUsed(item.files.map((f) => f.content).join("\n")));
  if (cssVars) item.cssVars = cssVars;
  return item;
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const meta = new Map(readDesignMeta().map((d) => [`${d.category}/${d.slug}`, d]));
  const index: RegistryItem[] = [];

  for (const [category, designs] of Object.entries(SOURCE_FILES)) {
    if (!designs) continue;
    for (const [designSlug, filename] of Object.entries(designs)) {
      const { showcaseFiles, inlined, registryDeps, npmDeps } = await crawl(filename);
      if (showcaseFiles.length === 0) {
        throw new Error(`${category}/${designSlug}: no source for ${filename}`);
      }
      const d = meta.get(`${category}/${designSlug}`);
      if (!d) throw new Error(`${category}/${designSlug} is mapped in source-files.ts but not listed in designs.ts`);
      const item = withDeps(
        {
          $schema: "https://ui.shadcn.com/schema/registry-item.json",
          name: `${category}-${designSlug}`,
          type: "registry:component",
          title: d.title,
          description: d.blurb,
          files: [
            ...showcaseFiles.map((f) => ({
              path: `components/wirefront/${f.name}`,
              content: f.content,
              type: "registry:component" as const,
            })),
            ...inlined.map((f) => ({ path: f.outputPath, content: f.content, type: f.type })),
          ],
        },
        registryDeps,
        npmDeps,
      );
      await writeItem(item);
      index.push(item);
    }
  }

  for (const name of WIREFRONT_COMPONENTS) {
    const absPath = resolve(UI_PKG_DIR, LOCAL_INLINES[name] ?? "");
    const { rewritten, registryDeps, npmDeps } = rewriteLibraryFile(absPath, await readFile(absPath, "utf8"));
    const item = withDeps(
      {
        $schema: "https://ui.shadcn.com/schema/registry-item.json",
        name,
        type: "registry:ui",
        title: titleCase(name),
        description: `Wirefront's ${name.replace(/-/g, " ")} component, built on Base UI.`,
        files: [{ path: `components/wirefront/${name}.tsx`, content: rewritten, type: "registry:component" }],
      },
      registryDeps,
      npmDeps,
    );
    await writeItem(item);
    index.push(item);
  }

  const registry = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "wirefront",
    homepage: SITE_HOMEPAGE,
    items: index.map(({ $schema: _schema, files, ...rest }) => ({
      ...rest,
      files: files.map(({ path, type }) => ({ path, type })),
    })),
  };
  await writeFile(resolve(OUT_DIR, "registry.json"), `${JSON.stringify(registry, null, 2)}\n`);
  console.log(`wrote ${index.length} registry items and registry.json to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

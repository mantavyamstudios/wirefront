// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Screens manifest: the bridge between Wirefront's catalogue
 * (apps/runtime/src/lib/designs.ts + source-files.ts) and this site.
 *
 *   bun scripts/screens-manifest.mts          # write manifest + meta.json, add missing MDX stubs
 *                                             # (runs automatically before `dev` and `build`)
 *   bun scripts/screens-manifest.mts --check  # exit 1 if anything drifted from the catalogue
 *
 * Writes:
 *   lib/screens/screens.manifest.json            groups → kinds → screens, with source files
 *   content/screens/meta.json                    sidebar order, one separator per group
 *   content/screens/<group>/<kind>/<screen>.mdx  editorial page per screen (created once, never overwritten)
 *
 * A screen lives at /{group}/{kind}/{screen}; kinds are the catalogue's
 * categories and groups come from lib/screens/groups.ts.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

import { CATEGORIES } from "../../runtime/src/lib/designs.ts";
import { SOURCE_FILES } from "../../runtime/src/pages/showcase/source-files.ts";
import { SCREEN_GROUPS } from "../lib/screens/groups.ts";

const WWW = path.resolve(import.meta.dirname, "..");
const RUNTIME = path.resolve(WWW, "../runtime");
const SHOWCASE = path.join(RUNTIME, "src/pages/showcase");
const MANIFEST = path.join(WWW, "lib/screens/screens.manifest.json");
const CONTENT = path.join(WWW, "content/screens");
const META = path.join(CONTENT, "meta.json");
/** The files a ready-to-wire screen folder ships (SCREEN-CONTRACT.md). */
const FOLDER_FILES = ["view.tsx", "schema.ts", "fixtures.ts"];

export interface ManifestScreen {
  blurb: string;
  /** Source files shown on the page, relative to apps/runtime/src/pages/showcase. */
  files: string[];
  /** `ready` when the screen is a ready-to-wire folder with a view.tsx. */
  readiness: "ready" | "preview";
  /** shadcn registry item name (`/r/<registry>.json`). */
  registry: string;
  slug: string;
  states: string[];
  status: "new" | "wip" | null;
  title: string;
}

export interface ManifestKind {
  blurb: string;
  screens: ManifestScreen[];
  slug: string;
  title: string;
}

export interface ManifestGroup {
  kinds: ManifestKind[];
  meaning: string;
  slug: string;
  title: string;
}

export interface Manifest {
  groups: ManifestGroup[];
  totals: { groups: number; kinds: number; screens: number };
}

const fail = (message: string): never => {
  throw new Error(`screens-manifest: ${message}`);
};

function sourceFilesFor(file: string): { files: string[]; readiness: ManifestScreen["readiness"] } {
  const folder = path.join(SHOWCASE, file);
  if (existsSync(folder) && statSync(folder).isDirectory()) {
    const files = FOLDER_FILES.filter((f) => existsSync(path.join(folder, f))).map((f) => `${file}/${f}`);
    return { files, readiness: files.includes(`${file}/view.tsx`) ? "ready" : "preview" };
  }
  if (existsSync(path.join(SHOWCASE, `${file}.tsx`))) {
    return { files: [`${file}.tsx`], readiness: "preview" };
  }
  return fail(`no source for ${file} in apps/runtime/src/pages/showcase`);
}

/** Top-level paths a group slug must not take: the site's own routes and public folders. */
function reservedSlugs(): Set<string> {
  const names = new Set<string>();
  for (const dir of [path.join(WWW, "app"), path.join(WWW, "public")]) {
    for (const entry of readdirSync(dir)) {
      if (entry.startsWith("(") && statSync(path.join(dir, entry)).isDirectory()) {
        for (const inner of readdirSync(path.join(dir, entry))) names.add(inner.replace(/\.[^.]+$/, ""));
      } else {
        names.add(entry.replace(/\.[^.]+$/, ""));
      }
    }
  }
  for (const runtimeRoute of ["preview", "demo", "assets"]) names.add(runtimeRoute);
  return names;
}

export function buildManifest(): Manifest {
  const categories = new Map(CATEGORIES.map((c) => [c.slug as string, c]));
  const grouped = SCREEN_GROUPS.flatMap((g) => g.kinds);
  const reserved = reservedSlugs();

  for (const g of SCREEN_GROUPS) {
    if (reserved.has(g.slug)) fail(`group "${g.slug}" collides with a top-level route or public folder`);
  }
  for (const kind of grouped) {
    if (!categories.has(kind)) fail(`group lists kind "${kind}", which is not a category in designs.ts`);
    if (grouped.indexOf(kind) !== grouped.lastIndexOf(kind)) fail(`kind "${kind}" is in more than one group`);
  }
  for (const slug of categories.keys()) {
    if (!grouped.includes(slug)) fail(`category "${slug}" is in no group (lib/screens/groups.ts)`);
  }

  const groups = SCREEN_GROUPS.map((g): ManifestGroup => ({
    slug: g.slug,
    title: g.title,
    meaning: g.meaning,
    kinds: g.kinds.map((kindSlug): ManifestKind => {
      const category = categories.get(kindSlug) ?? fail(`unknown kind ${kindSlug}`);
      const map = SOURCE_FILES[category.slug] ?? {};
      return {
        slug: category.slug,
        title: category.title,
        blurb: category.blurb,
        screens: category.designs.map((d): ManifestScreen => {
          const file = map[d.slug] ?? fail(`${category.slug}/${d.slug} is not in source-files.ts`);
          const { files, readiness } = sourceFilesFor(file);
          return {
            slug: d.slug,
            title: d.title,
            blurb: d.blurb,
            status: d.status ?? null,
            states: d.states ?? [],
            readiness,
            files,
            registry: `${category.slug}-${d.slug}`,
          };
        }),
      };
    }),
  }));

  const kinds = groups.flatMap((g) => g.kinds);
  return {
    totals: { groups: groups.length, kinds: kinds.length, screens: kinds.reduce((n, k) => n + k.screens.length, 0) },
    groups,
  };
}

function buildMeta(manifest: Manifest) {
  return {
    title: "Screens",
    description: "Ready-to-wire UI screens",
    icon: "LayoutTemplate",
    root: true,
    pages: manifest.groups.flatMap((g) => [
      `---${g.title}---`,
      ...g.kinds.flatMap((k) => k.screens.map((s) => `${g.slug}/${k.slug}/${s.slug}`)),
    ]),
  };
}

function mdxStub(screen: ManifestScreen): string {
  return `---
title: ${JSON.stringify(screen.title)}
description: ${JSON.stringify(screen.blurb)}
---

## Overview

${screen.blurb}
`;
}

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/** True when `file` holds JSON equal to `value` (formatting-insensitive). */
const jsonMatches = (file: string, value: unknown) =>
  existsSync(file) && isDeepStrictEqual(JSON.parse(readFileSync(file, "utf-8")), value);

/** Every MDX page under content/screens, as group/kind/screen. */
function existingMdx(): string[] {
  if (!existsSync(CONTENT)) return [];
  const out: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full, `${prefix}${name}/`);
      else if (name.endsWith(".mdx")) out.push(`${prefix}${name.slice(0, -4)}`);
    }
  };
  walk(CONTENT, "");
  return out.sort();
}

function main() {
  const check = process.argv.includes("--check");
  const manifest = buildManifest();
  const meta = buildMeta(manifest);
  const expected = manifest.groups
    .flatMap((g) => g.kinds.flatMap((k) => k.screens.map((s) => `${g.slug}/${k.slug}/${s.slug}`)))
    .sort();

  if (check) {
    const problems: string[] = [];
    if (!jsonMatches(MANIFEST, manifest)) problems.push("lib/screens/screens.manifest.json is out of date with the catalogue");
    if (!jsonMatches(META, meta)) problems.push("content/screens/meta.json is out of date with the catalogue");
    const pages = existingMdx();
    for (const p of expected.filter((p) => !pages.includes(p))) problems.push(`missing content/screens/${p}.mdx`);
    for (const p of pages.filter((p) => !expected.includes(p))) problems.push(`orphan content/screens/${p}.mdx (no such screen)`);
    if (problems.length) {
      console.error(`Screens drift (${problems.length}):\n  - ${problems.join("\n  - ")}\nRun: bun scripts/screens-manifest.mts`);
      process.exit(1);
    }
    console.log(`Screens in sync: ${manifest.totals.groups} groups, ${manifest.totals.kinds} kinds, ${manifest.totals.screens} screens.`);
    return;
  }

  // Skip unchanged files: this runs before every dev and build.
  mkdirSync(path.dirname(MANIFEST), { recursive: true });
  if (!jsonMatches(MANIFEST, manifest)) writeFileSync(MANIFEST, json(manifest));
  mkdirSync(CONTENT, { recursive: true });
  if (!jsonMatches(META, meta)) writeFileSync(META, json(meta));
  let created = 0;
  for (const g of manifest.groups) {
    for (const k of g.kinds) {
      mkdirSync(path.join(CONTENT, g.slug, k.slug), { recursive: true });
      for (const s of k.screens) {
        const file = path.join(CONTENT, g.slug, k.slug, `${s.slug}.mdx`);
        if (!existsSync(file)) {
          writeFileSync(file, mdxStub(s));
          created++;
        }
      }
    }
  }
  const orphans = existingMdx().filter((p) => !expected.includes(p));
  console.log(
    `Wrote manifest (${manifest.totals.groups} groups, ${manifest.totals.kinds} kinds, ${manifest.totals.screens} screens), meta.json, ${created} new MDX stub(s).${
      orphans.length ? ` Orphan MDX (not deleted): ${orphans.join(", ")}` : ""
    }`,
  );
}

if (import.meta.main) main();

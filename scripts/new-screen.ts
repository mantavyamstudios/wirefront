#!/usr/bin/env tsx
// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Add a screen in one command: scaffold a ready-to-wire folder that already
 * follows SCREEN-CONTRACT.md, register it in the catalogue, and regenerate
 * everything the site derives from it.
 *
 *   bun run screen:new <group>/<kind>/<screen> --title="Release notes" --blurb="What shipped, newest first."
 *
 * An existing group and kind need nothing more. A new kind also takes
 * --kind-title and --kind-blurb (and optionally --icon=<Wireframe… export>);
 * a new group also takes --group-title and --group-meaning.
 *
 * Writes:
 *   apps/runtime/src/pages/showcase/<kind>-<screen>/  view.tsx, schema.ts, fixtures.ts, demo.tsx
 *   apps/runtime/tests/<kind>-<screen>.test.tsx        wiring tests for the scaffold
 * and adds entries (never rewrites existing ones) to:
 *   apps/runtime/src/lib/designs.ts                    the design (and a new kind's category)
 *   apps/runtime/src/pages/showcase/source-files.ts    (kind, screen) -> folder
 *   apps/www/lib/screens/groups.ts                     a new kind's group (or a new group)
 * then runs the registry build, the screens manifest (MDX page, sidebar),
 * the screen docs and, unless --skip-snapshot, the light and dark previews.
 *
 * The scaffold is a generic list (items, loading, empty, error, create);
 * replace its view, schema and fixtures with the real screen, keeping the
 * contract. Every check (`bun run test`, `bun run test:browser`) passes on
 * the scaffold as written.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUNTIME = path.join(ROOT, "apps/runtime");
const DESIGNS = path.join(RUNTIME, "src/lib/designs.ts");
const SOURCE_FILES = path.join(RUNTIME, "src/pages/showcase/source-files.ts");
const SHOWCASE = path.join(RUNTIME, "src/pages/showcase");
const GROUPS = path.join(ROOT, "apps/www/lib/screens/groups.ts");
const HEADER = "// SPDX-License-Identifier: MIT\n// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront\n";

const fail = (message: string): never => {
  console.error(`screen:new: ${message}`);
  process.exit(1);
};

// ---------------------------------------------------------------------------
// Arguments

const args = process.argv.slice(2);
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const target = args.find((a) => !a.startsWith("--")) ?? fail("usage: bun run screen:new <group>/<kind>/<screen> --title=… --blurb=…");
const [group, kind, screen, ...rest] = target.split("/");
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
if (rest.length || !group || !kind || !screen) fail(`"${target}" is not <group>/<kind>/<screen>`);
for (const s of [group, kind, screen]) if (!SLUG.test(s)) fail(`"${s}" is not a lowercase, hyphenated slug`);
const title = flag("title") ?? fail("--title is required (the screen's name, e.g. --title=\"Release notes\")");
const blurb = flag("blurb") ?? fail("--blurb is required (one sentence: what the screen does)");
const skipSnapshot = args.includes("--skip-snapshot");

const pascal = (s: string) => s.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
const camel = (s: string) => pascal(s).charAt(0).toLowerCase() + pascal(s).slice(1);
const folder = `${kind}-${screen}`;
const component = /^[0-9]/.test(pascal(screen)) ? `Screen${pascal(screen)}` : pascal(screen);
const messagesConst = `${folder.replaceAll("-", "_").toUpperCase()}_MESSAGES`;
const namespace = camel(folder);
const showcasePage = `${pascal(folder)}ShowcasePage`;
const q = (s: string) => JSON.stringify(s);

if (existsSync(path.join(SHOWCASE, folder))) fail(`apps/runtime/src/pages/showcase/${folder}/ already exists`);

// ---------------------------------------------------------------------------
// Inserting into the catalogue files: find the spot with the TypeScript AST,
// then splice text in, so existing entries and formatting are left untouched.

interface Edit {
  at: number;
  text: string;
}

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function apply(file: string, edits: Edit[]) {
  let text = readFileSync(file, "utf8");
  for (const edit of [...edits].sort((a, b) => b.at - a.at)) text = text.slice(0, edit.at) + edit.text + text.slice(edit.at);
  writeFileSync(file, text);
}

function variable(source: ts.SourceFile, name: string): ts.Expression {
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.name.text === name && decl.initializer) return decl.initializer;
    }
  }
  return fail(`${path.relative(ROOT, source.fileName)} has no \`${name}\``);
}

const keyOf = (p: ts.ObjectLiteralElementLike, source: ts.SourceFile) =>
  p.name ? p.name.getText(source).replace(/^["']|["']$/g, "") : undefined;

function property(obj: ts.ObjectLiteralExpression, key: string, source: ts.SourceFile): ts.PropertyAssignment | undefined {
  return obj.properties.find((p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && keyOf(p, source) === key);
}

function stringProp(obj: ts.ObjectLiteralExpression, key: string, source: ts.SourceFile): string | undefined {
  const p = property(obj, key, source);
  return p && ts.isStringLiteral(p.initializer) ? p.initializer.text : undefined;
}

/** The indentation of the line `node` starts on. */
function indentOf(node: ts.Node, source: ts.SourceFile): string {
  const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
  const start = source.getPositionOfLineAndCharacter(line, 0);
  return /^\s*/.exec(source.text.slice(start, node.getStart(source)))?.[0] ?? "";
}

/** Text inserted after the last element of an array or object literal, at its indentation. */
function append(list: ts.NodeArray<ts.Node>, container: ts.Node, source: ts.SourceFile, item: string): Edit {
  const last = list.at(-1);
  if (!last) return fail(`${path.relative(ROOT, source.fileName)}: an empty list at line ${source.getLineAndCharacterOfPosition(container.getStart(source)).line + 1}`);
  const indent = indentOf(last, source);
  const body = item.split("\n").map((line, i) => (i === 0 ? line : `${indent}${line}`)).join("\n");
  return { at: last.getEnd(), text: `,\n${indent}${body}` };
}

const asArray = (e: ts.Expression, what: string) => (ts.isArrayLiteralExpression(e) ? e : fail(`${what} is not an array literal`));
const asObject = (e: ts.Expression, what: string) => (ts.isObjectLiteralExpression(e) ? e : fail(`${what} is not an object literal`));

// designs.ts
const designsSource = parse(DESIGNS);
const categories = asArray(variable(designsSource, "CATEGORIES"), "CATEGORIES");
const categoryNodes = categories.elements.filter(ts.isObjectLiteralExpression);
const category = categoryNodes.find((c) => stringProp(c, "slug", designsSource) === kind);
const designEntry = `{\n  slug: ${q(screen)},\n  title: ${q(title)},\n  blurb: ${q(blurb)},\n  status: "new",\n  states: ["ready", "loading", "empty", "error"],\n}`;
const designEdits: Edit[] = [];
if (category) {
  const designs = asArray(property(category, "designs", designsSource)?.initializer ?? fail(`category ${kind} has no designs`), `${kind}.designs`);
  for (const d of designs.elements.filter(ts.isObjectLiteralExpression)) {
    if (stringProp(d, "slug", designsSource) === screen) fail(`${kind}/${screen} is already in designs.ts`);
  }
  designEdits.push(append(designs.elements, designs, designsSource, designEntry));
} else {
  const kindTitle = flag("kind-title") ?? fail(`"${kind}" is a new kind: pass --kind-title and --kind-blurb`);
  const kindBlurb = flag("kind-blurb") ?? fail(`"${kind}" is a new kind: pass --kind-blurb`);
  const icon = flag("icon") ?? "WireframeCard";
  if (!new RegExp(`\\b${icon}\\b`).test(designsSource.text.slice(0, designsSource.text.indexOf("export type CategorySlug")))) {
    fail(`--icon=${icon} is not imported in designs.ts (pick one of the Wireframe… icons it imports)`);
  }
  const union = designsSource.statements.find((s): s is ts.TypeAliasDeclaration => ts.isTypeAliasDeclaration(s) && s.name.text === "CategorySlug");
  const unionType = union?.type;
  const members =
    unionType && ts.isUnionTypeNode(unionType) ? unionType.types : fail("designs.ts: CategorySlug is not a union of strings");
  designEdits.push({ at: members.at(-1)?.getEnd() ?? fail("CategorySlug is empty"), text: `\n  | ${q(kind)}` });
  const categoryEntry = `{\n  slug: ${q(kind)},\n  title: ${q(kindTitle)},\n  blurb: ${q(kindBlurb)},\n  Icon: ${icon},\n  designs: [\n    ${designEntry.split("\n").join("\n    ")},\n  ],\n}`;
  designEdits.push(append(categories.elements, categories, designsSource, categoryEntry));
}

// source-files.ts
const sourceFilesSource = parse(SOURCE_FILES);
const sourceMap = asObject(variable(sourceFilesSource, "SOURCE_FILES"), "SOURCE_FILES");
const kindMap = property(sourceMap, kind, sourceFilesSource);
const keyText = (k: string) => (/^[a-z_$][\w$]*$/i.test(k) ? k : q(k));
const sourceEdits: Edit[] = [];
if (kindMap) {
  const map = asObject(kindMap.initializer, `SOURCE_FILES.${kind}`);
  if (property(map, screen, sourceFilesSource)) fail(`${kind}/${screen} is already in source-files.ts`);
  sourceEdits.push(append(map.properties, map, sourceFilesSource, `${keyText(screen)}: ${q(folder)}`));
} else {
  sourceEdits.push(append(sourceMap.properties, sourceMap, sourceFilesSource, `${keyText(kind)}: {\n  ${keyText(screen)}: ${q(folder)},\n}`));
}

// groups.ts
const groupsSource = parse(GROUPS);
const groups = asArray(variable(groupsSource, "SCREEN_GROUPS"), "SCREEN_GROUPS");
const groupNodes = groups.elements.filter(ts.isObjectLiteralExpression);
const kindGroup = groupNodes.find((g) => {
  const kinds = property(g, "kinds", groupsSource)?.initializer;
  return kinds && ts.isArrayLiteralExpression(kinds) && kinds.elements.some((k) => ts.isStringLiteral(k) && k.text === kind);
});
const groupEdits: Edit[] = [];
if (kindGroup) {
  const actual = stringProp(kindGroup, "slug", groupsSource);
  if (actual !== group) fail(`kind "${kind}" is in group "${actual}", not "${group}": use ${actual}/${kind}/${screen}`);
} else {
  const existing = groupNodes.find((g) => stringProp(g, "slug", groupsSource) === group);
  if (existing) {
    const kinds = asArray(property(existing, "kinds", groupsSource)?.initializer ?? fail(`group ${group} has no kinds`), `${group}.kinds`);
    groupEdits.push({ at: kinds.elements.at(-1)?.getEnd() ?? fail(`group ${group} lists no kinds`), text: `, ${q(kind)}` });
  } else {
    const groupTitle = flag("group-title") ?? fail(`"${group}" is a new group: pass --group-title and --group-meaning`);
    const meaning = flag("group-meaning") ?? fail(`"${group}" is a new group: pass --group-meaning`);
    groupEdits.push(append(groups.elements, groups, groupsSource, `{ slug: ${q(group)}, title: ${q(groupTitle)}, meaning: ${q(meaning)}, kinds: [${q(kind)}] }`));
  }
}

// ---------------------------------------------------------------------------
// The scaffold.

const view = `${HEADER}"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { PlusIcon, RotateCwIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { Item } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider \`messages\` ("${namespace}.<key>"). */
export const ${messagesConst} = {
  title: ${q(title)},
  description: ${q(blurb)},
  create: "New item",
  empty: "Nothing here yet.",
  loading: "Loading",
  retry: "Try again",
  updated: "Updated {date}",
};

export interface ${component}Props {
  /** The items to show. */
  items: Item[];
  /** "loading" shows placeholder rows; "error" shows \`error\` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  /** Why the items failed to load. */
  error?: string;
  /** Load the items again after an error. The button only shows when this is given. */
  onRetry?: () => void;
  /** Create an item. The button only shows when this is given; it shows progress and errors. */
  onCreate?: Action;
  className?: string;
}

function ${component}Screen({ items, status = "ready", error, onRetry, onCreate, className }: ${component}Props) {
  const t = useMessages("${namespace}", ${messagesConst});
  const format = useFormat();
  const create = useAction(onCreate ?? (async () => {}));

  let body: ReactNode;
  if (status === "loading") {
    body = (
      <ul aria-busy="true" aria-label={t.loading} className="mt-8 flex flex-col gap-2">
        {[0, 1, 2].map((row) => (
          <li className="h-12 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" key={row} />
        ))}
      </ul>
    );
  } else if (status === "error") {
    body = (
      <div className="mt-8 rounded-lg border border-border p-6 text-center" role="alert">
        <p className="text-sm">{error}</p>
        {onRetry ? (
          <Button className="mt-4" onClick={onRetry} type="button" variant="outline">
            <RotateCwIcon data-icon="inline-start" />
            {t.retry}
          </Button>
        ) : null}
      </div>
    );
  } else if (items.length === 0) {
    body = <p className="mt-8 rounded-lg border border-border border-dashed p-6 text-center text-muted-foreground text-sm">{t.empty}</p>;
  } else {
    body = (
      <ul className="mt-8 flex flex-col divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3" key={item.id}>
            <span className="min-w-0 font-medium text-sm">{item.title}</span>
            <span className="text-muted-foreground text-xs">{interpolate(t.updated, { date: format.date(item.updatedAt) })}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl tracking-tight">{t.title}</h1>
            <p className="mt-1 text-muted-foreground text-sm">{t.description}</p>
          </div>
          {onCreate ? (
            <Button aria-busy={create.isPending()} disabled={create.isPending()} onClick={() => void create.run()} type="button">
              {create.isPending() ? <Spinner data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
              {t.create}
            </Button>
          ) : null}
        </div>
        {create.error ? (
          <p className="mt-3 text-destructive-foreground text-sm" role="alert">
            {create.error}
          </p>
        ) : null}
        {body}
      </div>
    </div>
  );
}

export function ${component}(props: ${component}Props) {
  return (
    <ScreenBoundary name="${component}">
      <${component}Screen {...props} />
    </ScreenBoundary>
  );
}
`;

const schema = `${HEADER}import * as z from "zod";
import { defineApi } from "@wirefront/ui/wirefront/api";

export const Item = z
  .object({
    id: z.string(),
    title: z.string(),
    /** ISO 8601. */
    updatedAt: z.string(),
  })
  .meta({ id: "${component}Item" });
export type Item = z.infer<typeof Item>;

/** The backend operations this screen calls. */
export const api = defineApi({
  listItems: { method: "GET", path: "/items", summary: "The items this screen lists", response: z.array(Item) },
  createItem: {
    method: "POST",
    path: "/items",
    summary: "Create an item",
    body: z.object({ title: z.string().min(1) }),
    response: Item,
  },
});
`;

const fixtures = `${HEADER}import type { Item } from "./schema";

/** What the mocks return for \`listItems\`. */
export const listItems: Item[] = [
  { id: "item_1", title: "First item", updatedAt: "2026-11-20T09:30:00Z" },
  { id: "item_2", title: "Second item", updatedAt: "2026-11-18T16:05:00Z" },
  { id: "item_3", title: "Third item", updatedAt: "2026-11-12T11:40:00Z" },
];

/** What the mocks return for \`createItem\`. */
export const createItem: Item = { id: "item_4", title: "New item", updatedAt: "2026-11-21T08:00:00Z" };
`;

const demo = `${HEADER}// Showcase only: the view with fixture data and the previewed state.
// Not shipped by the registry; builders wire ${component} to their own backend.
import { useShowcaseState } from "@/lib/showcase-state";
import * as fixtures from "./fixtures";
import { ${component} } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ${showcasePage}() {
  const state = useShowcaseState();
  return (
    <${component}
      error={state === "error" ? "The items didn’t load." : undefined}
      items={state === "empty" ? [] : fixtures.listItems}
      onCreate={() => wait(700)}
      onRetry={() => {}}
      status={state === "loading" ? "loading" : state === "error" ? "error" : "ready"}
    />
  );
}
`;

const test = `${HEADER}// @vitest-environment jsdom
/**
 * The wiring contract of ${kind}/${screen}: what the screen shows for the
 * items it is given, and what its actions receive and show.
 */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WirefrontProvider } from "@wirefront/ui/wirefront/provider";
import { fail } from "@wirefront/ui/wirefront/types";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as fixtures from "@/pages/showcase/${folder}/fixtures";
import { ${component} } from "@/pages/showcase/${folder}/view";

afterEach(cleanup);
const en = (ui: ReactNode) => <WirefrontProvider locale="en-US">{ui}</WirefrontProvider>;

describe("${component}", () => {
  it("lists the items it is given and hides create when it isn't wired", () => {
    render(en(<${component} items={fixtures.listItems} />));
    for (const item of fixtures.listItems) expect(screen.getByText(item.title)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /New item/ })).toBeNull();
  });

  it("shows the empty state", () => {
    render(en(<${component} items={[]} />));
    expect(screen.getByText("Nothing here yet.")).toBeTruthy();
  });

  it("shows the error and retries", () => {
    const onRetry = vi.fn();
    render(en(<${component} error="The items didn’t load." items={[]} onRetry={onRetry} status="error" />));
    expect(screen.getByRole("alert").textContent).toContain("The items didn’t load.");
    fireEvent.click(screen.getByRole("button", { name: /Try again/ }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("calls onCreate and shows a returned failure", async () => {
    const onCreate = vi.fn(async () => fail("There's no room for another item."));
    render(en(<${component} items={fixtures.listItems} onCreate={onCreate} />));
    fireEvent.click(screen.getByRole("button", { name: /New item/ }));
    expect(onCreate).toHaveBeenCalled();
    expect((await screen.findByRole("alert")).textContent).toContain("There's no room for another item.");
  });
});
`;

// ---------------------------------------------------------------------------

const dir = path.join(SHOWCASE, folder);
mkdirSync(dir);
writeFileSync(path.join(dir, "view.tsx"), view);
writeFileSync(path.join(dir, "schema.ts"), schema);
writeFileSync(path.join(dir, "fixtures.ts"), fixtures);
writeFileSync(path.join(dir, "demo.tsx"), demo);
const testFile = path.join(RUNTIME, "tests", `${folder}.test.tsx`);
if (!existsSync(testFile)) writeFileSync(testFile, test);
apply(DESIGNS, designEdits);
apply(SOURCE_FILES, sourceEdits);
if (groupEdits.length) apply(GROUPS, groupEdits);

console.log(`Scaffolded ${group}/${kind}/${screen} in apps/runtime/src/pages/showcase/${folder}/ and registered it.`);

function run(label: string, command: string, commandArgs: string[], cwd = ROOT) {
  console.log(`\n> ${label}`);
  const result = spawnSync(command, commandArgs, { cwd, stdio: "inherit" });
  if (result.status !== 0) fail(`${label} failed (exit ${result.status ?? result.signal}); fix it and run the step again`);
}

run("shadcn registry item", "bun", ["run", "registry"]);
run("screens manifest, sidebar and MDX page", "bun", ["run", "--cwd", "apps/www", "screens:manifest"]);
run("screen docs (usage example typechecked)", "bun", ["run", "--cwd", "apps/www", "screens:docs", "--check"]);
if (skipSnapshot) {
  console.log(`\nPreviews skipped (--skip-snapshot). The catalogue test needs them: bun run snapshot -- --design=${kind}/${screen}`);
} else {
  run("light and dark previews", "bun", ["run", "snapshot", "--", `--design=${kind}/${screen}`]);
}

console.log(`
Done. Next:
  1. Replace the scaffold in apps/runtime/src/pages/showcase/${folder}/ with the real screen (SCREEN-CONTRACT.md),
     and its tests in apps/runtime/tests/${folder}.test.tsx.
  2. Write its page: apps/www/content/screens/${group}/${kind}/${screen}.mdx.
  3. bun run dev: the screen is at http://localhost:3000/${group}/${kind}/${screen}
     (the dev watcher re-syncs the site as you edit).
  4. After visual changes: bun run snapshot -- --design=${kind}/${screen}
  5. Commit; the pre-commit hook re-syncs the generated files.`);

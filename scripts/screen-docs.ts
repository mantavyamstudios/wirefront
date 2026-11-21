#!/usr/bin/env tsx
// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Reference docs for every screen, read from the screen's own code, so they
 * can never drift from it:
 *
 *   view.tsx     the component, its props (types, JSDoc, defaults), its copy
 *                (<NAME>_MESSAGES and the useMessages namespace) and the
 *                permissions it checks (can("action", "resource"))
 *   schema.ts    the backend contract (defineApi: method, path, request,
 *                response, errors) and the data types it exports
 *   fixtures.ts  sample data, used to build a usage example that typechecks
 *   public/r     what the shadcn CLI installs: files, packages, shadcn components
 *
 *   tsx scripts/screen-docs.ts          write apps/www/lib/screens/screen-docs.json
 *   tsx scripts/screen-docs.ts --check  also typecheck every usage example against the real screen
 *
 * Runs before the site's dev, build and typecheck (after the screens manifest).
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import * as z from "zod";

import type { ApiContract } from "../packages/ui/src/wirefront/api";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUNTIME = path.join(ROOT, "apps/runtime");
const SHOWCASE = path.join(RUNTIME, "src/pages/showcase");
const WWW = path.join(ROOT, "apps/www");
const MANIFEST = path.join(WWW, "lib/screens/screens.manifest.json");
const OUT = path.join(WWW, "lib/screens/screen-docs.json");
const CHECK_DIR = path.join(RUNTIME, "src/.screen-docs-check");

export interface DocProp {
  default?: string;
  description?: string;
  name: string;
  required: boolean;
  type: string;
}
export interface DocOperation {
  description?: string;
  errors: { status: string; description: string }[];
  method: string;
  name: string;
  params?: string;
  path: string;
  query?: string;
  request?: string;
  response?: string;
}
export interface DocType {
  description?: string;
  fields: DocProp[];
  name: string;
  /** Set when the type is not an object (a union, an enum, an array). */
  alias?: string;
}
export interface ScreenDoc {
  api: DocOperation[];
  component: string;
  /** What the CLI writes, relative to the project's components / hooks / lib folders' parent. */
  files: string[];
  messages: { namespace: string; entries: { key: string; value: string }[] } | null;
  npmDependencies: string[];
  permissions: { action: string; resource?: string }[];
  props: DocProp[];
  registryDependencies: string[];
  types: DocType[];
  usage: string;
}

interface ManifestScreen {
  files: string[];
  registry: string;
  slug: string;
}
interface Manifest {
  groups: { kinds: { slug: string; screens: ManifestScreen[] }[] }[];
}

const fail = (message: string): never => {
  throw new Error(`screen-docs: ${message}`);
};

// ---------------------------------------------------------------------------
// The TypeScript program over every screen.

function createProgram(roots: string[]): ts.Program {
  const configPath = path.join(RUNTIME, "tsconfig.json");
  const parsed = ts.getParsedCommandLineOfConfigFile(configPath, {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (d) => fail(ts.flattenDiagnosticMessageText(d.messageText, "\n")),
  });
  const options = parsed?.options ?? fail("cannot read apps/runtime/tsconfig.json");
  return ts.createProgram({ rootNames: roots, options: { ...options, noEmit: true } });
}

/** The props type of a view export (its first parameter), if it takes any. */
function componentProps(checker: ts.TypeChecker, view: ts.SourceFile, component: string, registry: string): ts.Type | undefined {
  const viewModule = checker.getSymbolAtLocation(view);
  const exported =
    (viewModule && checker.getExportsOfModule(viewModule).find((s) => s.getName() === component)) ??
    fail(`${registry}: view.tsx does not export ${component}`);
  const signature = checker.getSignaturesOfType(checker.getTypeOfSymbolAtLocation(exported, view), ts.SignatureKind.Call)[0];
  const props = signature?.parameters[0];
  return props ? checker.getTypeOfSymbolAtLocation(props, view) : undefined;
}

const TYPE_FLAGS = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;

function docOf(checker: ts.TypeChecker, symbol: ts.Symbol): string | undefined {
  const text = ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
  return text || undefined;
}

/** Default values from destructured props (`{ size = "md" }`) in any function of the file. */
function destructuredDefaults(source: ts.SourceFile): Map<string, string> {
  const defaults = new Map<string, string>();
  const visit = (node: ts.Node) => {
    if (ts.isFunctionLike(node) && node.parameters?.[0] && ts.isObjectBindingPattern(node.parameters[0].name)) {
      for (const element of node.parameters[0].name.elements) {
        if (!element.initializer) continue;
        const name = (element.propertyName ?? element.name).getText(source);
        if (!defaults.has(name)) defaults.set(name, element.initializer.getText(source));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return defaults;
}

function propsOf(checker: ts.TypeChecker, type: ts.Type, at: ts.Node, defaults: Map<string, string>): DocProp[] {
  return checker.getPropertiesOfType(type).map((prop) => {
    const required = (prop.flags & ts.SymbolFlags.Optional) === 0;
    // The type as written (`Member[]`), not as inferred (zod types expand to their fields).
    const declaration = prop.declarations?.[0];
    const written = declaration && (ts.isPropertySignature(declaration) || ts.isPropertyDeclaration(declaration)) ? declaration.type : undefined;
    let typeText = written
      ? written.getText().replace(/\s+/g, " ").replace(/;\s*}/g, " }")
      : checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, at), at, TYPE_FLAGS);
    if (!required) typeText = typeText.replace(/ \| undefined$/, "").replace(/^undefined \| /, "");
    if (/^\(.*\)$/.test(typeText) && !typeText.includes("=>")) typeText = typeText.slice(1, -1);
    const out: DocProp = { name: prop.getName(), type: typeText, required };
    const description = docOf(checker, prop);
    if (description) out.description = description;
    const fallback = defaults.get(prop.getName());
    if (fallback !== undefined && !required) out.default = fallback;
    return out;
  });
}

/** The view export the showcase renders: the named import from "./view" used as a JSX tag in demo.tsx. */
function componentName(folder: string): string {
  const demoPath = path.join(SHOWCASE, folder, "demo.tsx");
  const demo = ts.createSourceFile(demoPath, readFileSync(demoPath, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const imported = new Set<string>();
  const used = new Set<string>();
  const visit = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === "./view" &&
      node.importClause?.namedBindings &&
      ts.isNamedImports(node.importClause.namedBindings)
    ) {
      for (const el of node.importClause.namedBindings.elements) if (!el.isTypeOnly) imported.add(el.name.text);
    }
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName)) {
      used.add(node.tagName.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(demo);
  const rendered = [...imported].filter((name) => used.has(name));
  if (rendered.length === 0) fail(`${folder}/demo.tsx renders nothing imported from ./view`);
  // A demo that renders more than one view export renders the screen first.
  return rendered[0];
}

function messagesOf(source: ts.SourceFile): ScreenDoc["messages"] {
  let entries: { key: string; value: string }[] | null = null;
  let constName = "";
  let namespace = "";
  const visit = (node: ts.Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      /_MESSAGES$/.test(node.name.text) &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer) &&
      entries === null
    ) {
      constName = node.name.text;
      entries = node.initializer.properties.flatMap((p) =>
        ts.isPropertyAssignment(p) && (ts.isStringLiteral(p.initializer) || ts.isNoSubstitutionTemplateLiteral(p.initializer))
          ? [{ key: p.name.getText(source).replace(/^["']|["']$/g, ""), value: p.initializer.text }]
          : [],
      );
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "useMessages" &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0]) &&
      (!constName || node.arguments[1]?.getText(source) === constName || !namespace)
    ) {
      namespace = node.arguments[0].text;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return entries && namespace ? { namespace, entries } : null;
}

function permissionsOf(source: ts.SourceFile): ScreenDoc["permissions"] {
  const found = new Map<string, { action: string; resource?: string }>();
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "can" &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const action = node.arguments[0].text;
      const second = node.arguments[1];
      const resource = second && ts.isStringLiteral(second) ? second.text : undefined;
      found.set(`${action}:${resource ?? ""}`, resource ? { action, resource } : { action });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return [...found.values()];
}

/** Exported types of schema.ts: their fields (with JSDoc from the zod object) or their alias. */
function typesOf(checker: ts.TypeChecker, source: ts.SourceFile): DocType[] {
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) return [];
  const out: DocType[] = [];
  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    if (!(symbol.flags & ts.SymbolFlags.TypeAlias || symbol.flags & ts.SymbolFlags.Interface)) continue;
    const declaration = symbol.declarations?.[0];
    if (!declaration) continue;
    const type = checker.getDeclaredTypeOfSymbol(symbol);
    // The zod schema of the same name carries the comment.
    const valueSymbol = symbol.flags & ts.SymbolFlags.Value ? symbol : undefined;
    const description = docOf(checker, symbol) ?? (valueSymbol ? docOf(checker, valueSymbol) : undefined);
    const isObject =
      !!(type.flags & ts.TypeFlags.Object) &&
      !checker.isArrayType(type) &&
      !checker.isTupleType(type) &&
      checker.getSignaturesOfType(type, ts.SignatureKind.Call).length === 0;
    const entry: DocType = isObject
      ? { name: symbol.getName(), fields: propsOf(checker, type, declaration, new Map()) }
      : { name: symbol.getName(), fields: [], alias: checker.typeToString(type, declaration, TYPE_FLAGS | ts.TypeFormatFlags.InTypeAlias) };
    if (description) entry.description = description;
    out.push(entry);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The backend contract, read from the module itself.

type Json = Record<string, unknown>;

/** A JSON Schema as a short TypeScript-like type. Named schemas (.meta({ id })) print as their name. */
function typeText(schema: Json, depth = 0): string {
  if (typeof schema.$ref === "string") return schema.$ref.split("/").pop() ?? "unknown";
  if (schema.id && depth > 0 && typeof schema.id === "string") return schema.id;
  if (Array.isArray(schema.anyOf) || Array.isArray(schema.oneOf)) {
    const parts = ((schema.anyOf ?? schema.oneOf) as Json[]).map((s) => typeText(s, depth + 1));
    return [...new Set(parts)].join(" | ");
  }
  if (Array.isArray(schema.enum)) return schema.enum.map((v) => JSON.stringify(v)).join(" | ");
  if ("const" in schema) return JSON.stringify(schema.const);
  const type = schema.type;
  if (Array.isArray(type)) return type.map((t) => typeText({ ...schema, type: t }, depth)).join(" | ");
  switch (type) {
    case "string":
      return "string";
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "null":
      return "null";
    case "array": {
      const items = schema.items ? typeText(schema.items as Json, depth + 1) : "unknown";
      return /[ |]/.test(items) ? `(${items})[]` : `${items}[]`;
    }
    case "object": {
      const props = (schema.properties ?? {}) as Record<string, Json>;
      const required = new Set((schema.required as string[] | undefined) ?? []);
      const keys = Object.keys(props);
      if (keys.length === 0) {
        return schema.additionalProperties && typeof schema.additionalProperties === "object"
          ? `Record<string, ${typeText(schema.additionalProperties as Json, depth + 1)}>`
          : "object";
      }
      return `{ ${keys.map((k) => `${k}${required.has(k) ? "" : "?"}: ${typeText(props[k], depth + 1)}`).join("; ")} }`;
    }
    default:
      return "unknown";
  }
}

function schemaText(schema: z.ZodType, io: "input" | "output"): string {
  const json = z.toJSONSchema(schema, { target: "draft-2020-12", io, unrepresentable: "any" }) as Json;
  return typeText(json);
}

async function apiOf(folder: string): Promise<DocOperation[]> {
  const mod = (await import(pathToFileURL(path.join(SHOWCASE, folder, "schema.ts")).href)) as { api?: ApiContract };
  if (!mod.api) return [];
  return Object.entries(mod.api).map(([name, op]) => {
    const out: DocOperation = {
      name,
      method: op.method,
      path: op.path,
      errors: Object.entries(op.errors ?? {}).map(([status, description]) => ({ status, description })),
    };
    if (op.summary) out.description = op.summary;
    if (op.params) out.params = schemaText(op.params, "input");
    if (op.query) out.query = schemaText(op.query, "input");
    if (op.body) out.request = schemaText(op.body, "input");
    if (op.response) out.response = schemaText(op.response, "output");
    return out;
  });
}

// ---------------------------------------------------------------------------
// A usage example that typechecks: fixtures for required data, async stubs for actions.

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** What a demo imports from the screen's own files, by local name. */
interface DemoImport {
  module: "view" | "schema" | "fixtures" | "react" | "lucide-react";
  /** The exported name (differs from the local name for `import { a as b }`). */
  name: string;
  namespace: boolean;
  typeOnly: boolean;
}

/** Everything the usage example needs beyond its JSX. */
interface UsageNeeds {
  componentDecls: Map<string, string>;
  imports: Map<string, DemoImport>;
  moduleDecls: Map<string, string>;
}

const OWN_MODULES: Record<string, DemoImport["module"]> = {
  "./view": "view",
  "./schema": "schema",
  "./fixtures": "fixtures",
  react: "react",
  "lucide-react": "lucide-react",
};
const SAFE_GLOBALS = new Set(["undefined", "Array", "Object", "JSON", "String", "Number", "Boolean"]);

/**
 * Reads demo.tsx: its imports from the screen's own files, its module-level
 * constants, the useState pairs in its page component, and the attributes it
 * passes to the screen.
 */
class Demo {
  readonly attributes = new Map<string, ts.Expression | null>();
  readonly imports = new Map<string, DemoImport>();
  readonly moduleConsts = new Map<string, ts.VariableDeclaration>();
  readonly states = new Map<string, { decl: ts.VariableDeclaration; value: string; setter?: string }>();
  readonly source: ts.SourceFile;

  constructor(folder: string, component: string) {
    const file = path.join(SHOWCASE, folder, "demo.tsx");
    this.source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const statement of this.source.statements) {
      if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
        const module = OWN_MODULES[statement.moduleSpecifier.text];
        const clause = statement.importClause;
        if (!module || !clause?.namedBindings) continue;
        if (ts.isNamespaceImport(clause.namedBindings)) {
          this.imports.set(clause.namedBindings.name.text, { module, name: "*", namespace: true, typeOnly: clause.isTypeOnly });
        } else {
          for (const el of clause.namedBindings.elements) {
            this.imports.set(el.name.text, {
              module,
              name: (el.propertyName ?? el.name).text,
              namespace: false,
              typeOnly: clause.isTypeOnly || el.isTypeOnly,
            });
          }
        }
      }
      if (ts.isVariableStatement(statement)) {
        for (const decl of statement.declarationList.declarations) {
          if (ts.isIdentifier(decl.name) && decl.initializer) this.moduleConsts.set(decl.name.text, decl);
        }
      }
    }
    const visit = (node: ts.Node) => {
      // const [value, setValue] = useState<T>(initial)
      if (
        ts.isVariableDeclaration(node) &&
        ts.isArrayBindingPattern(node.name) &&
        node.initializer &&
        ts.isCallExpression(node.initializer) &&
        ts.isIdentifier(node.initializer.expression) &&
        node.initializer.expression.text === "useState"
      ) {
        const [value, setter] = node.name.elements.map((e) => (ts.isBindingElement(e) && ts.isIdentifier(e.name) ? e.name.text : undefined));
        if (value) this.states.set(value, { decl: node, value, setter });
      }
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && ts.isIdentifier(node.tagName) && node.tagName.text === component && this.attributes.size === 0) {
        for (const attr of node.attributes.properties) {
          if (!ts.isJsxAttribute(attr) || !ts.isIdentifier(attr.name)) continue;
          const init = attr.initializer;
          if (!init) this.attributes.set(attr.name.text, ts.factory.createTrue());
          else if (ts.isStringLiteral(init)) this.attributes.set(attr.name.text, init);
          else if (ts.isJsxExpression(init) && init.expression) this.attributes.set(attr.name.text, init.expression);
          else this.attributes.set(attr.name.text, null);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(this.source);
  }

  setterOf(name: string): string | undefined {
    for (const state of this.states.values()) if (state.setter === name) return state.value;
    return undefined;
  }

  /**
   * The expression as portable source, with what it depends on added to `needs`;
   * null when it reaches anything showcase-only (helpers, simulated latency, the clock).
   */
  portable(expr: ts.Node, needs: UsageNeeds, seen = new Set<string>()): string | null {
    // A callback as the whole value is the screen's action, not data.
    if (ts.isArrowFunction(expr) || ts.isFunctionExpression(expr)) return null;
    let ok = true;
    const bound = new Set<string>();
    const bind = (name: ts.BindingName) => {
      if (ts.isIdentifier(name)) bound.add(name.text);
      else for (const el of name.elements) if (ts.isBindingElement(el)) bind(el.name);
    };
    const check = (node: ts.Node): void => {
      if (!ok) return;
      // Callbacks inside data (`items.map((p) => …)`) may use their own parameters.
      if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        for (const p of node.parameters) bind(p.name);
        check(node.body);
        return;
      }
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxClosingElement(node)) {
        const tag = node.tagName;
        if (ts.isIdentifier(tag) && /^[A-Z]/.test(tag.text) && !this.use(tag.text, needs, seen)) ok = false;
        if (!ts.isJsxClosingElement(node)) check(node.attributes);
        return;
      }
      if (ts.isJsxAttribute(node)) {
        if (node.initializer) check(node.initializer);
        return;
      }
      if (ts.isPropertyAccessExpression(node)) {
        check(node.expression);
        return;
      }
      if (ts.isPropertyAssignment(node)) {
        if (ts.isComputedPropertyName(node.name)) check(node.name.expression);
        check(node.initializer);
        return;
      }
      if (ts.isShorthandPropertyAssignment(node)) {
        if (!bound.has(node.name.text) && !this.use(node.name.text, needs, seen)) ok = false;
        return;
      }
      if (ts.isTypeNode(node)) {
        if (ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
          const imported = this.imports.get(node.typeName.text);
          if (!imported || imported.module === "react" || imported.module === "lucide-react") ok = false;
          else if (!needs.imports.has(node.typeName.text)) needs.imports.set(node.typeName.text, { ...imported, typeOnly: true });
        }
        ts.forEachChild(node, check);
        return;
      }
      if (ts.isIdentifier(node)) {
        if (!bound.has(node.text) && !this.use(node.text, needs, seen)) ok = false;
        return;
      }
      ts.forEachChild(node, check);
    };
    check(expr);
    return ok ? expr.getText(this.source) : null;
  }

  private use(name: string, needs: UsageNeeds, seen: Set<string>): boolean {
    if (SAFE_GLOBALS.has(name)) return true;
    const imported = this.imports.get(name);
    if (imported) {
      if (imported.module === "react") return false;
      const existing = needs.imports.get(name);
      needs.imports.set(name, { ...imported, typeOnly: existing ? existing.typeOnly && imported.typeOnly : false });
      return true;
    }
    if (seen.has(name)) return true;
    seen.add(name);
    const constant = this.moduleConsts.get(name);
    if (constant?.initializer) {
      const text = this.portable(constant.initializer, needs, seen);
      if (text === null) return false;
      const type = constant.type ? this.portable(constant.type, needs, seen) : null;
      // Without its annotation the constant would type differently.
      if (constant.type && type === null) return false;
      needs.moduleDecls.set(name, `const ${name}${type ? `: ${type}` : ""} = ${text};`);
      return true;
    }
    const stateName = this.states.has(name) ? name : this.setterOf(name);
    const state = stateName === undefined ? undefined : this.states.get(stateName);
    if (state?.decl.initializer && ts.isCallExpression(state.decl.initializer)) {
      const call = state.decl.initializer;
      const initial = call.arguments[0] ? this.portable(call.arguments[0], needs, seen) : "";
      const typeArgs = call.typeArguments?.map((t) => this.portable(t, needs, seen));
      if (initial === null || typeArgs?.some((t) => t === null)) return false;
      needs.imports.set("useState", { module: "react", name: "useState", namespace: false, typeOnly: false });
      needs.componentDecls.set(
        state.value,
        `const [${state.value}${state.setter ? `, ${state.setter}` : ""}] = useState${typeArgs ? `<${typeArgs.join(", ")}>` : ""}(${initial});`,
      );
      return true;
    }
    return false;
  }
}

/**
 * A fixture that fits `type`: the export of the same name, any export, the
 * first item of an array export or a property of an object export.
 */
function fixtureFor(
  checker: ts.TypeChecker,
  fixtures: ts.Symbol[],
  at: ts.SourceFile | undefined,
  name: string,
  type: ts.Type,
): string | undefined {
  if (!at) return undefined;
  const fits = (t: ts.Type) => checker.isTypeAssignableTo(t, type);
  const candidates: string[] = [];
  for (const f of fixtures) {
    const t = checker.getTypeOfSymbolAtLocation(f, at);
    if (fits(t)) candidates.push(f.getName());
  }
  const direct = candidates.find((c) => c === name) ?? candidates[0];
  if (direct) return direct;
  for (const f of fixtures) {
    const t = checker.getTypeOfSymbolAtLocation(f, at);
    if (checker.isArrayType(t)) {
      const item = checker.getTypeArguments(t as ts.TypeReference)[0];
      if (item && fits(item)) return `${f.getName()}[0]`;
    } else if (t.flags & ts.TypeFlags.Object) {
      const prop = checker.getPropertiesOfType(t).find((p) => fits(checker.getTypeOfSymbolAtLocation(p, at)));
      if (prop && /^[A-Za-z_$][\w$]*$/.test(prop.getName())) return `${f.getName()}.${prop.getName()}`;
    }
  }
  return undefined;
}

/** A small object literal for a plain object type: its required fields, filled with placeholders. */
function sampleLiteral(checker: ts.TypeChecker, type: ts.Type, at: ts.Node, depth = 0): string | undefined {
  const text = checker.typeToString(type);
  if (text === "string") return '"Acme"';
  if (text === "number") return "0";
  if (text === "boolean") return "false";
  if (checker.isArrayType(type)) return "[]";
  if (depth > 2 || !(type.flags & ts.TypeFlags.Object) || checker.getSignaturesOfType(type, ts.SignatureKind.Call).length) return undefined;
  const fields: string[] = [];
  for (const prop of checker.getPropertiesOfType(type)) {
    if (prop.flags & ts.SymbolFlags.Optional) continue;
    const value = sampleLiteral(checker, checker.getTypeOfSymbolAtLocation(prop, at), at, depth + 1);
    if (value === undefined) return undefined;
    fields.push(`${prop.getName()}: ${value}`);
  }
  return `{ ${fields.join(", ")} }`;
}

function usageOf(
  checker: ts.TypeChecker,
  viewSource: ts.SourceFile,
  fixturesSource: ts.SourceFile | undefined,
  folder: string,
  component: string,
  propsType: ts.Type | undefined,
  api: DocOperation[],
  importBase: string,
): { usage: string; unresolved: string[] } {
  const fixturesModule = fixturesSource ? checker.getSymbolAtLocation(fixturesSource) : undefined;
  const fixtures = fixturesModule ? checker.getExportsOfModule(fixturesModule).filter((s) => s.flags & ts.SymbolFlags.Value) : [];
  const fixtureType = (name: string) => {
    const symbol = fixtures.find((f) => f.getName() === name);
    return symbol && fixturesSource ? checker.getTypeOfSymbolAtLocation(symbol, fixturesSource) : undefined;
  };
  const operations = new Map(api.map((op) => [op.name.toLowerCase(), op]));
  const demo = new Demo(folder, component);
  const needs: UsageNeeds = { imports: new Map(), moduleDecls: new Map(), componentDecls: new Map() };
  const useFixtures = () => needs.imports.set("fixtures", { module: "fixtures", name: "*", namespace: true, typeOnly: false });

  const lines: string[] = [];
  const unresolved: string[] = [];
  let children: string | undefined;
  for (const prop of propsType ? checker.getPropertiesOfType(propsType) : []) {
    if (prop.flags & ts.SymbolFlags.Optional) continue;
    const name = prop.getName();
    const type = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(prop, viewSource));
    const typeName = checker.typeToString(type);
    if (name === "children") {
      children = /ReactNode|ReactElement|Element/.test(typeName) ? `      <main className="p-6">Your page</main>` : undefined;
      if (!children) unresolved.push(`children: ${typeName}`);
      continue;
    }
    const callable = checker.getSignaturesOfType(type, ts.SignatureKind.Call)[0];
    const fromDemo = demo.attributes.get(name);
    if (callable) {
      // A useState setter in the demo (onQueryChange={setQuery}) stays one.
      if (fromDemo && ts.isIdentifier(fromDemo) && demo.setterOf(fromDemo.text) && demo.portable(fromDemo, needs) !== null) {
        lines.push(`      ${name}={${fromDemo.text}}`);
        continue;
      }
      const returnType = checker.getReturnTypeOfSignature(callable);
      const returned = checker.typeToString(returnType);
      const isAsync = returned.startsWith("Promise<");
      const resolved = isAsync ? (checker.getAwaitedType(returnType) ?? returnType) : returnType;
      const op = operations.get(lowerFirst(name.replace(/^on/, "")).toLowerCase());
      const params = callable.parameters.length > 0 ? "(input)" : "()";
      const voidish = (t: ts.Type): boolean =>
        t.isUnion() ? t.types.some(voidish) : !!(t.flags & (ts.TypeFlags.Void | ts.TypeFlags.Undefined | ts.TypeFlags.Any | ts.TypeFlags.Unknown));
      let result: string | undefined;
      if (!voidish(resolved)) {
        const sample = op ? fixtureType(op.name) : undefined;
        if (op && sample && checker.isTypeAssignableTo(sample, resolved)) {
          useFixtures();
          result = `fixtures.${op.name}`;
        } else if (checker.isTypeAssignableTo(checker.getTrueType(), resolved)) result = "true";
        else if (checker.isTypeAssignableTo(checker.getStringType(), resolved)) result = '""';
        else {
          unresolved.push(`${name}: returns ${checker.typeToString(resolved)}`);
          continue;
        }
      }
      const comment = op ? `// ${op.method} ${op.path}` : isAsync ? "// call your backend" : "";
      const statements = [comment, result ? `return ${result};` : ""].filter(Boolean);
      lines.push(
        statements.length
          ? `      ${name}={${isAsync ? "async " : ""}${params} => {\n${statements.map((l) => `        ${l}`).join("\n")}\n      }}`
          : `      ${name}={${params} => {}}`,
      );
      continue;
    }
    // Data: what the demo passes, when it is portable; else a fixture that fits; else a literal.
    if (fromDemo) {
      const trial: UsageNeeds = { imports: new Map(needs.imports), moduleDecls: new Map(needs.moduleDecls), componentDecls: new Map(needs.componentDecls) };
      const text = demo.portable(fromDemo, trial);
      if (text !== null) {
        Object.assign(needs, trial);
        lines.push(ts.isStringLiteral(fromDemo) ? `      ${name}=${text}` : `      ${name}={${text}}`);
        continue;
      }
    }
    const sample = fixtureFor(checker, fixtures, fixturesSource, name, type);
    if (sample) {
      useFixtures();
      lines.push(`      ${name}={fixtures.${sample}}`);
      continue;
    }
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    if (/ReactElement|ReactNode/.test(typeName)) lines.push(`      ${name}={<div className="p-6">${label}</div>}`);
    else if (checker.isArrayType(type)) lines.push(`      ${name}={[]}`);
    else if (typeName === "string") lines.push(`      ${name}="Acme"`);
    else if (typeName === "number") lines.push(`      ${name}={0}`);
    else if (typeName === "boolean") lines.push(`      ${name}={false}`);
    else if (/^"[^"]*"( \|)?/.test(typeName)) lines.push(`      ${name}=${typeName.split(" | ")[0]}`);
    else {
      const literal = sampleLiteral(checker, type, viewSource);
      if (literal) lines.push(`      ${name}={${literal}}`);
      else unresolved.push(`${name}: ${typeName}`);
    }
  }

  needs.imports.set(component, { module: "view", name: component, namespace: false, typeOnly: false });
  const importLines: string[] = [];
  const reactNames = [...needs.imports.entries()].filter(([, i]) => i.module === "react").map(([local]) => local);
  if (reactNames.length) importLines.push(`import { ${reactNames.sort().join(", ")} } from "react";`);
  for (const module of ["lucide-react", "view", "schema", "fixtures"] as const) {
    const from = module === "lucide-react" ? module : `${importBase}/${module}`;
    const entries = [...needs.imports.entries()].filter(([, i]) => i.module === module);
    const namespace = entries.find(([, i]) => i.namespace);
    if (namespace) importLines.push(`import * as ${namespace[0]} from "${from}";`);
    const named = entries
      .filter(([, i]) => !i.namespace)
      .map(([local, i]) => `${i.typeOnly ? "type " : ""}${i.name === local ? local : `${i.name} as ${local}`}`)
      .sort((a, b) => a.replace(/^type /, "").localeCompare(b.replace(/^type /, "")));
    if (named.length) importLines.push(`import { ${named.join(", ")} } from "${from}";`);
  }

  const open = lines.length ? `    <${component}\n${lines.join("\n")}\n    ` : `    <${component} `;
  const jsx = children ? `${open}>\n${children}\n    </${component}>` : `${open}/>`;
  const moduleDecls = [...needs.moduleDecls.values()].map((d) => `${d}\n`).join("");
  const componentDecls = [...needs.componentDecls.values()].map((d) => `  ${d}\n`).join("");
  const usage = `"use client";\n\n${importLines.join("\n")}\n\n${moduleDecls ? `${moduleDecls}\n` : ""}export function ${component}Example() {\n${componentDecls}  return (\n${jsx}\n  );\n}\n`;
  return { usage, unresolved };
}

// ---------------------------------------------------------------------------

interface RegistryItem {
  dependencies?: string[];
  files: { path: string; target?: string }[];
  registryDependencies?: string[];
}

async function main() {
  const check = process.argv.includes("--check");
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;
  const screens = manifest.groups.flatMap((g) => g.kinds.flatMap((k) => k.screens));
  const folderOf = (s: ManifestScreen) => s.files[0].split("/")[0];

  const roots = screens.flatMap((s) =>
    ["view.tsx", "schema.ts", "fixtures.ts"].map((f) => path.join(SHOWCASE, folderOf(s), f)).filter((f) => existsSync(f)),
  );
  const program = createProgram(roots);
  const checker = program.getTypeChecker();

  const docs: Record<string, ScreenDoc> = {};
  const problems: string[] = [];
  const checkFiles: string[] = [];
  for (const screen of screens) {
    const folder = folderOf(screen);
    const source = (file: string) => program.getSourceFile(path.join(SHOWCASE, folder, file));
    const view = source("view.tsx") ?? fail(`${folder}/view.tsx is not in the program`);
    const schema = source("schema.ts") ?? fail(`${folder}/schema.ts is not in the program`);
    const fixtures = source("fixtures.ts");

    const component = componentName(folder);
    const propsType = componentProps(checker, view, component, screen.registry);
    const props = propsType ? propsOf(checker, propsType, view, destructuredDefaults(view)) : [];

    const api = await apiOf(folder);
    const registryPath = path.join(WWW, "public/r", `${screen.registry}.json`);
    const item = existsSync(registryPath)
      ? (JSON.parse(readFileSync(registryPath, "utf8")) as RegistryItem)
      : fail(`no registry item public/r/${screen.registry}.json (run \`bun run registry\` at the repo root)`);
    // Where the CLI writes the screen (the registry name and the folder can differ).
    const viewPath =
      item.files.map((f) => f.path).find((f) => f.endsWith("/view.tsx")) ??
      fail(`${screen.registry}: the registry item installs no view.tsx`);
    const installBase = `@/${viewPath.replace(/\/view\.tsx$/, "")}`;
    const { usage, unresolved } = usageOf(checker, view, fixtures, folder, component, propsType, api, installBase);
    if (unresolved.length) problems.push(`${screen.registry}: no fixture for required ${unresolved.join(", ")}`);

    docs[screen.registry] = {
      component,
      props,
      api,
      types: typesOf(checker, schema),
      messages: messagesOf(view),
      permissions: permissionsOf(view),
      usage,
      files: item.files.map((f) => f.path),
      npmDependencies: item.dependencies ?? [],
      registryDependencies: item.registryDependencies ?? [],
    };

    if (check) {
      const file = path.join(CHECK_DIR, `${screen.registry}.tsx`);
      checkFiles.push(file);
      mkdirSync(CHECK_DIR, { recursive: true });
      writeFileSync(file, usage.replaceAll(installBase, `@/pages/showcase/${folder}`));
    }
  }

  if (check) {
    try {
      const usageProgram = createProgram(checkFiles);
      for (const d of ts.getPreEmitDiagnostics(usageProgram)) {
        if (!d.file || !checkFiles.includes(path.normalize(d.file.fileName))) continue;
        problems.push(`usage example ${path.basename(d.file.fileName)}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
      }
    } finally {
      rmSync(CHECK_DIR, { recursive: true, force: true });
    }
  }

  writeFileSync(OUT, `${JSON.stringify(docs, null, 2)}\n`);
  if (problems.length) {
    console.error(`Screen docs problems (${problems.length}):\n  - ${problems.join("\n  - ")}`);
    process.exit(1);
  }
  console.log(`Screen docs: ${Object.keys(docs).length} screens${check ? ", every usage example typechecks" : ""}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

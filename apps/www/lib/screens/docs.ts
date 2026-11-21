// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Each screen's reference docs, generated from its code by
 * scripts/screen-docs.ts (props, backend contract, data types, copy,
 * dependencies and a typechecked usage example). Server-only: the file is large.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { cache } from "react";

import type { ComponentTocItem } from "@/lib/registry/types";

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
  alias?: string;
  description?: string;
  fields: DocProp[];
  name: string;
}

export interface ScreenDoc {
  api: DocOperation[];
  component: string;
  files: string[];
  messages: {
    namespace: string;
    entries: { key: string; value: string }[];
  } | null;
  npmDependencies: string[];
  permissions: { action: string; resource?: string }[];
  props: DocProp[];
  registryDependencies: string[];
  types: DocType[];
  usage: string;
}

const FILE = path.join(process.cwd(), "lib/screens/screen-docs.json");

const allDocs = cache((): Record<string, ScreenDoc> => {
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as Record<string, ScreenDoc>;
  } catch (error) {
    throw new Error(
      `Cannot read lib/screens/screen-docs.json; run \`bun run screens:docs\` (${String(error)}).`,
      { cause: error }
    );
  }
});

export const getScreenDoc = (registry: string): ScreenDoc => {
  const doc = allDocs()[registry];
  if (!doc) {
    throw new Error(
      `No reference docs for ${registry}; run \`bun run screens:docs\`.`
    );
  }
  return doc;
};

/** The reference sections a screen's page shows, in order, for its table of contents. */
export const screenReferenceToc = (
  doc: ScreenDoc,
  states: string[]
): ComponentTocItem[] => {
  const sections: [string, string, boolean][] = [
    ["installation", "Installation", true],
    ["usage", "Usage", true],
    ["props", "Props", doc.props.length > 0],
    ["backend-contract", "Backend contract", doc.api.length > 0],
    ["data-types", "Data types", doc.types.length > 0],
    ["states", "States", states.length > 0],
    ["copy", "Copy", doc.messages !== null],
    ["permissions", "Permissions", doc.permissions.length > 0],
    ["dependencies", "Dependencies", true],
    ["quality", "Quality", true],
  ];
  return sections
    .filter((section) => section[2])
    .map(([id, title]) => ({ depth: 2, url: `#${id}`, title }));
};

const cell = (text: string) =>
  text.replaceAll("|", "\\|").replaceAll("\n", " ");
const code = (text: string) => `\`${cell(text)}\``;

const propRow = (f: DocProp) =>
  `| ${code(f.name)} | ${code(f.type)} | ${f.required ? "yes" : "no"} | ${f.default ? code(f.default) : "-"} | ${cell(f.description ?? "")} |`;

const propTable = (fields: DocProp[]) => [
  "| Name | Type | Required | Default | Description |",
  "| --- | --- | --- | --- | --- |",
  ...fields.map(propRow),
];

/** One backend operation as a row of the contract table. */
const apiRow = (op: ScreenDoc["api"][number]) => {
  const request = [
    op.params && `params ${code(op.params)}`,
    op.query && `query ${code(op.query)}`,
    op.request && `body ${code(op.request)}`,
  ]
    .filter(Boolean)
    .join(", ");
  const name = `${code(op.name)}${op.description ? ` ${cell(op.description)}` : ""}`;
  const response = op.response ? code(op.response) : "204 No Content";
  const errors =
    op.errors.map((e) => `${e.status}: ${cell(e.description)}`).join("; ") ||
    "-";
  return `| ${name} | ${code(`${op.method} ${op.path}`)} | ${request || "-"} | ${response} | ${errors} |`;
};

/** The reference as Markdown, for the page's LLM text (/llms-screens.mdx/...). */
export const screenReferenceMarkdown = (
  doc: ScreenDoc,
  states: string[],
  installUrl: string
): string => {
  const out: string[] = [
    "## Installation",
    "",
    "```bash",
    `npx shadcn@latest add ${installUrl}`,
    "```",
    "",
    "## Usage",
    "",
    "```tsx",
    doc.usage.trimEnd(),
    "```",
    "",
  ];
  if (doc.props.length) {
    out.push("## Props", "", ...propTable(doc.props), "");
  }
  if (doc.api.length) {
    out.push(
      "## Backend contract",
      "",
      "| Operation | Endpoint | Request | Response | Errors |",
      "| --- | --- | --- | --- | --- |",
      ...doc.api.map(apiRow),
      ""
    );
  }
  if (doc.types.length) {
    out.push("## Data types", "");
    for (const type of doc.types) {
      out.push(`### ${type.name}`, "");
      if (type.description) {
        out.push(type.description, "");
      }
      out.push(
        ...(type.alias ? [code(type.alias)] : propTable(type.fields)),
        ""
      );
    }
  }
  if (states.length) {
    out.push("## States", "", states.map((s) => `- ${s}`).join("\n"), "");
  }
  if (doc.messages) {
    out.push(
      "## Copy",
      "",
      `Override with \`WirefrontProvider messages\`, keyed \`${doc.messages.namespace}.<key>\`.`,
      "",
      "| Key | Default |",
      "| --- | --- |"
    );
    for (const e of doc.messages.entries) {
      out.push(
        `| ${code(`${doc.messages.namespace}.${e.key}`)} | ${cell(e.value)} |`
      );
    }
    out.push("");
  }
  if (doc.permissions.length) {
    out.push(
      "## Permissions",
      "",
      ...doc.permissions.map(
        (p) =>
          `- \`can("${p.action}"${p.resource ? `, "${p.resource}"` : ""})\``
      ),
      ""
    );
  }
  out.push(
    "## Dependencies",
    "",
    `- npm packages: ${doc.npmDependencies.map(code).join(", ") || "-"}`,
    `- shadcn/ui components: ${doc.registryDependencies.map(code).join(", ") || "-"}`,
    `- Files: ${doc.files.map(code).join(", ")}`,
    ""
  );
  return out.join("\n");
};

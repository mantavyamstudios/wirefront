#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Licence headers for every source file.
 *
 *   npm run spdx          # add missing headers
 *   npm run spdx:check    # exit 1 if any file is missing one (used by tests)
 *
 * Headers travel with the code: the registry copies source files verbatim,
 * so every screen a builder installs carries its licence.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NOTICE_URL = "https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md";

const ROOTS = ["apps/www/src", "apps/www/scripts", "apps/www/vite.config.ts", "packages/ui/src", "scripts"];
const EXTENSIONS = /\.(ts|tsx|mjs|css)$/;
const IGNORED = /(^|\/)routeTree\.gen\.ts$/;

const WIREFRONT = "Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront";

/** Licence lines for a file, based on where its code came from. */
export function headerLines(path: string, source: string): string[] {
  const lines = ["SPDX-License-Identifier: AGPL-3.0-only"];
  const isCoss =
    (path.startsWith("packages/ui/src/components/ui/") && !path.endsWith("auth-split-layout.tsx")) ||
    path === "packages/ui/src/styles.css";
  if (isCoss) {
    lines.push(`coss ui © Cal.com, Inc. — https://coss.com/ui · see ${NOTICE_URL}`);
    return lines;
  }
  lines.push(WIREFRONT);
  if (source.includes("Ported from devl.dev")) {
    lines.push(`Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see ${NOTICE_URL}`);
  }
  return lines;
}

export function hasHeader(source: string): boolean {
  return source.split("\n", 6).some((line) => line.includes("SPDX-License-Identifier:"));
}

function comment(path: string, lines: string[]): string {
  if (path.endsWith(".css")) return `/*\n${lines.map((l) => ` * ${l}`).join("\n")}\n */\n`;
  return lines.map((l) => `// ${l}`).join("\n") + "\n";
}

export function withHeader(path: string, source: string): string {
  if (hasHeader(source)) return source;
  const block = comment(path, headerLines(path, source));
  // Keep a shebang on the first line.
  if (source.startsWith("#!")) {
    const nl = source.indexOf("\n");
    return source.slice(0, nl + 1) + block + source.slice(nl + 1);
  }
  return block + source;
}

export function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (abs: string) => {
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      for (const name of readdirSync(abs)) if (name !== "node_modules") walk(join(abs, name));
      return;
    }
    const rel = relative(ROOT, abs);
    if (EXTENSIONS.test(rel) && !IGNORED.test(rel)) out.push(rel);
  };
  for (const r of ROOTS) walk(resolve(ROOT, r));
  return out.sort();
}

export function missingHeaders(): string[] {
  return sourceFiles().filter((rel) => !hasHeader(readFileSync(resolve(ROOT, rel), "utf8")));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const missing = missingHeaders();
    if (missing.length) {
      console.error(`${missing.length} file(s) have no SPDX header. Run \`npm run spdx\`:\n  ${missing.join("\n  ")}`);
      process.exit(1);
    }
    console.log(`All ${sourceFiles().length} source files have an SPDX header.`);
  } else {
    let added = 0;
    for (const rel of sourceFiles()) {
      const abs = resolve(ROOT, rel);
      const src = readFileSync(abs, "utf8");
      const next = withHeader(rel, src);
      if (next !== src) {
        writeFileSync(abs, next);
        added++;
      }
    }
    console.log(`Added SPDX headers to ${added} file(s).`);
  }
}

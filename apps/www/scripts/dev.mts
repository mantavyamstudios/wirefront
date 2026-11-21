// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * `bun run dev` for the site: starts `next dev` and keeps the site in sync
 * with the catalogue while it runs. When a screen folder, the catalogue
 * (designs.ts, source-files.ts) or the groups (lib/screens/groups.ts) change,
 * it rebuilds what the site derives from them, in order:
 *
 *   registry items (public/r)  ->  screens manifest, sidebar, MDX stubs
 *   ->  screen docs  ->  docs registry
 *
 * Next.js then reloads the pages that read them. A step that fails is printed
 * with its output and the watcher keeps running, so fixing the file re-runs it.
 */
import { spawn, spawnSync } from "node:child_process";
import { watch } from "node:fs";
import path from "node:path";

const WWW = path.resolve(import.meta.dirname, "..");
const ROOT = path.resolve(WWW, "../..");
const RUNTIME_SRC = path.join(ROOT, "apps/runtime/src");
const WATCHED = [
  { dir: path.join(RUNTIME_SRC, "pages/showcase"), recursive: true },
  {
    dir: path.join(RUNTIME_SRC, "lib"),
    recursive: false,
    only: ["designs.ts"],
  },
  { dir: path.join(WWW, "lib/screens"), recursive: false, only: ["groups.ts"] },
];
const STEPS: { label: string; cwd: string; args: string[] }[] = [
  { label: "registry", cwd: ROOT, args: ["run", "--silent", "registry"] },
  {
    label: "screens manifest",
    cwd: WWW,
    args: ["./scripts/screens-manifest.mts"],
  },
  { label: "screen docs", cwd: WWW, args: ["../../scripts/screen-docs.ts"] },
  { label: "docs registry", cwd: WWW, args: ["./scripts/docs-registry.mts"] },
];
const DEBOUNCE_MS = 400;

const sync = (reason: string) => {
  const started = Date.now();
  console.log(`[screens] ${reason}: syncing the site`);
  for (const step of STEPS) {
    const result = spawnSync("bun", step.args, {
      cwd: step.cwd,
      encoding: "utf-8",
    });
    if (result.status !== 0) {
      console.error(
        `[screens] ${step.label} failed (exit ${result.status ?? result.signal}); the site keeps its last good copy until the next change:`
      );
      console.error((result.stdout ?? "") + (result.stderr ?? ""));
      return;
    }
  }
  console.log(
    `[screens] in sync (${((Date.now() - started) / 1000).toFixed(1)} s)`
  );
};

let timer: ReturnType<typeof setTimeout> | undefined;
let changed = new Set<string>();

/** Collects changed files and syncs once they stop changing for DEBOUNCE_MS. */
const queueSync = (file: string) => {
  changed.add(file);
  clearTimeout(timer);
  timer = setTimeout(() => {
    const files = [...changed];
    changed = new Set();
    sync(files.length === 1 ? files[0] : `${files.length} files changed`);
  }, DEBOUNCE_MS);
};

for (const { dir, recursive, only } of WATCHED) {
  watch(dir, { recursive }, (_event, file) => {
    if (!file || (only && !only.includes(path.basename(file)))) {
      return;
    }
    queueSync(path.relative(ROOT, path.join(dir, file)));
  });
}
console.log(
  "[screens] watching the catalogue; new and changed screens appear without a restart"
);

const next = spawn("next", ["dev", "-p", "3000"], {
  cwd: WWW,
  stdio: "inherit",
});
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => next.kill(signal));
}
next.on("exit", (code) => process.exit(code ?? 0));

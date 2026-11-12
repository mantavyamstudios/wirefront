#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Install test: install every Wirefront registry item into fresh shadcn
 * projects, the way a builder would, then typecheck and build them.
 *
 *   npm run test:install                        # next, vite and start
 *   npm run test:install -- --templates=next    # a subset
 *   npm run test:install -- --fresh             # re-scaffold the projects
 *   npm run test:install -- --items=tables-invoices,charts-donut   # a sample
 *
 * Every command runs with stdin closed, so a prompt fails immediately
 * instead of waiting, and has a step limit (STEP_LIMIT_MS) after which it is
 * stopped and the run fails naming the step: a stuck tool is a failure, not
 * something to wait out.
 *
 * Projects are scaffolded once with `shadcn init -t <template> -b base -p nova`
 * into .install-test/<template> (gitignored) and committed to a throwaway git
 * repo there, so each run starts from the pristine scaffold. The registry is
 * rebuilt and served from a local HTTP server.
 *
 * A template fails when `shadcn add` fails, when installing changes any file
 * the scaffold already had outside components/ui (Wirefront must never
 * overwrite a builder's own files), or when the project doesn't typecheck or
 * build. The build includes a generated module that imports every installed
 * Wirefront file, so client/server boundaries are checked too.
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_DIR = resolve(ROOT, "apps/www/public/r");
const WORK = resolve(ROOT, ".install-test");
const SHADCN = "shadcn@4.23.0";
const TEMPLATES = ["next", "vite", "start"] as const;
type Template = (typeof TEMPLATES)[number];

const args = process.argv.slice(2);
const fresh = args.includes("--fresh");
const only = args.find((a) => a.startsWith("--templates="))?.split("=")[1]?.split(",");
const templates = TEMPLATES.filter((t) => !only || only.includes(t));
const onlyItems = args.find((a) => a.startsWith("--items="))?.split("=")[1]?.split(",");
const STEP_LIMIT_MS = 15 * 60_000;

// Commands run asynchronously: the registry is served from this process,
// and a blocking spawn would stall that server so `shadcn add` never gets
// a response.
function run(cmd: string, argv: string[], cwd: string, label: string): Promise<void> {
  return new Promise((ok, fail) => {
    const child = spawn(cmd, argv, { cwd, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, CI: "1" } });
    let out = "";
    const collect = (d: Buffer) => {
      out = (out + d.toString()).slice(-200_000);
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);
    const tail = () => out.trim().split("\n").slice(-40).join("\n");
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      fail(new Error(`${label} was still running after ${STEP_LIMIT_MS / 60_000} minutes and was stopped:\n${tail()}`));
    }, STEP_LIMIT_MS);
    child.on("error", (err) => {
      clearTimeout(timer);
      fail(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) ok();
      else fail(new Error(`${label} failed (exit ${code}):\n${tail()}`));
    });
  });
}

function git(cwd: string, ...argv: string[]): string {
  return execFileSync("git", argv, { cwd, encoding: "utf8" });
}

async function scaffold(t: Template): Promise<string> {
  const dir = join(WORK, t);
  if (fresh) rmSync(dir, { recursive: true, force: true });
  if (!existsSync(join(dir, ".git"))) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(WORK, { recursive: true });
    console.log(`[install] ${t}: scaffolding with shadcn init (first run only)…`);
    await run("npx", ["-y", SHADCN, "init", "-t", t, "-b", "base", "-p", "nova", "-n", t, "--no-monorepo", "-y", "-c", WORK], WORK, `${t}: shadcn init`);
    git(dir, "init", "-q");
    writeFileSync(join(dir, ".git", "info", "exclude"), "node_modules\n");
    git(dir, "add", "-A");
    git(dir, "-c", "user.name=install-test", "-c", "user.email=install-test@localhost", "commit", "-q", "--allow-empty", "-m", "scaffold");
  }
  // Back to the pristine scaffold (dependencies added by earlier runs stay installed; harmless).
  git(dir, "checkout", "-q", "--", ".");
  git(dir, "clean", "-qfd", "-e", "node_modules");
  return dir;
}

function serveRegistry(): Promise<{ url: string; close: () => void }> {
  return new Promise((ok) => {
    const server = createServer((req, res) => {
      const file = join(REGISTRY_DIR, (req.url ?? "/").split("?")[0]?.replace(/^\/+/, "") ?? "");
      if (!file.startsWith(REGISTRY_DIR) || !existsSync(file)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "content-type": "application/json" }).end(readFileSync(file));
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      ok({ url: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
  });
}

/** Where the template keeps its sources (src/ or the root). */
function srcRoot(dir: string): string {
  return existsSync(join(dir, "src", "components")) ? join(dir, "src") : dir;
}

function listFiles(dir: string, base = dir): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? listFiles(p, base) : [p.slice(base.length + 1)];
  });
}

/** Write a module importing every installed Wirefront file and import it from the app entry. */
function wireImportCheck(t: Template, dir: string): void {
  const src = srcRoot(dir);
  const files = [
    ...listFiles(join(src, "components", "wirefront")).map((f) => `@/components/wirefront/${f}`),
    ...listFiles(join(src, "hooks", "wirefront")).map((f) => `@/hooks/wirefront/${f}`),
  ]
    .filter((f) => /\.tsx?$/.test(f))
    .map((f) => f.replace(/\.tsx?$/, ""))
    .sort();
  const body =
    files.map((f, i) => `import * as m${i} from "${f}";`).join("\n") +
    `\n\n// Generated by scripts/install-test.ts: pulls every installed Wirefront module into the build.\nexport const wirefrontModules = [${files.map((_, i) => `m${i}`).join(", ")}];\n`;
  if (t === "next") {
    mkdirSync(join(src, "app", "wirefront-check"), { recursive: true });
    writeFileSync(join(src, "app", "wirefront-check", "modules.ts"), body);
    writeFileSync(
      join(src, "app", "wirefront-check", "page.tsx"),
      `import { wirefrontModules } from "./modules";\n\nexport default function Page() {\n  return <p>{wirefrontModules.length} Wirefront modules</p>;\n}\n`,
    );
    return;
  }
  writeFileSync(join(src, "wirefront-check.ts"), body);
  const entry = [join(src, "main.tsx"), join(src, "router.tsx"), join(src, "routes", "__root.tsx")].find(existsSync);
  if (!entry) throw new Error(`${t}: no entry file found to import the check module from`);
  const rel = `./${join(src, "wirefront-check").slice(dirname(entry).length + 1).replace(/\\/g, "/")}`;
  writeFileSync(entry, `import { wirefrontModules } from "${rel}";\nvoid wirefrontModules;\n${readFileSync(entry, "utf8")}`);
}

async function main(): Promise<void> {
  console.log("[install] building the registry…");
  await run("npx", ["tsx", "scripts/build-registry.ts"], ROOT, "build-registry");
  const items = readdirSync(REGISTRY_DIR)
    .filter((f) => f.endsWith(".json") && f !== "registry.json")
    .filter((f) => !onlyItems || onlyItems.includes(f.replace(/\.json$/, "")));
  const server = await serveRegistry();
  const failures: string[] = [];

  try {
    for (const t of templates) {
      const started = Date.now();
      try {
        const dir = await scaffold(t);
        const before = new Map(
          git(dir, "ls-files")
            .split("\n")
            .filter(Boolean)
            .map((f) => [f, readFileSync(join(dir, f), "utf8")]),
        );
        console.log(`[install] ${t}: adding ${items.length} items…`);
        await run("npx", ["-y", SHADCN, "add", ...items.map((i) => `${server.url}/${i}`), "-y", "-c", dir], dir, `${t}: shadcn add`);

        const overwritten = [...before]
          .filter(([f, content]) => !/(^|\/)components\/ui\//.test(f) && existsSync(join(dir, f)) && readFileSync(join(dir, f), "utf8") !== content)
          .map(([f]) => f)
          .filter((f) => !/^(package(-lock)?\.json|pnpm-lock\.yaml|bun\.lockb?|yarn\.lock)$/.test(f) && !/\.css$/.test(f));
        if (overwritten.length) throw new Error(`${t}: installing changed the builder's own files: ${overwritten.join(", ")}`);

        wireImportCheck(t, dir);
        console.log(`[install] ${t}: typecheck…`);
        await run("npx", ["tsc", "--noEmit", "-p", existsSync(join(dir, "tsconfig.app.json")) ? "tsconfig.app.json" : "tsconfig.json"], dir, `${t}: typecheck`);
        console.log(`[install] ${t}: build…`);
        await run("npm", ["run", "build"], dir, `${t}: build`);
        console.log(`[install] ${t} ✓ (${Math.round((Date.now() - started) / 1000)}s)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        failures.push(msg);
        console.log(`[install] ${t} ✗\n${msg}`);
      }
    }
  } finally {
    server.close();
  }

  if (failures.length) {
    console.error(`[install] ${failures.length}/${templates.length} template(s) failed.`);
    process.exit(1);
  }
  console.log(`[install] all ${templates.length} template(s) install, typecheck and build with ${items.length} items.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

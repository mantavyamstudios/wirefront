// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * Copies the preview runtime's static build (apps/runtime/.output/public:
 * /preview/<kind>/<screen>, /demo and their /assets) into this site's `out/`,
 * so one static deployment serves both and the iframe stays same-origin.
 *
 * Runs after `next build`. Turbo builds @wirefront/runtime first.
 * Fails on any path both builds produce, instead of letting one overwrite the other.
 */
import { cpSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const WWW = path.resolve(import.meta.dirname, "..");
const RUNTIME_OUT = path.resolve(WWW, "../runtime/.output/public");
const SITE_OUT = path.join(WWW, "out");
/** The site has its own 404 page and favicon (see public/_redirects). */
const SKIP = new Set(["404.html", "favicon.ico"]);

if (!existsSync(RUNTIME_OUT)) {
  console.error(`copy-runtime: ${RUNTIME_OUT} is missing. Build the runtime first (bun run build at the repo root).`);
  process.exit(1);
}
if (!existsSync(SITE_OUT)) {
  console.error("copy-runtime: out/ is missing. Run next build first.");
  process.exit(1);
}

/** Every file under `dir`, relative to it. */
function files(dir: string, prefix = ""): string[] {
  return readdirSync(dir).flatMap((name) => {
    const rel = prefix ? `${prefix}/${name}` : name;
    return statSync(path.join(dir, name)).isDirectory() ? files(path.join(dir, name), rel) : [rel];
  });
}

const toCopy = files(RUNTIME_OUT).filter((rel) => !SKIP.has(rel));
const collisions = toCopy.filter((rel) => existsSync(path.join(SITE_OUT, rel)));
if (collisions.length > 0) {
  console.error(`copy-runtime: ${collisions.length} path(s) exist in both builds:\n  ${collisions.slice(0, 20).join("\n  ")}`);
  process.exit(1);
}
for (const rel of toCopy) {
  cpSync(path.join(RUNTIME_OUT, rel), path.join(SITE_OUT, rel));
}
console.log(`copy-runtime: copied ${toCopy.length} runtime file(s) into out/ (skipped ${[...SKIP].join(", ")}).`);

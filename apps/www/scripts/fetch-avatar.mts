/**
 * Pulls the site icon from the studio's GitHub avatar, so every build uses the
 * current profile picture. GitHub resizes it (`?s=`) and serves JPEG or PNG;
 * PNGs are converted so the icons stay `avatar-<size>.jpg`.
 *
 * Runs before `next build`. If GitHub can't be reached, the copies already in
 * `public/brand/` are kept and the build carries on.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const AVATAR_URL = "https://avatars.githubusercontent.com/u/332807507";
const SIZES = [32, 128, 180, 192, 512] as const;
const OUT_DIR = path.join(import.meta.dirname, "../public/brand");

async function fetchSize(size: number) {
  const response = await fetch(`${AVATAR_URL}?s=${size}`, {
    headers: { "User-Agent": "site-build/0.1" },
    signal: AbortSignal.timeout(15_000),
  });
  const type = response.headers.get("content-type") ?? "";
  if (!(response.ok && /^image\/(jpeg|png)/.test(type))) {
    throw new Error(`HTTP ${response.status} (${type || "no type"})`);
  }
  const body = Buffer.from(await response.arrayBuffer());
  return type.startsWith("image/png")
    ? sharp(body).flatten({ background: "#ffffff" }).jpeg({ quality: 90 }).toBuffer()
    : body;
}

try {
  const images = await Promise.all(SIZES.map(fetchSize));
  await mkdir(OUT_DIR, { recursive: true });
  await Promise.all(
    images.map((image, i) =>
      writeFile(path.join(OUT_DIR, `avatar-${SIZES[i]}.jpg`), image)
    )
  );
  console.log(`avatar: updated ${SIZES.length} sizes from GitHub`);
} catch (error) {
  console.warn(
    `avatar: kept the existing icons (GitHub unreachable: ${String(error)})`
  );
}

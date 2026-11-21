import { createSearchAPI } from "fumadocs-core/search/server";

import { getCachedSearchIndexes } from "@/lib/docs/search-index";

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

/**
 * The exported search index, written to a static file at build time; the
 * ⌘K palette downloads it once and searches in the browser (static export).
 */
export async function GET() {
  const indexes = await getCachedSearchIndexes();
  const api = createSearchAPI("advanced", {
    // https://docs.orama.com/open-source/supported-languages
    language: "english",
    indexes,
  });
  return await api.staticGET();
}

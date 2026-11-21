import type { MetadataRoute } from "next";

import { source } from "@/lib/docs/source";
import { screensSource } from "@/lib/screens/source";
import { SITE_URL } from "@/lib/site";

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

/** Keep in sync with `LAST_UPDATED` in legal policy articles. */
const LEGAL_LAST_UPDATED = new Date("2026-11-20");

const toLastModified = (value: Date | string | number | undefined) =>
  value ? new Date(value) : undefined;

const latest = (
  pages: readonly { data: { lastModified?: Date | string | number } }[]
) => {
  let newest: Date | undefined;
  for (const page of pages) {
    const date = toLastModified(page.data.lastModified);
    if (date && (!newest || date > newest)) {
      newest = date;
    }
  }
  return newest;
};

const buildSitemap = async (): Promise<MetadataRoute.Sitemap> => {
  const docPages = source.getPages();
  const screenPages = screensSource.getPages();
  const latestScreen = latest(screenPages);
  const [latestContent] = [latest(docPages), latestScreen]
    .filter((date): date is Date => Boolean(date))
    .toSorted((a, b) => b.getTime() - a.getTime());

  return await Promise.resolve([
    {
      url: SITE_URL,
      lastModified: latestContent,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/screens`,
      lastModified: latestScreen,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    ...screenPages.map((page) => ({
      url: `${SITE_URL}${page.url}`,
      lastModified: toLastModified(page.data.lastModified),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...docPages.map((page) => ({
      url: `${SITE_URL}${page.url}`,
      lastModified: toLastModified(page.data.lastModified),
      changeFrequency: "monthly" as const,
      priority: page.url === "/docs" ? 0.8 : 0.6,
    })),
    {
      url: `${SITE_URL}/pricing`,
      lastModified: latestContent,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...["/legal/privacy", "/legal/terms"].map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: LEGAL_LAST_UPDATED,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ]);
};

const sitemap = async (): Promise<MetadataRoute.Sitemap> =>
  await buildSitemap();

export default sitemap;

import type { MetadataRoute } from "next";

import { source } from "@/lib/docs/source";
import { flowsSource } from "@/lib/flows/source";
import { SITE_URL } from "@/lib/site";

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

/** Keep in sync with `LAST_UPDATED` in legal policy articles. */
const LEGAL_LAST_UPDATED = new Date("2026-11-20");

function toLastModified(value: Date | string | number | undefined) {
  return value ? new Date(value) : undefined;
}

function latest(
  pages: readonly { data: { lastModified?: Date | string | number } }[]
) {
  let newest: Date | undefined;
  for (const page of pages) {
    const date = toLastModified(page.data.lastModified);
    if (date && (!newest || date > newest)) {
      newest = date;
    }
  }
  return newest;
}

async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const docPages = source.getPages();
  const flowPages = flowsSource.getPages();
  const latestFlow = latest(flowPages);
  const latestContent = [latest(docPages), latestFlow]
    .filter((date): date is Date => Boolean(date))
    .toSorted((a, b) => b.getTime() - a.getTime())[0];

  return await Promise.resolve([
    {
      url: SITE_URL,
      lastModified: latestContent,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/flows`,
      lastModified: latestFlow,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    ...flowPages.map((page) => ({
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
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return await buildSitemap();
}

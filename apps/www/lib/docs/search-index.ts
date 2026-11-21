import type { OramaDocument } from "fumadocs-core/search/orama-cloud";
import type { AdvancedIndex } from "fumadocs-core/search/server";
import type { InferPageType } from "fumadocs-core/source";

import { source } from "@/lib/docs/source";
import { flowsSource } from "@/lib/flows/source";

type SearchablePage =
  | InferPageType<typeof source>
  | InferPageType<typeof flowsSource>;

function getSearchTag(page: SearchablePage): string {
  return page.url.startsWith("/flows/") ? "flows" : "docs";
}

function pageToAdvancedIndex(page: SearchablePage): AdvancedIndex {
  if (!("structuredData" in page.data)) {
    throw new Error(
      `Cannot index page ${page.url}: structuredData is missing.`
    );
  }

  const { structuredData } = page.data;
  const title = page.data.title ?? page.slugs.at(-1) ?? page.url;

  return {
    title,
    description: "description" in page.data ? page.data.description : undefined,
    url: page.url,
    id: page.url,
    structuredData,
    tag: getSearchTag(page),
  };
}

export function getSearchablePages(): SearchablePage[] {
  return [...source.getPages(), ...flowsSource.getPages()];
}

export function getSearchIndexes(): AdvancedIndex[] {
  return getSearchablePages().map(pageToAdvancedIndex);
}

export function getStaticPageDocuments(): Omit<OramaDocument, "structured">[] {
  return getSearchablePages().map((page) => ({
    id: page.url,
    tag: getSearchTag(page),
    url: page.url,
    title: page.data.title,
    description: page.data.description,
  }));
}

export async function getCachedSearchIndexes() {
  return await Promise.resolve(getSearchIndexes());
}

export async function getCachedStaticPageDocuments() {
  return await Promise.resolve(getStaticPageDocuments());
}

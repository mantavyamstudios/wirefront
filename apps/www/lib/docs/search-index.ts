import type { OramaDocument } from "fumadocs-core/search/orama-cloud";
import type { AdvancedIndex } from "fumadocs-core/search/server";
import type { InferPageType } from "fumadocs-core/source";

import { source } from "@/lib/docs/source";
import { screensSource } from "@/lib/screens/source";

type SearchablePage =
  | InferPageType<typeof source>
  | InferPageType<typeof screensSource>;

const getSearchTag = (page: SearchablePage): string =>
  page.url === "/docs" || page.url.startsWith("/docs/") ? "docs" : "screens";

const pageToAdvancedIndex = (page: SearchablePage): AdvancedIndex => {
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
};

export const getSearchablePages = (): SearchablePage[] => [
  ...source.getPages(),
  ...screensSource.getPages(),
];

export const getSearchIndexes = (): AdvancedIndex[] =>
  getSearchablePages().map(pageToAdvancedIndex);

export const getStaticPageDocuments = (): Omit<OramaDocument, "structured">[] =>
  getSearchablePages().map((page) => ({
    id: page.url,
    tag: getSearchTag(page),
    url: page.url,
    title: page.data.title,
    description: page.data.description,
  }));

export const getCachedSearchIndexes = async () =>
  await Promise.resolve(getSearchIndexes());

export const getCachedStaticPageDocuments = async () =>
  await Promise.resolve(getStaticPageDocuments());

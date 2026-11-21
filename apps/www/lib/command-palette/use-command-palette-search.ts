"use client";

import { useDocsSearch } from "fumadocs-core/search/client";

const SEARCH_DELAY_MS = 150;

export const useCommandPaletteSearch = () =>
  // Static export: download the prebuilt index once, search locally.
  useDocsSearch({
    type: "static",
    from: "/api/search",
    delayMs: SEARCH_DELAY_MS,
  });

export const getSearchResults = (
  data:
    | {
        content: string;
        id: string;
        type: "heading" | "page" | "text";
        url: string;
      }[]
    | "empty"
    | undefined
): {
  content: string;
  id: string;
  type: "heading" | "page" | "text";
  url: string;
}[] => {
  if (!data || data === "empty") {
    return [];
  }

  return data;
};

export const matchesCommandQuery = (
  searchValue: string,
  query: string
): boolean => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return searchValue.toLowerCase().includes(normalized);
};

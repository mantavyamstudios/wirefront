import { cache } from "react";

import { baseOptions } from "@/app/layout.config";
import { source } from "@/lib/docs/source";
import { getScreenGalleryItems, getScreenGroups } from "@/lib/screens/data";

import type { CommandPaletteGroup, CommandPaletteItem } from "./types";

const docHint = (url: string): string => {
  if (url === "/docs") {
    return "Docs";
  }

  const segment = url.split("/").findLast(Boolean) ?? "";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const item = (
  partial: Omit<CommandPaletteItem, "searchValue"> & { path?: string }
): CommandPaletteItem => {
  const hint = partial.hint ?? "";
  const pathPrefix = partial.path ? `~ ${partial.path} ` : "";
  const keywords = partial.keywords?.join(" ") ?? "";

  return {
    ...partial,
    searchValue: `${pathPrefix}${partial.label} ${hint} ${keywords}`.trim(),
  };
};

const GUIDE_DOC_URLS = new Set(
  (baseOptions.links ?? [])
    .filter(
      (link): link is { text: string; url: string } =>
        typeof link === "object" &&
        link !== null &&
        "url" in link &&
        typeof link.url === "string" &&
        link.url.startsWith("/docs")
    )
    .map((link) => link.url)
);

const getDocumentationItems = (): CommandPaletteItem[] =>
  source
    .getPages()
    .filter((page) => page.url === "/docs" || GUIDE_DOC_URLS.has(page.url))
    .map((page) =>
      item({
        id: `doc-${page.url}`,
        label: page.data.title,
        hint: docHint(page.url),
        href: page.url,
        icon: "book",
        path: page.url,
        keywords: page.data.description ? [page.data.description] : undefined,
      })
    );

const getScreenItems = (): CommandPaletteItem[] =>
  getScreenGalleryItems().map((entry) =>
    item({
      id: `screen-${entry.slug}`,
      label: entry.title,
      hint: entry.collection,
      href: entry.href,
      icon: "box",
      path: entry.href,
      keywords: entry.description ? [entry.description] : undefined,
    })
  );

export const getCommandPaletteGroups = cache((): CommandPaletteGroup[] => {
  const navigation: CommandPaletteItem[] = [
    item({
      id: "page-home",
      label: "Home",
      href: "/",
      icon: "arrow",
      path: "/",
    }),
    item({
      id: "page-screens",
      label: "Screens",
      href: "/screens",
      icon: "box",
      path: "/screens",
    }),
    ...getScreenGroups().map((group) =>
      item({
        id: `page-group-${group.slug}`,
        label: group.title,
        hint: group.meaning,
        href: `/${group.slug}`,
        icon: "box",
        path: `/${group.slug}`,
      })
    ),
    item({
      id: "page-docs",
      label: "Documentation",
      href: "/docs",
      icon: "book",
      path: "/docs",
    }),
    item({
      id: "page-pricing",
      label: "Pricing",
      href: "/pricing",
      icon: "arrow",
      path: "/pricing",
    }),
  ];

  const groups: CommandPaletteGroup[] = [
    { id: "navigation", label: "Navigation", items: navigation },
  ];

  const documentation = getDocumentationItems();
  if (documentation.length > 0) {
    groups.push({
      id: "documentation",
      label: "Documentation",
      items: documentation,
    });
  }

  const screens = getScreenItems();
  if (screens.length > 0) {
    groups.push({ id: "screens", label: "Screens", items: screens });
  }

  return groups;
});

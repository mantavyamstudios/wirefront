// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Adapted from the Enterprise UI Playground's lib/flows/data.ts (MIT).
import { existsSync } from "node:fs";
import path from "node:path";

import { cache } from "react";

import type { NeighborNavItem } from "@/components/docs/neighbor-nav-buttons";
import type { ComponentGallerySection } from "@/lib/registry/component-gallery-sections";
import type {
  ComponentGalleryItem,
  ComponentPageHeaderData,
  ComponentTocItem,
} from "@/lib/registry/types";

import { getScreenDoc, screenReferenceToc } from "./docs";
import manifestJson from "./screens.manifest.json";
import { screensSource } from "./source";
import type { ScreenDocPage } from "./source";

export interface ManifestScreen {
  blurb: string;
  files: string[];
  readiness: "ready" | "preview";
  registry: string;
  slug: string;
  states: string[];
  status: "new" | "wip" | null;
  title: string;
}

export interface ManifestKind {
  blurb: string;
  screens: ManifestScreen[];
  slug: string;
  title: string;
}

export interface ManifestGroup {
  kinds: ManifestKind[];
  meaning: string;
  slug: string;
  title: string;
}

interface ScreensManifest {
  groups: ManifestGroup[];
  totals: { groups: number; kinds: number; screens: number };
}

const manifest = manifestJson as ScreensManifest;

/** Everything the persistent screens layout needs for one screen. */
export interface ScreenDetail {
  files: string[];
  githubPath: string;
  groupSlug: string;
  groupTitle: string;
  header: ComponentPageHeaderData;
  href: string;
  kindSlug: string;
  kindTitle: string;
  next?: NeighborNavItem;
  previous?: NeighborNavItem;
  readiness: ManifestScreen["readiness"];
  registry: string;
  screenSlug: string;
  states: string[];
  status: ManifestScreen["status"];
  toc: ComponentTocItem[];
}

export const screenHref = (group: string, kind: string, screen: string) =>
  `/${group}/${kind}/${screen}`;

/** The light preview captured by `bun run snapshot` (public/previews), when there is one. */
const cardPreviewFor = (
  kind: string,
  screen: string
): ComponentGalleryItem["cardPreview"] => {
  const poster = `/previews/${kind}__${screen}--light.png`;
  if (!existsSync(path.join(process.cwd(), "public", poster))) {
    return undefined;
  }
  return { poster };
};

const pageFor = (
  group: string,
  kind: string,
  screen: string
): ScreenDocPage => {
  const page = screensSource.getPage([group, kind, screen]);
  if (!page) {
    throw new Error(
      `Missing content/screens/${group}/${kind}/${screen}.mdx — run \`bun run screens:manifest\`.`
    );
  }
  return page;
};

/** Depth-2 headings, titled from fumadocs' plain-text `structuredData`. */
const tocFor = (page: ScreenDocPage): ComponentTocItem[] => {
  const structured = page.data.structuredData as
    | { headings?: { content: string; id: string }[] }
    | undefined;
  const headings = new Map(
    (structured?.headings ?? []).map((heading) => [
      `#${heading.id}`,
      heading.content,
    ])
  );
  return (page.data.toc ?? [])
    .filter((item) => item.depth === 2)
    .map((item) => ({
      depth: item.depth,
      url: item.url,
      title:
        headings.get(item.url) ??
        (typeof item.title === "string" ? item.title : item.url.slice(1)),
    }));
};

export const getScreenGroups = (): ManifestGroup[] => manifest.groups;

export const getScreenTotals = () => manifest.totals;

export const getScreenGroup = (group: string): ManifestGroup | undefined =>
  manifest.groups.find((g) => g.slug === group);

export const getScreenKind = (
  group: string,
  kind: string
): ManifestKind | undefined =>
  getScreenGroup(group)?.kinds.find((k) => k.slug === kind);

/** One gallery section per kind, in group order (optionally one group's kinds only). */
export const getScreenGallerySections = cache(
  (group?: string): ComponentGallerySection[] =>
    manifest.groups
      .filter((g) => !group || g.slug === group)
      .flatMap((g) =>
        g.kinds.map((k) => ({
          id: k.slug,
          title: k.title,
          description: k.blurb,
        }))
      )
);

export const getScreenGalleryItems = cache((): ComponentGalleryItem[] =>
  manifest.groups.flatMap((g) =>
    g.kinds.flatMap((k) =>
      k.screens.map((s) => ({
        slug: `${k.slug}/${s.slug}`,
        title: s.title,
        description: s.blurb,
        href: screenHref(g.slug, k.slug, s.slug),
        collection: k.title,
        category: k.slug,
        cardPreview: cardPreviewFor(k.slug, s.slug),
      }))
    )
  )
);

export const getScreenDetails = cache((): ScreenDetail[] => {
  const ordered = manifest.groups.flatMap((g) =>
    g.kinds.flatMap((k) => k.screens.map((s) => ({ g, k, s })))
  );
  const nav = (index: number): NeighborNavItem | undefined => {
    const item = ordered[index];
    return item
      ? {
          name: item.s.title,
          url: screenHref(item.g.slug, item.k.slug, item.s.slug),
        }
      : undefined;
  };

  return ordered.map(({ g, k, s }, index) => {
    const page = pageFor(g.slug, k.slug, s.slug);
    const href = screenHref(g.slug, k.slug, s.slug);
    return {
      href,
      groupSlug: g.slug,
      groupTitle: g.title,
      kindSlug: k.slug,
      kindTitle: k.title,
      screenSlug: s.slug,
      header: {
        title: s.title,
        description: page.data.description ?? s.blurb,
        collection: k.title,
        componentUrl: href,
        docsUrl: page.url,
      },
      githubPath: `apps/www/content/screens/${g.slug}/${k.slug}/${s.slug}.mdx`,
      toc: [
        ...tocFor(page),
        ...screenReferenceToc(getScreenDoc(s.registry), s.states),
      ],
      previous: nav(index - 1),
      next: nav(index + 1),
      files: s.files,
      readiness: s.readiness,
      registry: s.registry,
      states: s.states,
      status: s.status,
    };
  });
});

export const getScreenPage = (
  group: string,
  kind: string,
  screen: string
): ScreenDocPage | undefined => screensSource.getPage([group, kind, screen]);

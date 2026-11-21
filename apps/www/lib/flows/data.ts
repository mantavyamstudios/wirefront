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

import flowCardsJson from "./flow-cards.json";
import manifestJson from "./flows.manifest.json";
import { flowsSource } from "./source";
import type { FlowDocPage } from "./source";

export interface FlowsManifestSubflow {
  deviceApis: string[];
  dir: string;
  entry: string;
  entryFile: string;
  files: number;
  localDeps: string[];
  packages: string[];
  slug: string;
  status: string;
  title: string;
}

export interface FlowsManifestCategory {
  blurb: string;
  slug: string;
  subflows: FlowsManifestSubflow[];
  title: string;
}

interface FlowsManifest {
  categories: FlowsManifestCategory[];
  totals: { categories: number; subflows: number };
}

const manifest = manifestJson as FlowsManifest;

/** Everything the persistent `/flows` detail layout needs for one subflow. */
export interface FlowDetail {
  categorySlug: string;
  deviceApis: string[];
  dir: string;
  entry: string;
  files: number;
  githubPath: string;
  header: ComponentPageHeaderData;
  href: string;
  next?: NeighborNavItem;
  packages: string[];
  previous?: NeighborNavItem;
  subflowSlug: string;
  toc: ComponentTocItem[];
}

const TODO_PREFIX = /^TODO\(copy\):\s*/;

/** Placeholder copy keeps its `TODO(copy)` marker in source but not on screen. */
function displayCopy(text: string): string {
  const clean = text.replace(TODO_PREFIX, "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

interface FlowCardEntry {
  screens: 1 | 2;
  tap?: { label: string; x: number; y: number };
}

const flowCards = flowCardsJson as Record<string, FlowCardEntry>;

/**
 * Gallery card media from `bun run posters` (apps/runtime): the 16:9 poster
 * plus the two-screen flow card, when captured.
 */
function cardPreviewFor(
  categorySlug: string,
  subflowSlug: string
): ComponentGalleryItem["cardPreview"] {
  const base = `/flows/posters/${categorySlug}/${subflowSlug}`;
  const poster = `${base}.webp`;
  if (!existsSync(path.join(process.cwd(), "public", poster))) {
    return undefined;
  }
  const card = flowCards[`${categorySlug}/${subflowSlug}`];
  if (!card) {
    return { poster };
  }
  return {
    poster,
    flow: {
      screens:
        card.screens === 2
          ? [`${base}.1.webp`, `${base}.2.webp`]
          : [`${base}.1.webp`],
      tap: card.tap ? { x: card.tap.x, y: card.tap.y } : undefined,
    },
  };
}

function pageFor(categorySlug: string, subflowSlug: string): FlowDocPage {
  const page = flowsSource.getPage([categorySlug, subflowSlug]);
  if (!page) {
    throw new Error(
      `Missing content/flows/${categorySlug}/${subflowSlug}.mdx — run \`bun run flows:manifest\`.`
    );
  }
  return page;
}

/** Depth-2 headings, titled from fumadocs' plain-text `structuredData`. */
function tocFor(page: FlowDocPage): ComponentTocItem[] {
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
}

export const getFlowCategories = (): FlowsManifestCategory[] =>
  manifest.categories;

export const getFlowGallerySections = cache((): ComponentGallerySection[] =>
  manifest.categories.map((category) => ({
    id: category.slug,
    title: category.title,
    description: displayCopy(category.blurb),
  }))
);

export const getFlowGalleryItems = cache((): ComponentGalleryItem[] =>
  manifest.categories.flatMap((category) =>
    category.subflows.map((sub) => {
      const page = pageFor(category.slug, sub.slug);
      return {
        slug: `${category.slug}/${sub.slug}`,
        title: sub.title,
        description: displayCopy(page.data.description ?? ""),
        href: `/flows/${category.slug}/${sub.slug}`,
        collection: category.title,
        category: category.slug,
        cardPreview: cardPreviewFor(category.slug, sub.slug),
      };
    })
  )
);

export const getFlowDetails = cache((): FlowDetail[] => {
  const ordered = manifest.categories.flatMap((category) =>
    category.subflows.map((sub) => ({ category, sub }))
  );
  const nav = (index: number): NeighborNavItem | undefined => {
    const item = ordered[index];
    return item
      ? {
          name: item.sub.title,
          url: `/flows/${item.category.slug}/${item.sub.slug}`,
        }
      : undefined;
  };

  return ordered.map(({ category, sub }, index) => {
    const page = pageFor(category.slug, sub.slug);
    const href = `/flows/${category.slug}/${sub.slug}`;
    return {
      href,
      categorySlug: category.slug,
      subflowSlug: sub.slug,
      header: {
        title: sub.title,
        description: displayCopy(page.data.description ?? ""),
        collection: category.title,
        componentUrl: href,
        docsUrl: page.url,
      },
      githubPath: `content/flows/${category.slug}/${sub.slug}.mdx`,
      toc: tocFor(page),
      previous: nav(index - 1),
      next: nav(index + 1),
      entry: sub.entry,
      dir: sub.dir,
      files: sub.files,
      packages: sub.packages,
      deviceApis: sub.deviceApis,
    };
  });
});

export function getFlowPage(
  categorySlug: string,
  subflowSlug: string
): FlowDocPage | undefined {
  return flowsSource.getPage([categorySlug, subflowSlug]);
}

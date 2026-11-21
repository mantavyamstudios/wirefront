import { ImageResponse } from "next/og";

import { source } from "@/lib/docs/source";
import { getScreenGroup, getScreenKind } from "@/lib/screens/data";
import { screensSource } from "@/lib/screens/source";
import type { OgPageContent as OgPageData } from "@/lib/og/og-shared";
import {
  getOgFontData,
  OG_FONT_FAMILY,
  OgImageFrame,
} from "@/lib/og/og-shared";
import {
  SITE_DESCRIPTION,
  SITE_OG_HERO_SUBLINE,
  SITE_OG_HERO_TITLE,
} from "@/lib/site";

export type { OgPageContent } from "@/lib/og/og-shared";

const SITE_DEFAULT: OgPageData = {
  title: SITE_OG_HERO_TITLE,
  description: `${SITE_OG_HERO_SUBLINE}. ${SITE_DESCRIPTION}`,
};

const SCREENS_INDEX: OgPageData = {
  title: "Screens",
  description:
    "Production-grade UI screens, organised by the experience they serve.",
};

function pageContent(
  page: { data: { title: string; description?: string } } | undefined
): OgPageData | null {
  return page
    ? { title: page.data.title, description: page.data.description }
    : null;
}

/**
 * `[]` → site; `["screens"]` → the gallery; `["screens", group]`,
 * `["screens", group, kind]` and `["screens", group, kind, screen]` → those
 * pages; anything else → a docs page.
 */
export function resolveOgPage(slug: string[]): OgPageData | null {
  if (slug.length === 0) {
    return SITE_DEFAULT;
  }
  if (slug[0] === "screens") {
    const [, group, kind, screen] = slug;
    if (!group) {
      return SCREENS_INDEX;
    }
    if (!kind) {
      const found = getScreenGroup(group);
      return found ? { title: found.title, description: found.meaning } : null;
    }
    if (!screen) {
      const found = getScreenKind(group, kind);
      return found ? { title: found.title, description: found.blurb } : null;
    }
    return pageContent(screensSource.getPage([group, kind, screen]));
  }
  if (slug.length === 1 && slug[0] === "index") {
    return pageContent(source.getPage([]));
  }
  return pageContent(source.getPage(slug));
}

export async function createOgImageResponse(
  content: OgPageData
): Promise<ImageResponse> {
  return new ImageResponse(<OgImageFrame {...content} />, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: OG_FONT_FAMILY,
        data: await getOgFontData(),
        style: "normal",
        weight: 500,
      },
    ],
  });
}

export async function getCachedOgImageBuffer(
  pageSlug: string[]
): Promise<ArrayBuffer | null> {
  const content = resolveOgPage(pageSlug);
  if (!content) {
    return null;
  }

  const response = await createOgImageResponse(content);
  return await response.arrayBuffer();
}

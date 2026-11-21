import { ImageResponse } from "next/og";

import { source } from "@/lib/docs/source";
import type { OgPageContent as OgPageData } from "@/lib/og/og-shared";
import {
  getOgFontData,
  OG_FONT_FAMILY,
  OgImageFrame,
} from "@/lib/og/og-shared";
import { getScreenGroup, getScreenKind } from "@/lib/screens/data";
import { screensSource } from "@/lib/screens/source";
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

const pageContent = (
  page: { data: { title: string; description?: string } } | undefined
): OgPageData | null =>
  page ? { title: page.data.title, description: page.data.description } : null;

/**
 * `[]` → site; `["screens"]` → the gallery; `["screens", group]`,
 * `["screens", group, kind]` and `["screens", group, kind, screen]` → those
 * pages; anything else → a docs page.
 */
export const resolveOgPage = (slug: string[]): OgPageData | null => {
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
};

/**
 * The OG font has no ⌘ glyph, and next/og's fallback download for it fails,
 * so the image spells it out: "⌘K" reads "Cmd-K", a lone "⌘" reads "Cmd".
 */
const ogText = (text: string): string =>
  text.replaceAll(/⌘(?=[A-Za-z0-9])/gu, "Cmd-").replaceAll("⌘", "Cmd");

export const createOgImageResponse = async (
  content: OgPageData
): Promise<ImageResponse> => {
  const frame = {
    ...content,
    title: ogText(content.title),
    description: content.description && ogText(content.description),
  };
  return new ImageResponse(<OgImageFrame {...frame} />, {
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
};

export const getCachedOgImageBuffer = async (
  pageSlug: string[]
): Promise<ArrayBuffer | null> => {
  const content = resolveOgPage(pageSlug);
  if (!content) {
    return null;
  }

  const response = await createOgImageResponse(content);
  return await response.arrayBuffer();
};

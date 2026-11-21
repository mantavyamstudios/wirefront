import type { Metadata } from "next";

import {
  getOgMetadataImages,
  getTwitterMetadataImages,
} from "@/lib/og/og-paths";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/** Open Graph + Twitter card for the screens pages (image from `/docs-og/...`). */
export function screenSocialMetadata(
  ogPath: string[],
  title: string,
  description: string | undefined,
  url: string
): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${url}`,
      siteName: SITE_NAME,
      images: getOgMetadataImages(ogPath, title),
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: getTwitterMetadataImages(ogPath),
    },
  };
}

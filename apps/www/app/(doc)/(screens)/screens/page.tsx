import type { Metadata } from "next";

import { BlocksScrollArea } from "@/components/blocks/blocks-scroll-area";
import { ComponentsGalleryHero } from "@/components/blocks/gallery/components-gallery-hero";
import { ScreensGalleryExplorer } from "@/components/screens/screens-gallery-explorer";
import { getScreenGalleryItems, getScreenGallerySections, getScreenTotals } from "@/lib/screens/data";
import { screenSocialMetadata } from "@/lib/og/screen-social-metadata";
import { getPageAlternates } from "@/lib/site";

const title = "Screens";
const description =
  "Production-grade UI screens, organised by the experience they serve. Install any screen with the shadcn CLI and wire it to your backend.";

export const metadata: Metadata = {
  title,
  description,
  alternates: getPageAlternates("/screens"),
  ...screenSocialMetadata(["screens"], title, description, "/screens"),
};

export default function ScreensPage() {
  const totals = getScreenTotals();

  return (
    <BlocksScrollArea className="h-full min-h-0 flex-1">
      <div className="relative flex flex-col items-center overflow-visible px-6 lg:px-10">
        <div className="relative z-10 flex w-full flex-col items-center justify-center pt-24 md:pt-32 lg:pt-40">
          <ComponentsGalleryHero
            description={description}
            showStackIcons={false}
            stackLabel={`shadcn/ui · ${totals.groups} groups · ${totals.kinds} kinds · ${totals.screens} screens`}
            title="Ready-to-wire screens for any backend."
          />
        </div>

        <ScreensGalleryExplorer items={getScreenGalleryItems()} sections={getScreenGallerySections()} />
      </div>
    </BlocksScrollArea>
  );
}

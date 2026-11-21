import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlocksScrollArea } from "@/components/blocks/blocks-scroll-area";
import { ComponentsGalleryHero } from "@/components/blocks/gallery/components-gallery-hero";
import { ScreensGalleryExplorer } from "@/components/screens/screens-gallery-explorer";
import { getScreenGalleryItems, getScreenGallerySections, getScreenGroup, getScreenGroups } from "@/lib/screens/data";
import { screenSocialMetadata } from "@/lib/og/screen-social-metadata";
import { getPageAlternates } from "@/lib/site";

interface PageProps {
  params: Promise<{ group: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getScreenGroups().map((g) => ({ group: g.slug }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { group } = await props.params;
  const found = getScreenGroup(group);
  if (!found) {
    return {};
  }
  return {
    title: found.title,
    description: found.meaning,
    alternates: getPageAlternates(`/${group}`),
    ...screenSocialMetadata(["screens", group], found.title, found.meaning, `/${group}`),
  };
}

/** One group's kinds and their screens. */
export default async function GroupPage(props: PageProps) {
  const { group } = await props.params;
  const found = getScreenGroup(group);
  if (!found) {
    notFound();
  }
  const kinds = new Set(found.kinds.map((k) => k.slug));
  const screens = found.kinds.reduce((n, k) => n + k.screens.length, 0);

  return (
    <BlocksScrollArea className="h-full min-h-0 flex-1">
      <div className="relative flex flex-col items-center overflow-visible px-6 lg:px-10">
        <div className="relative z-10 flex w-full flex-col items-center justify-center pt-24 md:pt-32 lg:pt-40">
          <ComponentsGalleryHero
            description={found.meaning}
            showStackIcons={false}
            stackLabel={`${found.kinds.length} kinds · ${screens} screens`}
            title={found.title}
          />
        </div>

        <ScreensGalleryExplorer
          items={getScreenGalleryItems().filter((item) => item.category && kinds.has(item.category))}
          sections={getScreenGallerySections(group)}
        />
      </div>
    </BlocksScrollArea>
  );
}

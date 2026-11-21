import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlocksScrollArea } from "@/components/blocks/blocks-scroll-area";
import { ComponentsGalleryHero } from "@/components/blocks/gallery/components-gallery-hero";
import { ScreensGalleryExplorer } from "@/components/screens/screens-gallery-explorer";
import { screenSocialMetadata } from "@/lib/og/screen-social-metadata";
import {
  getScreenGalleryItems,
  getScreenGallerySections,
  getScreenGroups,
  getScreenKind,
} from "@/lib/screens/data";
import { getPageAlternates } from "@/lib/site";

interface PageProps {
  params: Promise<{ group: string; kind: string }>;
}

export const dynamicParams = false;

export const generateStaticParams = () =>
  getScreenGroups().flatMap((g) =>
    g.kinds.map((k) => ({ group: g.slug, kind: k.slug }))
  );

export const generateMetadata = async (props: PageProps): Promise<Metadata> => {
  const { group, kind } = await props.params;
  const found = getScreenKind(group, kind);
  if (!found) {
    return {};
  }
  const href = `/${group}/${kind}`;
  return {
    title: found.title,
    description: found.blurb,
    alternates: getPageAlternates(href),
    ...screenSocialMetadata(
      ["screens", group, kind],
      found.title,
      found.blurb,
      href
    ),
  };
};

/** One kind's screens, e.g. /accounts/pricing. */
const KindPage = async (props: PageProps) => {
  const { group, kind } = await props.params;
  const found = getScreenKind(group, kind);
  if (!found) {
    notFound();
  }

  return (
    <BlocksScrollArea className="h-full min-h-0 flex-1">
      <div className="relative flex flex-col items-center overflow-visible px-6 lg:px-10">
        <div className="relative z-10 flex w-full flex-col items-center justify-center pt-24 md:pt-32 lg:pt-40">
          <ComponentsGalleryHero
            description={found.blurb}
            showStackIcons={false}
            stackLabel={`${found.screens.length} screens`}
            title={found.title}
          />
        </div>

        <ScreensGalleryExplorer
          items={getScreenGalleryItems().filter(
            (item) => item.category === kind
          )}
          sections={getScreenGallerySections(group).filter(
            (s) => s.id === kind
          )}
        />
      </div>
    </BlocksScrollArea>
  );
};

export default KindPage;

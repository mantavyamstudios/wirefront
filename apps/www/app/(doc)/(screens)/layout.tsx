import type { ReactNode } from "react";

import { BlocksSectionProvider } from "@/components/blocks/blocks-section-context";
import { ComponentsRouteLayout } from "@/components/blocks/components-route-layout";
import { ScreensDetailFrame } from "@/components/screens/screens-detail-frame";
import { getReleaseDatesByUrl } from "@/lib/docs/get-release-dates-by-url";
import { source } from "@/lib/docs/source";
import {
  getScreenDetails,
  getScreenGalleryItems,
  getScreenGallerySections,
  getScreenGroups,
} from "@/lib/screens/data";

/** Every gallery index: all screens, each group and each kind. */
const SCREENS_GALLERY_PATHS = [
  "/screens",
  ...getScreenGroups().flatMap((g) => [
    `/${g.slug}`,
    ...g.kinds.map((k) => `/${g.slug}/${k.slug}`),
  ]),
];

/** Same shell as `/blocks`, fed with the Wirefront screens catalogue. */
const ScreensLayout = ({ children }: { children: ReactNode }) => {
  const navItems = getScreenGalleryItems();
  const section = {
    allLabel: "All Screens",
    basePath: "/screens",
    label: "Screens",
    // One collapsible sidebar group per kind, in group order.
    groups: getScreenGallerySections().map(({ id, title }) => ({ id, title })),
  };

  return (
    <BlocksSectionProvider value={section}>
      <ComponentsRouteLayout
        galleryPaths={SCREENS_GALLERY_PATHS}
        navItems={navItems}
        releaseDatesByUrl={getReleaseDatesByUrl()}
        tree={source.pageTree}
      >
        <ScreensDetailFrame details={getScreenDetails()} navItems={navItems}>
          {children}
        </ScreensDetailFrame>
      </ComponentsRouteLayout>
    </BlocksSectionProvider>
  );
};

export default ScreensLayout;

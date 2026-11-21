import type { ReactNode } from "react";

import { BlocksSectionProvider } from "@/components/blocks/blocks-section-context";
import { ComponentsRouteLayout } from "@/components/blocks/components-route-layout";
import { FlowsDetailFrame } from "@/components/flows/flows-detail-frame";
import { getReleaseDatesByUrl } from "@/lib/docs/get-release-dates-by-url";
import { source } from "@/lib/docs/source";
import {
  getFlowDetails,
  getFlowGalleryItems,
  getFlowGallerySections,
} from "@/lib/flows/data";

const FLOWS_GALLERY_PATHS = ["/flows"];

/** Same shell as `/blocks`, fed with the Flutter flows catalogue. */
export default function FlowsLayout({ children }: { children: ReactNode }) {
  const navItems = getFlowGalleryItems();
  const section = {
    allLabel: "All Flows",
    basePath: "/flows",
    label: "Flows",
    // One collapsible sidebar group per category, in catalogue order.
    groups: getFlowGallerySections().map(({ id, title }) => ({ id, title })),
  };

  return (
    <BlocksSectionProvider value={section}>
      <ComponentsRouteLayout
        galleryPaths={FLOWS_GALLERY_PATHS}
        navItems={navItems}
        releaseDatesByUrl={getReleaseDatesByUrl()}
        tree={source.pageTree}
      >
        <FlowsDetailFrame details={getFlowDetails()} navItems={navItems}>
          {children}
        </FlowsDetailFrame>
      </ComponentsRouteLayout>
    </BlocksSectionProvider>
  );
}

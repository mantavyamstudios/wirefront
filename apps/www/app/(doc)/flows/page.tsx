import type { Metadata } from "next";

import { BlocksScrollArea } from "@/components/blocks/blocks-scroll-area";
import { ComponentsGalleryHero } from "@/components/blocks/gallery/components-gallery-hero";
import { FlowsGalleryExplorer } from "@/components/flows/flows-gallery-explorer";
import {
  getFlowCategories,
  getFlowGalleryItems,
  getFlowGallerySections,
} from "@/lib/flows/data";
import { flowSocialMetadata } from "@/lib/og/flow-social-metadata";
import { getPageAlternates } from "@/lib/site";

const title = "Flows";
const description =
  "Live Flutter user flows you can click through in the browser, from sign-in to checkout.";

export const metadata: Metadata = {
  title,
  description,
  alternates: getPageAlternates("/flows"),
  ...flowSocialMetadata(["flows"], title, description, "/flows"),
};

export default function FlowsPage() {
  const categories = getFlowCategories();
  const subflowCount = categories.reduce(
    (count, category) => count + category.subflows.length,
    0
  );

  return (
    <BlocksScrollArea className="h-full min-h-0 flex-1">
      <div className="relative flex flex-col items-center overflow-visible px-6 lg:px-10">
        <div className="relative z-10 flex w-full flex-col items-center justify-center pt-24 md:pt-32 lg:pt-40">
          <ComponentsGalleryHero
            description={description}
            showStackIcons={false}
            stackLabel={`Flutter · ${categories.length} categories · ${subflowCount} flows`}
            title="Real Flutter flows. Live in your browser."
          />
        </div>

        <FlowsGalleryExplorer
          items={getFlowGalleryItems()}
          sections={getFlowGallerySections()}
        />
      </div>
    </BlocksScrollArea>
  );
}

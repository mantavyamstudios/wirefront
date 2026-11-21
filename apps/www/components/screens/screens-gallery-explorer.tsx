"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { ComponentGalleryExplorer } from "@/components/blocks/gallery/component-gallery-explorer";
import { usePageTransition } from "@/components/page-transition/page-transition-provider";
import { HoverExpand } from "@/components/unlumen-ui/hover-expand";
import type { ComponentGallerySection } from "@/lib/registry/component-gallery-sections";
import type { ComponentGalleryItem } from "@/lib/registry/types";

import {
  consumePendingScreensSection,
  smoothScrollToSection,
} from "./screens-anchor-links";

const COLLAPSED_HEIGHT = 68;
/** The shell settles (fonts, cards, nav) shortly after arriving. */
const SETTLE_MS = 600;
/** Upper bound on waiting for the shell's page-transition overlay to clear. */
const TRANSITION_WAIT_MS = 4000;

/**
 * Brings the right category heading into view on arrival:
 * - from a category link on another page: glide down once the page
 *   transition has cleared and the shell has settled;
 * - from a deep link (`/screens#auth`): Next.js lands there, then the heading
 *   is re-aligned after the shell shifts, unless the visitor already scrolled.
 */
function useArrivalSection() {
  const { isTransitioning } = usePageTransition();
  const [pending] = useState(consumePendingScreensSection);
  const [waitedOut, setWaitedOut] = useState(false);

  useEffect(() => {
    if (!pending) {
      return;
    }
    const timer = window.setTimeout(
      () => setWaitedOut(true),
      TRANSITION_WAIT_MS
    );
    return () => window.clearTimeout(timer);
  }, [pending]);

  const ready = Boolean(pending) && (!isTransitioning || waitedOut);
  useEffect(() => {
    if (!(ready && pending)) {
      return;
    }
    const timer = window.setTimeout(() => {
      window.history.replaceState(null, "", `#${pending}`);
      smoothScrollToSection(pending);
    }, SETTLE_MS / 3);
    return () => window.clearTimeout(timer);
  }, [ready, pending]);

  useEffect(() => {
    if (pending) {
      return;
    }
    const align = () => {
      // Category slugs are plain ASCII, so the raw hash is the id.
      const id = window.location.hash.slice(1);
      if (id) {
        document
          .querySelector(`#${CSS.escape(id)}`)
          ?.scrollIntoView({ block: "start" });
      }
    };
    const timer = window.setTimeout(align, SETTLE_MS);
    const cancel = () => window.clearTimeout(timer);
    const userEvents = ["wheel", "touchstart", "keydown", "pointerdown"];
    for (const name of userEvents) {
      window.addEventListener(name, cancel, { passive: true });
    }
    return () => {
      cancel();
      for (const name of userEvents) {
        window.removeEventListener(name, cancel);
      }
    };
  }, [pending]);
}
const EXPANDED_HEIGHT = 440;

/**
 * The screen's preview across the full row width, above the row's text band
 * (the collapsed height), so the title never sits on the image.
 */
function ScreenRowMedia({ item }: { item: ComponentGalleryItem }) {
  const poster = item.cardPreview?.poster;
  return (
    <div className="bg-muted/60 absolute inset-x-0 top-0 overflow-hidden" style={{ bottom: COLLAPSED_HEIGHT }}>
      {poster ? <Image alt="" className="object-cover object-top" fill sizes="100vw" src={poster} /> : null}
    </div>
  );
}

function ScreensList({ items }: { items: ComponentGalleryItem[] }) {
  return (
    <HoverExpand
      collapsedHeight={COLLAPSED_HEIGHT}
      expandedHeight={EXPANDED_HEIGHT}
      items={items.map((item) => ({
        label: item.title,
        description: item.description,
        href: item.href,
        media: <ScreenRowMedia item={item} />,
      }))}
    />
  );
}

/**
 * The shell's gallery explorer with the list view swapped for Hover Expand rows
 * that reveal each screen's preview.
 */
export function ScreensGalleryExplorer({
  items,
  sections,
}: {
  items: ComponentGalleryItem[];
  sections: ComponentGallerySection[];
}) {
  useArrivalSection();

  return (
    <ComponentGalleryExplorer
      items={items}
      renderList={(sectionItems) => <ScreensList items={sectionItems} />}
      sections={sections}
    />
  );
}

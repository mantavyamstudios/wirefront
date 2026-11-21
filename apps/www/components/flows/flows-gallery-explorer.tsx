"use client";

import { useEffect, useState } from "react";

import { ComponentGalleryExplorer } from "@/components/blocks/gallery/component-gallery-explorer";
import { usePageTransition } from "@/components/page-transition/page-transition-provider";
import { HoverExpand } from "@/components/unlumen-ui/hover-expand";
import type { ComponentGallerySection } from "@/lib/registry/component-gallery-sections";
import type { ComponentGalleryItem } from "@/lib/registry/types";

import { FlowCardPreview } from "./flow-card-preview";
import {
  consumePendingFlowsSection,
  smoothScrollToSection,
} from "./flows-anchor-links";

const COLLAPSED_HEIGHT = 68;
/** The shell settles (fonts, cards, nav) shortly after arriving. */
const SETTLE_MS = 600;
/** Upper bound on waiting for the shell's page-transition overlay to clear. */
const TRANSITION_WAIT_MS = 4000;

/**
 * Brings the right category heading into view on arrival:
 * - from a category link on another page: glide down once the page
 *   transition has cleared and the shell has settled;
 * - from a deep link (`/flows#social`): Next.js lands there, then the heading
 *   is re-aligned after the shell shifts, unless the visitor already scrolled.
 */
function useArrivalSection() {
  const { isTransitioning } = usePageTransition();
  const [pending] = useState(consumePendingFlowsSection);
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
 * The two-screen flow card across the full row width, above the row's text
 * band (the collapsed height), so the title never sits on the screens.
 */
function FlowRowMedia({ item }: { item: ComponentGalleryItem }) {
  const flow = item.cardPreview?.flow;
  return (
    <div
      className="bg-muted/60 absolute inset-x-0 top-0"
      style={{ bottom: COLLAPSED_HEIGHT }}
    >
      {flow ? <FlowCardPreview active media={flow} /> : null}
    </div>
  );
}

function FlowsList({ items }: { items: ComponentGalleryItem[] }) {
  return (
    <HoverExpand
      collapsedHeight={COLLAPSED_HEIGHT}
      expandedHeight={EXPANDED_HEIGHT}
      items={items.map((item) => ({
        label: item.title,
        description: item.description,
        href: item.href,
        media: <FlowRowMedia item={item} />,
      }))}
    />
  );
}

/**
 * The shell's gallery explorer with the list view swapped for Hover Expand rows
 * that reveal each flow's two-screen card.
 */
export function FlowsGalleryExplorer({
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
      renderList={(sectionItems) => <FlowsList items={sectionItems} />}
      sections={sections}
    />
  );
}

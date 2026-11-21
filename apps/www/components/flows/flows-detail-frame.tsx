"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";

import { ComponentPageLayoutClient } from "@/components/blocks/blocks-layout-client";
import type { FlowDetail } from "@/lib/flows/data";
import type { ComponentGalleryItem } from "@/lib/registry/types";

import { FlowsRuntimeFrame } from "./flows-runtime-frame";
import type { FlowsRuntimeHandle } from "./flows-runtime-frame";

interface FlowsDetailFrameProps {
  children: ReactNode;
  details: FlowDetail[];
  navItems: ComponentGalleryItem[];
}

const runtimeUrl = (detail: FlowDetail) =>
  `/runtime/index.html?${new URLSearchParams({
    flow: detail.categorySlug,
    sub: detail.subflowSlug,
  }).toString()}`;

/**
 * Lives in the `/flows` layout, so the shell's split view (and the Flutter iframe
 * inside its preview panel) stays mounted while the user moves between
 * subflows. Each page only supplies the docs column (`children`).
 */
export function FlowsDetailFrame({
  children,
  details,
  navItems,
}: FlowsDetailFrameProps) {
  const pathname = usePathname();
  const runtimeRef = useRef<FlowsRuntimeHandle>(null);
  const byHref = useMemo(
    () => new Map(details.map((detail) => [detail.href, detail])),
    [details]
  );
  const detail = byHref.get(pathname);

  // Each page segment is only the docs column, so Next.js scrolls *it* into
  // view on navigation; on stacked layouts that lands below the preview.
  // Start every subflow at the top instead (preview first, then the shell's
  // "Documentation" pill), and reset the reused desktop docs column too.
  useEffect(() => {
    if (!pathname) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      for (const selector of [
        "[data-blocks-scroll-root]",
        "[data-blocks-docs-scroller]",
      ]) {
        document.querySelector(selector)?.scrollTo({ top: 0 });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  if (!detail) {
    return children;
  }

  return (
    <ComponentPageLayoutClient
      exampleUrl={runtimeUrl(detail)}
      githubPath={detail.githubPath}
      header={detail.header}
      navItems={navItems}
      nextNav={detail.next}
      onRestart={() => runtimeRef.current?.reset()}
      preview={
        <FlowsRuntimeFrame
          categorySlug={detail.categorySlug}
          initialSrc={runtimeUrl(detail)}
          ref={runtimeRef}
          subflowSlug={detail.subflowSlug}
        />
      }
      previewName="flows-runtime"
      previousNav={detail.previous}
      registryName="flows-runtime"
      sourceUrl={`/api/flows/source/${detail.categorySlug}/${detail.subflowSlug}`}
      toc={detail.toc}
    >
      {children}
    </ComponentPageLayoutClient>
  );
}

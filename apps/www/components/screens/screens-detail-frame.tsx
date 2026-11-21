"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";

import { ComponentPageLayoutClient } from "@/components/blocks/blocks-layout-client";
import type { ScreenDetail } from "@/lib/screens/data";
import type { ComponentGalleryItem } from "@/lib/registry/types";

import { ScreensRuntimeFrame } from "./screens-runtime-frame";
import type { ScreensRuntimeHandle } from "./screens-runtime-frame";

interface ScreensDetailFrameProps {
  children: ReactNode;
  details: ScreenDetail[];
  navItems: ComponentGalleryItem[];
}

/** The runtime page for one screen; same origin in production, the runtime's dev server in development. */
const runtimeUrl = (detail: ScreenDetail) =>
  `${process.env.NEXT_PUBLIC_RUNTIME_ORIGIN ?? ""}/preview/${detail.kindSlug}/${detail.screenSlug}`;

/**
 * Lives in the screens layout, so the shell's split view (and the runtime iframe
 * inside its preview panel) stays mounted while the user moves between
 * screens. Each page only supplies the docs column (`children`).
 */
export function ScreensDetailFrame({
  children,
  details,
  navItems,
}: ScreensDetailFrameProps) {
  const pathname = usePathname();
  const runtimeRef = useRef<ScreensRuntimeHandle>(null);
  const byHref = useMemo(
    () => new Map(details.map((detail) => [detail.href, detail])),
    [details]
  );
  const detail = byHref.get(pathname);

  // Each page segment is only the docs column, so Next.js scrolls *it* into
  // view on navigation; on stacked layouts that lands below the preview.
  // Start every screen at the top instead (preview first, then the shell's
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
        <ScreensRuntimeFrame
          initialSrc={runtimeUrl(detail)}
          kindSlug={detail.kindSlug}
          ref={runtimeRef}
          screenSlug={detail.screenSlug}
          states={detail.states}
        />
      }
      previewName="screens-runtime"
      previousNav={detail.previous}
      registryName={detail.registry}
      sourceUrl={`/api/screens/source/${detail.kindSlug}/${detail.screenSlug}`}
      toc={detail.toc}
    >
      {children}
    </ComponentPageLayoutClient>
  );
}
